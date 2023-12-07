const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const session = require('express-session');


const control = require('../controllers/control')

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Session configuration
router.use(
    session({
        secret: 'mySecret',
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: 24 * 60 * 1000 }
    })
);

// Admin login verification middleware for POST requests
const userDetails = (req, res, next) => {
    if (req.session.user && req.session.userDetails) {
        next();
    } else {
        return res.status(400).render('userViews/login', { message: 'Please Log In First!' });
    }
};


router.get("/", control.getUserIndex);
router.get("/detail",control.getUserDetail);


router.get("/login", control.getUserLogin);
router.post("/login", control.postUserLogin);

router.get("/logoutuser", userDetails,control.getUserLogout );

router.get("/register", control.getUserRegister );
router.post("/register", control.postUserRegister);

router.get('/userafterlogin', userDetails, control.getAfterLogin);


router.get("/slotBooking", userDetails, control.getSlotBooking);
router.post('/slotBooking', userDetails, control.postSlotBooking);

router.get('/vbook', userDetails, control.getVbook);
router.post("/vbook", control.postVbook);

router.get("/payment", userDetails, control.getPayment);
router.post("/payment", userDetails,control.postPayment);


router.post('/create-order', control.postCreateOrder);

router.post('/Cpayment',control.postCpayment );

router.get("/paymentSucess", userDetails, control.getPaymentSuccess);

module.exports = router;


