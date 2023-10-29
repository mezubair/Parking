const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const moment = require('moment-timezone');

router.use(express.urlencoded({ extended: true }));
router.use(express.json());


require("../db/conn");
const VehicleEntry = require('../models/vehicleEntry');


router.get("/dashboard", (req, res) => {
    res.render("adminViews/dashboard", { page: 'dashboard' })
})

router.get('/in-vehicles', async (req, res) => {
    try {
      const vehicles = await VehicleEntry.find({}); // Fetch all entries from the database
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
  
      res.render('adminViews/update-incomingdetail',{vehicleDetail,page:'update-incomingdetail'});
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      res.status(500).send('Internal server error. Please try again later.');
    }
  });


router.get('/out-vehicles', (req, res) => {
    res.render('adminViews/out-vehicles', { page: 'out-vehicles' })
})
router.get('/total-income', (req, res) => {
    res.render('adminViews/total-income', { page: 'total-income' })
})

router.get('/manage-vehicles', (req, res) => {
    res.render('adminViews/manage-vehicles', { page: 'manage-vehicles' })
})
router.get('/outgoing-detail', (req, res) => {
    res.render('adminViews/outgoing-detail')
})

router.get('update-incomingdetail', (req, res) => {
    res.render('adminViews/update-incomingdetail')
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
          parkingNumber: parkingNumber,
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




module.exports = router;