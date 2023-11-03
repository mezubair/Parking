const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const axios= require('axios');

const parkingLots = require('./parkinglot')

require("../db/conn");

const Register = require("../models/register");

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const parkingLotsData = require('../routes/parkinglot'); 

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
  
  const apiKey = '75da3d7912msh345449a21dd102fp122829jsnd22aad6e0df2';
  const host = 'trueway-matrix.p.rapidapi.com';
  
  try {
    for (let i = 0; i < filteredParkingLots.length; i++) {
      const { latitude, longitude } = filteredParkingLots[i];
      const url = `https://trueway-matrix.p.rapidapi.com/CalculateDrivingMatrix?origins=${origin}&destinations=${latitude},${longitude}`;
      
      const options = {
        method: 'GET',
        url,
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': host,
        },
      };
      
      const response = await axios.request(options);
      
      if (response.data && response.data.distances && response.data.distances[0]) {
        // The distance is returned in meters, so convert it to kilometers
        const distanceInMeters = response.data.distances[0];
        const distanceInKilometers = (distanceInMeters / 1000).toFixed(1);
        filteredParkingLots[i].distance = distanceInKilometers;
      } else {
        filteredParkingLots[i].distance = 'N/A'; // Assign a default value if distance is not available
      }
    }
    
    // Sort filtered parking lots by distance
    filteredParkingLots.sort((a, b) => {
      const distanceA = parseFloat(a.distance);
      const distanceB = parseFloat(b.distance);
      return distanceA - distanceB;
    });
    
    res.json({ parkingLots: filteredParkingLots, searchPerformed: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error while fetching parking lots. Please try again later.' });
  }
});






// Express.js example
router.get('/vbook', (req, res) => {
    const lotId = req.query.lotId;

    // Fetch the parking lot data associated with lotId from your database
    const parkingLotData = parkingLotsData.find(lot => lot.id === parseInt(lotId));

    // Render the vslot template and pass the data to it
    res.render('userViews/vbook', { parkingLotData });
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


