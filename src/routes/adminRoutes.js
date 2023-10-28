const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

router.use(express.urlencoded({ extended: true }));
router.use(express.json());


require("../db/conn");
const VehicleEntry = require('../models/vehicleEntry');


router.get("/dashboard", (req, res) => {
    res.render("adminViews/dashboard", { page: 'dashboard' })
})

router.get('/in-vehicles', (req, res) => {
    res.render('adminViews/in-vehicles', { page: 'in-vehicles' })
})
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
        const { vehreno, vehcomp, catename, ownername, ownercontno } = req.body;
        const existingRegistrationNumber = await VehicleEntry.findOne({vehreno});
        const existingOwnersContact = await VehicleEntry.findOne({ ownercontno });

        if (existingRegistrationNumber || existingOwnersContact) {
            return res.status(400).send('./adminViews/manage-vehicles', { message: 'Registration number or Phone Number already exists'});
        }



        const regNewVehicle = new VehicleEntry({
            registrationNumber: vehreno,
            vehiclesCompanyName: vehcomp,
            vehicleCategory: catename,
            ownersFullName: ownername,
            ownersContact: ownercontno
        });

        const registered = await regNewVehicle.save();
        return res.status(400).render('./adminViews/manage-vehicles', { message: 'Booked sucessfully' });
    } 
    
    catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send("Internal server error. Please try again later.");
    }
});




module.exports = router;