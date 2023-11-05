const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const session = require('express-session');
const VehicleEntry = require('../models/vehicleEntry');
const parkingLotsData = require('./parkinglot');

// Middleware for Express
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Express session setup
router.use(
  session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: false,
  })
);

// Admin login verification middleware
// Session configuration
router.use(
  session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  })
);

// Admin login verification middleware for POST requests
const adminDetailsPost = (req, res, next) => {
  const ademail = req.body.ademail;
  const adpass = req.body.adpass;
  console.log(ademail, adpass);

  const matchingAdmin = parkingLotsData.find(
    (admin) =>
      admin.adminAuth.username === ademail && admin.adminAuth.password === adpass
  );

  if (matchingAdmin) {
    req.session.adminDetails = matchingAdmin;
    next();
  } else {
    console.log('Admin not found or invalid credentials');
    res.redirect('/adminLogin');
  }
};

// Admin login verification middleware for GET requests
const adminDetailsGet = (req, res, next) => {
  const details = req.session.adminDetails;
  if (details) {
    next();
  } else {
    res.redirect('/adminLogin');
  }
};

// Route for the admin login page
router.get('/adminLogin', (req, res) => {
  res.render('adminViews/adminLogin');
});

// Route for the admin login post request
router.post('/adminLogin', adminDetailsPost, (req, res) => {
  const details=req.session.adminDetails;
  res.redirect('/dashboard');
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
router.get('/dashboard', adminDetailsGet, async (req, res) => {
  try {
    const details = req.session.adminDetails;
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
      totalCount,
      inCount,
      outCount,
      within24HoursCount,
      details,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error occurred while counting entries.');
  }
});
//manage-vehicles
router.get('/manage-vehicles',adminDetailsGet, (req, res) => {
  const details=req.session.adminDetails;
  if (details) {
    res.render('adminViews/manage-vehicles', { details, page: 'manage-vehicles' })
  } else {
    res.redirect('/adminLogin');
  }
});
router.post("/manage-vehicles", adminDetailsGet, async (req, res) => {
  const details = req.session.adminDetails;
  console.log(details.name);
  try {
    // Extracting necessary information from the request body
    const { ownername, ownercontno, catename, vehcomp, vehreno, model, status ,spotsavailable} = req.body;

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
    console.log("Parking Number:", parkingNumber);
    console.log("Current Time:", currentTime);

    // Create a new instance of VehicleEntry with the extracted information and save it
    const newVehicle = new VehicleEntry({
      parkinglotName: details.name,
      availableSpots: details.totalSpots,
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

    const registered = await newVehicle.save();
    
  details.totalSpots=availabeSlots -= 1;

    // Render a success message upon successful save
    console.log("Vehicle entry successfully saved.");
    return res.status(200).render('./adminViews/manage-vehicles', {details,availabeSlots, message: 'Booked successfully' });
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




router.get('/in-vehicles',adminDetailsGet, async (req, res) => {
  try {
    const details = req.session.adminDetails;
    const vehicles = await VehicleEntry.find({ status: "In" , parkinglotName: details.name}); // Fetch all entries from the database
    res.render('adminViews/in-vehicles', { vehicles, page: 'in-vehicles' }); // Pass the data to the 'in-vehicles' view
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(400).send('error'); // Redirect to an error page or another route in case of an error
  }
});

router.get('/update-incomingdetail/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const vehicleDetail = await VehicleEntry.findById(id);



    // Get the current time as the outTime
    const outTime = moment.tz('Asia/Kolkata');

    // Calculate the difference between outTime and inTime in hours
    const inTime = moment(vehicleDetail.inTime);
    const timeDiffInMins = outTime.diff(inTime, 'minutes');

    // Calculate the total charges based on the rate per hour
    const ratePerHour = 1000; // Set your own rate per hour here
    let totalCharges = (timeDiffInMins / 60) * ratePerHour;

    // Round the total charges to the nearest whole number
    totalCharges = Math.round(totalCharges);

    await VehicleEntry.findByIdAndUpdate(id, { totalCharge: totalCharges });

    res.render('adminViews/update-incomingdetail', { outTime, vehicleDetail, totalCharges, page: 'update-incomingdetail' });
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


router.get('/out-vehicles',adminDetailsGet, async (req, res) => {
  try {
    const details = req.session.adminDetails;
    const status = await VehicleEntry.find({ status: "Out" , parkinglotName: details.name});
    res.render('adminViews/out-vehicles', { status, page: 'out-vehicles' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});

router.get('/outgoing-detail/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const vehicleInfo = await VehicleEntry.findById(id);

    res.render('adminViews/outgoing-detail', { vehicleInfo, page: 'outgoing-detail' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});






router.get('/out-vehicles', (req, res) => {
  res.render('adminViews/out-vehicles', { page: 'out-vehicles' })
})

router.get('/total-income', adminDetailsGet, async (req, res) => {
  try {
    const details = req.session.adminDetails;

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





router.get('/outgoing-detail', (req, res) => {
  res.render('adminViews/outgoing-detail')
});



/////////////////////////////////////////////////////










router.post('/update-incomingdetail/:id', async (req, res) => {
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