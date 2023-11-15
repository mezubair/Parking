const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const session = require('express-session');
const VehicleEntry = require('../models/vehicleEntry');
const parkingLots = require('../models/parkingLot');

// Middleware for Express
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Admin login verification middleware
// Session configuration
router.use(
  session({
    secret: 'mySecret',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60  * 1000 }
  })
);

// Admin login verification middleware for POST requests
const adminDetails = (req, res, next) => {
  if (req.session.admin && req.session.adminDetails) {
    next();
  } else {
    res.redirect('/adminLogin');
  }
};

// Route for the admin login page
router.get('/adminLogin',(req, res) => {
  res.render('adminViews/adminLogin');
});

// Route for the admin login post request

router.post('/adminLogin', async (req, res) => {
  const { ademail, adpass } = req.body;

  try {
    const admin = await parkingLots.findOne({
      'adminAuth.username': ademail,
      'adminAuth.password': adpass,
    }); // Make sure 'parkingLots' refers to the correct Mongoose model

    if (admin) {
      req.session.admin = admin; // Store user data in the session
      req.session.adminDetails = true; // Set isAdmin flag in the session
      res.redirect('/dashboard');
    } else {
      res.send('Invalid username or password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/adminLogin');
  });
});
// Route for the dashboard
router.get('/dashboard', adminDetails, async (req, res) => {
  try {
    const details = req.session.admin;
    const totalCount = await VehicleEntry.countDocuments({
      parkinglotName: details.name,
    });
    const inCount = await VehicleEntry.countDocuments({
      status: 'In',
      parkinglotName: details.name,
    });
    const outCount = await VehicleEntry.countDocuments({
      status: 'Out',
      parkinglotName: details.name,
    });

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const within24HoursCount = await VehicleEntry.countDocuments({
      inTime: { $gte: twentyFourHoursAgo },
      parkinglotName: details.name,
    });

    res.render('adminViews/dashboard', {
      page: 'dashboard',
      parkinglotName:details.name,
      totalCount,
      inCount,
      outCount,
      within24HoursCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error occurred while counting entries.');
  }
});
//manage-vehicles
router.get('/manage-vehicles',adminDetails, (req, res) => {
const details = req.session.admin;
console.log(details)
    res.render('adminViews/manage-vehicles', { details,page: 'manage-vehicles' })
  
});
router.post("/manage-vehicles", adminDetails, async (req, res) => {
  const details = req.session.admin;
  console.log(details.name);
  try {
    // Extracting necessary information from the request body
    const { ownername, ownercontno, catename, vehcomp, vehreno, model} = req.body;

    // Ensure that admin details are available in the session
   
    console.log("Admin details:", details);

    // Check for an existing entry with the same registrationNumber, status 'In', and inTime
    const existingEntry = await VehicleEntry.findOne({
      parkinglotName: details.name,
      registrationNumber: vehreno,
      status: 'In',
      inTime: { $lte: new Date() }, // Ensure the inTime is less than or equal to the current time
    });
    console.log("Existing entry:", existingEntry);

    // If an existing entry is found, return a duplicate entry error message
    if (existingEntry) {
      console.log("Duplicate entry found. Please check the data.");
      return res.status(400).render('./adminViews/manage-vehicles', {details, message: 'Duplicate entry. Please check the data.' });
    }


    // Generate a random parking number and fetch the current time in Asia/Kolkata timezone
    const parkingNumber = Math.floor(10000 + Math.random() * 90000);
    const currentTime = moment().tz('Asia/Kolkata');
   

    // Create a new instance of VehicleEntry with the extracted information and save it
    const newVehicle = new VehicleEntry({
      parkinglotName: details.name,
      parkingNumber: "CA-" + parkingNumber,
      ownerName: ownername,
      ownerContactNumber: ownercontno,
      registrationNumber: vehreno,
      vehicleCategory: catename,
      vehicleCompanyname: vehcomp,
      vehicleModel: model,
      inTime: currentTime.toDate()
    });
    console.log("New Vehicle:", newVehicle);
    details.totalSpots -=1;
    const registered = await newVehicle.save();
    await parkingLots.findOneAndUpdate(
      { name : details.name }, // Use the appropriate field to identify the specific document
      { $inc: { totalSpots: -1 } } // Decrement the totalSpots field by one
    );


    // Render a success message upon successful save
    console.log("Vehicle entry successfully saved.");
    return res.status(200).render('./adminViews/manage-vehicles', {details, message: 'Booked successfully' });
  } catch (error) {
    console.error("Error during registration:", error);
    // Check for duplicate entry error and handle accordingly
    if (error.code === 11000) {
      console.log("Duplicate entry error. Please check the data.");
      return res.status(400).render('./adminViews/manage-vehicles', {details, message: 'Duplicate entry. Please check the data.' });
    }
    // Handle other potential errors with a generic server error message
    console.log("Internal server error. Please try again later.");
    res.status(500).send("Internal server error. Please try again later.");
  }
});




router.get('/in-vehicles',adminDetails, async (req, res) => {
  try {
    const details = req.session.admin;
    const vehicles = await VehicleEntry.find({ status: "In", parkinglotName: details.name, paymentStatus: { $ne: "awaited" } }); // Fetch all entries from the database
    res.render('adminViews/in-vehicles', { vehicles, page: 'in-vehicles' }); // Pass the data to the 'in-vehicles' view
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(400).send('error'); // Redirect to an error page or another route in case of an error
  }
});

router.get('/update-incomingdetail/:id',adminDetails, async (req, res) => {
  try {
    const details=req.session.admin;
    const id = req.params.id;
    const vehicleDetail = await VehicleEntry.findById(id);



    // Get the current time as the outTime
    const outTime = moment.tz('Asia/Kolkata');

    // Calculate the difference between outTime and inTime in hours
    const inTime = moment(vehicleDetail.inTime);
    const timeDiffInMins = outTime.diff(inTime, 'minutes');

    // Calculate the total charges based on the rate per hour
    const ratePerHour = details.chargesPerHour; // Set your own rate per hour here
    let totalCharges = (timeDiffInMins / 60) * ratePerHour;

    // Round the total charges to the nearest whole number
    totalCharges = Math.round(totalCharges);

    await VehicleEntry.findByIdAndUpdate(id, { totalCharge: totalCharges });
    details.totalSpots +=1;
    await parkingLots.findOneAndUpdate(
      { name : details.name }, // Use the appropriate field to identify the specific document
      { $inc: { totalSpots: +1 } } // Decrement the totalSpots field by one
    );

    res.render('adminViews/update-incomingdetail', { availabeSlots:details.totalSpots,outTime, vehicleDetail, totalCharges, page: 'update-incomingdetail' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});

router.get('/print-receipt/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const printDetail = await VehicleEntry.findById(id);

    res.render('adminViews/print-receipt', { printDetail, page: 'print-receipt' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});


router.get('/out-vehicles',adminDetails, async (req, res) => {
  try {
    const details = req.session.admin;
    const status = await VehicleEntry.find({ status: "Out" , parkinglotName: details.name});
    res.render('adminViews/out-vehicles', { status, page: 'out-vehicles' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});

router.get('/outgoing-detail/:id',adminDetails, async (req, res) => {
  try {
    const id = req.params.id;
    const vehicleInfo = await VehicleEntry.findById(id);

    res.render('adminViews/outgoing-detail', { vehicleInfo, page: 'outgoing-detail' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});






router.get('/out-vehicles',adminDetails, (req, res) => {
  res.render('adminViews/out-vehicles', { page: 'out-vehicles' })
})

router.get('/total-income', adminDetails, async (req, res) => {
  try {
    const details = req.session.admin;

    // Get today's date and yesterday's date
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');

    // Fetch all entries for today where parkingLotName matches details.name
    const todayEntries = await VehicleEntry.find({
      inTime: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() },
      parkinglotName: details.name,
    });

    // Fetch all entries for yesterday where parkingLotName matches details.name
    const yesterdayEntries = await VehicleEntry.find({
      inTime: { $gte: yesterday.toDate(), $lt: moment(yesterday).endOf('day').toDate() },
      parkinglotName: details.name,
    });

    // Calculate the total income where parkingLotName matches details.name
    const totalIncome = (
      await VehicleEntry.aggregate([
        { $match: { parkinglotName: details.name } },
        { $group: { _id: null, total: { $sum: '$totalCharge' } } },
      ])
    )[0]?.total || 0;

    // Calculate today's income where parkingLotName matches details.name
    const todaysIncome = todayEntries.reduce((sum, entry) => sum + entry.totalCharge, 0);

    // Calculate yesterday's income where parkingLotName matches details.name
    const yesterdaysIncome = yesterdayEntries.reduce((sum, entry) => sum + entry.totalCharge, 0);

    res.render('adminViews/total-income', {
      page: 'total-income',
      totalIncome,
      todaysIncome,
      yesterdaysIncome,
    });
  } catch (error) {
    console.error('Error fetching income details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});



router.get('/outgoing-detail',adminDetails, (req, res) => {
  res.render('adminViews/outgoing-detail')
});



/////////////////////////////////////////////////////////////
router.get('/awaited',adminDetails, async (req, res) => {
  try {
    const details = req.session.admin;
    const vehicles = await VehicleEntry.find({ paymentStatus:"awaited",parkinglotName: details.name});
    res.render('adminViews/awaited', { vehicles, page:'awaited' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});


router.post('/update-payment-status/:id', async (req, res) => {
  try {
      const { id } = req.params;

      // Update the payment status to "not paid"
      await VehicleEntry.findByIdAndUpdate(id, { $set: { paymentStatus: 'not paid' } });

      res.redirect('/in-vehicles'); // Redirect back to the awaited page
  } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).send('Internal server error. Please try again later.');
  }
});



/////////////////////////////////////////////////////





router.post('/update-incomingdetail/:id',adminDetails, async (req, res) => {
  try {
    const id = req.params.id;
    const { remark, status } = req.body;

    const vehicleToUpdate = await VehicleEntry.findById(id);

    const existingEntry = await VehicleEntry.findOne({
      _id: { $ne: id },
      status: 'Out',
      inTime: vehicleToUpdate.inTime, // Ensuring the same inTime as the vehicle being updated
    });

    if (existingEntry) {
      return res.status(400).send('Duplicate entry. Vehicle has already been updated to "Out" status.');
    }

    const updatedVehicle = await VehicleEntry.findByIdAndUpdate(
      id,
      {
        remarks: remark,
        status: status,
      },
      { new: true }
    );

    if (!updatedVehicle) {
      return res.status(404).send('Vehicle not found');
    }

    res.redirect('/out-vehicles');
  } catch (error) {
    console.error('Error updating vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});







module.exports = router;