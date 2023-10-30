const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment-timezone')

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

require("../db/conn");
const VehicleEntry = require('../models/vehicleEntry');

router.get("/dashboard", async (req, res) => {
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
      const vehicles = await VehicleEntry.find({status:"In"}); // Fetch all entries from the database
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

        await VehicleEntry.findByIdAndUpdate(id, { totalCharge:totalCharges });
    
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
  
      res.render('adminViews/print-receipt',{printDetail,page:'print-receipt'});
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      res.status(500).send('Internal server error. Please try again later.');
    }
  });


  router.get('/out-vehicles', async (req, res) => {
    try {
   
      const status = await VehicleEntry.find({status:"Out"});
      res.render('adminViews/out-vehicles',{status,page:'out-vehicles'});
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      res.status(500).send('Internal server error. Please try again later.');
    }
  });

  router.get('/outgoing-detail/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const vehicleInfo = await VehicleEntry.findById(id);
  
      res.render('adminViews/outgoing-detail',{vehicleInfo,page:'outgoing-detail'});
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
  /*   const Income = require('../models/Income');  */

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
      { $group: { _id: null, total: { $sum: '$totalCharges' } } }
    ]))[0].total;

    // Calculate today's income
    const todaysIncome = todayEntries.reduce((sum, entry) => sum + entry.totalCharges, 0);

    // Calculate yesterday's income
    const yesterdaysIncome = yesterdayEntries.reduce((sum, entry) => sum + entry.totalCharges, 0);

  /*   // Update the Income schema
    const incomeData = new Income({
      totalIncome,
      todaysIncome,
      yesterdaysIncome
    });
    await incomeData.save(); */

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
})



/////////////////////////////////////////////////////
router.post("/manage-vehicles", async (req, res) => {
    try {
        const { ownername, ownercontno, catename, vehcomp, vehreno, model } = req.body;
        
        const existingRegistrationNumber = await VehicleEntry.findOne({registrationNumber:vehreno});
        const existingOwnersContact = await VehicleEntry.findOne({ ownerContactNumber:ownercontno});

        if (existingRegistrationNumber || existingOwnersContact) {
            return res.status(400).render('./adminViews/manage-vehicles', { message: 'Registration number or Phone Number already exists'});
        }

        const parkingNumber = Math.floor(10000 + Math.random() * 90000);
        const currentTime = moment().tz('Asia/Kolkata');

        const newVehicle = new VehicleEntry({
          parkingNumber: "CA-"+parkingNumber,
          ownerName: ownername,
          ownerContactNumber: ownercontno,
          registrationNumber: vehreno,
          vehicleCategory: catename,
          vehicleCompanyname: vehcomp,
          vehicleModel:model,
          inTime:currentTime.toDate()

        });

        const registered = await newVehicle.save();
        return res.status(400).render('./adminViews/manage-vehicles', { message: 'Booked sucessfully' });
    } 
    
    catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send("Internal server error. Please try again later.");
    }
});

router.post('/update-incomingdetail/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { remark, status } = req.body;

    // Update the document using Mongoose's findByIdAndUpdate
    const updatedVehicle = await VehicleEntry.findByIdAndUpdate(
      id,
      {
        remarks: remark,
        status: status,
      },
      { new: true } // This option returns the updated document
    );

    if (!updatedVehicle) {
      return res.status(404).send('Vehicle not found');
    }

    // Redirect with a success message
    res.redirect('/out-vehicles');
  }

  catch (error) {
    console.error('Error updating vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
});



module.exports = router;