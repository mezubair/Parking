const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const session = require('express-session');

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

router.post('/search', (req, res) => {
    const { city, locality } = req.body;
    const filteredParkingLots = parkingLotsData.filter(parkingLot => parkingLot.city === city && parkingLot.locality === locality);
    res.json(filteredParkingLots);
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


router.get('/userafterlogin', (req, res) => {
    if (!req.session.user) {
        return res.redirect('userViews/login');
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