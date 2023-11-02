const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const axios= require('axios');
const APIkey ="AIzaSyAOl0a7ha6X3iwlTR4_y7XcrHLH-39yb-0";

const parkingLots = require('./parkinglot')

require("../db/conn");

const Register = require("../models/register");

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    // cookie:{ maxAge:60000}
}));



router.get("/", (req, res) => {
    res.render('userViews/index')
});


router.get("/login", (req, res) => {

    res.render('userViews/login');
});


router.get("/register", (req, res) => {
    res.render('userViews/register')
});


router.get("/admin", (req, res) => {
    res.render('userViews/admin')
});
router.get("/slotBooking", (req, res) => {
    res.render('userViews/slotBooking')
});


// router.post implementation
router.post('/slotBooking', async (req, res) => {
    const { userLatitude, userLongitude, city, locality } = req.body;
    const origin = `${userLatitude},${userLongitude}`;

    const filteredParkingLots = parkingLots.filter(parkingLot => {
        return parkingLot.city === city && parkingLot.locality === locality;
    });
    
    try {
        for (let i = 0; i < filteredParkingLots.length; i++) {
            const { latitude, longitude } = filteredParkingLots[i];
            const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${latitude},${longitude}&key=${APIkey}`);
            
            if (response.data && response.data.rows && response.data.rows[0] && response.data.rows[0].elements && response.data.rows[0].elements[0] && response.data.rows[0].elements[0].distance && response.data.rows[0].elements[0].distance.text) {
                const distance = response.data.rows[0].elements[0].distance.text;
                filteredParkingLots[i].distance = distance;
            } else {
                filteredParkingLots[i].distance = 'N/A'; // Assign a default value if distance is not available
            }
        }
        
        // Sort filtered parking lots by distance
        filteredParkingLots.sort((a, b) => {
            const distanceA = parseFloat(a.distance.split(' ')[0]);
            const distanceB = parseFloat(b.distance.split(' ')[0]);
            return distanceA - distanceB;
        });
        res.json({ parkingLots: filteredParkingLots, searchPerformed: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error while fetching parking lots. Please try again later.' });
    }
});






router.get("/vbook", (req, res) => {
    res.render('userViews/vbook')
});



router.get("/detail", (req, res) => {
    res.render('userViews/detail')
});



router.get("/privacy", (req, res) => {
    res.render('userViews/privacy')
});


router.get("/terms", (req, res) => {
    res.render('userViews/terms')
});

router.get("/temp", (req, res) => {
    res.render('userViews/temp')
});


router.get('/userafterlogin', (req, res) => {
    if (!req.session.user) {
        req.session.message = 'Please Log In First'; // Set the message
        return res.redirect('/login'); // Redirect to 'login' page
    }

    const user = req.session.user;
    res.render('userViews/userafterlogin', { user: user });
});



////////  Post Requests ////////////////

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await Register.findOne({ email });

        if (!existingUser) {
            return res.status(400).render('userViews/login', { message: 'Invalid Email' });
        }

        if (existingUser.password !== password) {
            return res.status(400).render('userViews/login', { message: 'Invalid Password' });
        }
        req.session.user = existingUser;
        res.redirect('userafterlogin?success');
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Internal server error. Please try again later.");
    }
});

router.post("/register", async (req, res) => {
    try {
        const { fullName, phoneNumber, email, password, confirmPassword } = req.body;
        const existingUserEmail = await Register.findOne({ email });
        const existingUserPhone = await Register.findOne({ phoneNumber });

        if (existingUserPhone || existingUserEmail) {
            return res.status(400).render('./userViews/register', { message: 'Email or Phone Number already exists', formData: req.body });
        }


        const regNewUser = new Register({
            fullName: fullName,
            phoneNumber: phoneNumber,
            email: email,
            password: password,
            confirmPassword: confirmPassword
        });

        const registered = await regNewUser.save();
        return res.status(400).render('./userViews/login', { message: 'Registration Successful' });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send("Internal server error. Please try again later.");
    }
});


module.exports = router;


