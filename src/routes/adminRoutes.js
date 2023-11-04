const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment-timezone')

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

require("../db/conn");
const VehicleEntry = require('../models/vehicleEntry');

router.get("/dashboard", async (req, res) => {
  const userId = req.query.id;
  const matchingUser = parkingLotsData.find(user => user.id === parseInt(userId, 10));
  if (matchingUser) {
    // User data is found, and you can use it in your dashboard
    res.render('dashboard', { user: matchingUser }); // Assuming you're using a template engine like EJS or Handlebars
} else {
    // Handle the case where the user is not found
    console.log("User not found");
}
  try {
    const totalCount = await VehicleEntry.countDocuments({});
    const inCount = await VehicleEntry.countDocuments({ status: 'In' });
    const outCount = await VehicleEntry.countDocuments({ status: 'Out' });

    // Calculate the date 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const within24HoursCount = await VehicleEntry.countDocuments({
      inTime: { $gte: twentyFourHoursAgo }
    });


    res.render("adminViews/dashboard", {
      page: 'dashboard',
      totalCount,
      inCount,
      outCount,
      within24HoursCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while counting entries.");
  }
});







router.get('/in-vehicles', async (req, res) => {
  try {
    const vehicles = await VehicleEntry.find({ status: "In" }); // Fetch all entries from the database
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


router.get('/out-vehicles', async (req, res) => {
  try {

    const status = await VehicleEntry.find({ status: "Out" });
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

router.get('/total-income', async (req, res) => {
  try {
    // Get today's date and yesterday's date
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');

    // Fetch all entries for today
    const todayEntries = await VehicleEntry.find({
      inTime: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() }
    });

    // Fetch all entries for yesterday
    const yesterdayEntries = await VehicleEntry.find({
      inTime: { $gte: yesterday.toDate(), $lt: moment(yesterday).endOf('day').toDate() }
    });

    // Calculate the total income
    const totalIncome = (await VehicleEntry.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCharge' } } }
    ]))[0].total;

    // Calculate today's income
    const todaysIncome = todayEntries.reduce((sum, entry) => sum + entry.totalCharge, 0);

    // Calculate yesterday's income
    const yesterdaysIncome = yesterdayEntries.reduce((sum, entry) => sum + entry.totalCharge, 0);


    res.render('adminViews/total-income', { page: 'total-income', totalIncome, todaysIncome, yesterdaysIncome });
  } catch (error) {
    console.error('Error fetching income details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});



router.get('/manage-vehicles', (req, res) => {
  res.render('adminViews/manage-vehicles', { page: 'manage-vehicles' })
})
router.get('/outgoing-detail', (req, res) => {
  res.render('adminViews/outgoing-detail')
});


router.post('/search', async (req, res) => {
  try {
    const { searchdata } = req.body;

    // Perform a Mongoose query to find documents with matching registrationnumber
    const matchingEntries = await VehicleEntry.find({ registrationnumber: searchdata });

    if (matchingEntries.length > 0) {
      // Send the matching data to the 'adminViews/search' page
      res.render('adminViews/search', { matchingEntries });
    } else {
      // Handle the case when no matching entries are found
      res.render('adminViews/search', { noMatch: true });
    }
  } catch (error) {
    // Handle any errors here
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



/////////////////////////////////////////////////////
router.post("/manage-vehicles", async (req, res) => {
  try {
    const { ownername, ownercontno, catename, vehcomp, vehreno, model, status } = req.body;

    // Check for an existing entry with the same registrationNumber, status 'In', and inTime
    const existingEntry = await VehicleEntry.findOne({
      registrationNumber: vehreno,
      status: 'In',
      inTime: { $lte: new Date() }, // Ensure the inTime is less than or equal to the current time
    });

    if (existingEntry) {
      return res.status(400).render('./adminViews/manage-vehicles', { message: 'Duplicate entry. Please check the data.' });
    }

    const parkingNumber = Math.floor(10000 + Math.random() * 90000);
    const currentTime = moment().tz('Asia/Kolkata');

    const newVehicle = new VehicleEntry({
      parkingNumber: "CA-" + parkingNumber,
      ownerName: ownername,
      ownerContactNumber: ownercontno,
      registrationNumber: vehreno,
      vehicleCategory: catename,
      vehicleCompanyname: vehcomp,
      vehicleModel: model,
      inTime: currentTime.toDate()
    });

    const registered = await newVehicle.save();
    return res.status(200).render('./adminViews/manage-vehicles', { message: 'Booked successfully' });
  } catch (error) {
    console.error("Error during registration:", error);
    if (error.code === 11000) {
      return res.status(400).render('./adminViews/manage-vehicles', { message: 'Duplicate entry. Please check the data.' });
    }
    res.status(500).send("Internal server error. Please try again later.");
  }
});









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