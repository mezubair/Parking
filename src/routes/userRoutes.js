const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const moment = require('moment-timezone');
const axios = require("axios");
const Razorpay = require('razorpay');
const twilio = require('twilio');


const parkingLots = require('../models/parkingLot')
const VehicleEntry = require('../models/vehicleEntry');

require("../db/conn");

const Register = require("../models/register");
const parkingLot = require('../models/parkingLot');

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


router.get("/", (req, res) => {
    res.render('userViews/index')
});


router.get("/login", (req, res) => {

    res.render('userViews/login');
});

router.get("/logoutuser", userDetails, (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Internal server error');
        }

        // Redirect to the login page after destroying the session
        res.redirect('login');
    });
});


router.get("/register", (req, res) => {
    res.render('userViews/register')
});



router.get("/slotBooking", userDetails, (req, res) => {
    const details = req.session.user;

    res.render('userViews/slotBooking')
});

router.get("/paymentSucess", userDetails, (req, res) => {
    res.render('userViews/paymentSucess')
});


// router.post implementation


    router.post('/slotBooking', async (req, res) => {
    const { userLatitude, userLongitude, city, locality } = req.body;
    const origin = `${userLatitude},${userLongitude}`;
    const filteredParkingLots = await parkingLots.find({ city, locality });

    const apiKey = '150ff0b567msh4eda225a6f58a67p1e3f64jsn762349d245cb';
    const host = 'trueway-matrix.p.rapidapi.com';

    try {
        const distanceCalculations = filteredParkingLots.map(async (parkingLot) => {
            const { latitude, longitude } = parkingLot;
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
                const distanceInMeters = response.data.distances[0];
                const distanceInKilometers = (distanceInMeters / 1000).toFixed(1);
                parkingLot.distance = distanceInKilometers;
                return parkingLot; // Return the parkingLot object with distance
            } else {
                parkingLot.distance = 'N/A';
                return parkingLot; // Return the parkingLot object with distance as 'N/A'
            }
        });

        const parkingLotsWithDistances = await Promise.all(distanceCalculations);

        // Sort filtered parking lots by distance
        parkingLotsWithDistances.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        console.log(parkingLotsWithDistances);
        res.json({ parkingLots: parkingLotsWithDistances, searchPerformed: true });
    } catch (error) {
        console.error('Error:', error);
        res.json({ parkingLots: filteredParkingLots, searchPerformed: true });
    }
});


router.get('/vbook', userDetails, async (req, res) => {
    const lotId = req.query.lotId;

    try {
        // Use Mongoose to retrieve the data based on lotId
        const lotData = await parkingLots.findById(lotId).exec();
        console.log(lotData);

        if (lotData) {
            // Render the 'vbook' template and pass the data to it
            
            res.render('userViews/vbook', { lotData });
           
         
        } else {
            res.status(404).send('Lot not found'); // Handle when the lot is not found
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error'); // Handle database errors
    }
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


router.get('/userafterlogin', userDetails, async (req, res) => {


    const user = req.session.user;


    try {
        const uservehicle = await VehicleEntry.find({
            ownerContactNumber: user.phoneNumber,
            
        });
        console.log(uservehicle);
        // Pass user data with associated vehicle entries to the view
        res.render('userViews/userafterlogin', { user: user, userEntries: uservehicle });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});


////////  Post Requests ////////////////

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Register.findOne({
            email: email,
            password: password,
        }); // Make sure 'parkingLots' refers to the correct Mongoose model

        if (user) {
            req.session.user = user; // Store user data in the session
            req.session.userDetails = true; // Set isAdmin flag in the session
            res.redirect('/userafterlogin');
        } else {
            return res.status(400).render('userViews/login', { message: 'Invalid Credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

const accountSid = 'AC7c3ab69ecd3b61ad8d3e0c9fe8d736b8';
const authToken = '710d631200691a7d7187ab8d687bf7c5';
const twilioPhone = '+15637702743';

const client = twilio(accountSid, authToken);

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

        // Send a welcome message via Twilio
        const messageBody= "Welcome to ParKing! You have been successfully registered.Thank you for choosing ParKing!";
        await client.messages.create({
            body: messageBody,
            to: `+91${phoneNumber}`,
            from: twilioPhone,
        })

        console.log('Message sent successfully:', messageBody .sid);

        // Render the registration success message here
        return res.status(400).render('./userViews/login', { message: 'Registration Successful' });
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(400).render('./userViews/login', { message: 'Registration Successful' }); //changed because it was causing error because number was not verfied in twilio 
    }
});

router.post("/vbook", async (req, res) => {
    try {
        // Extracting necessary information from the request body
        const { plotname, ownername, ownercontno, catename, vehcomp, vehreno, model, inTime, outTime } = req.body;

        // Check for an existing entry with the same registrationNumber, status 'In', and inTime
        const existingEntry = await VehicleEntry.findOne({
            parkinglotName: plotname,
            registrationNumber: vehreno,
            status: 'In',
        });
        console.log("Existing entry:", existingEntry);

        // If an existing entry is found, return a duplicate entry error message
        if (existingEntry) {
            console.log("Duplicate entry found. Please check the data.");
            return res.status(400).render('./userViews/vbook', { message: 'Duplicate entry. Please check the data.' });
        }

        const details=await parkingLots.findOne({name:plotname});

        const outtime = moment(outTime);

        // Calculate the difference between outTime and inTime in hours
        const intime = moment(inTime);
        const timeDiffInMins = outtime.diff(intime, 'minutes');
    
        // Calculate the total charges based on the rate per hour
        const ratePerHour = details.chargesPerHour; // Set your own rate per hour here
        let charges = (timeDiffInMins / 60) * ratePerHour;
    
        // Round the total charges to the nearest whole number
        charges = Math.round(charges);





        // If validation is successful, redirect the user to the payment page
        return res.status(200).render('./userViews/payment', { plotname, ownername, ownercontno, catename, vehcomp, vehreno, model, inTime, outTime, charges });
    } catch (error) {
        // Handle other potential errors with a generic server error message
        console.error("Error during form validation:", error);
        console.log("Internal server error. Please try again later.");
        res.status(500).send("Internal server error. Please try again later.");
    }
});


router.get("/payment", userDetails, (req, res) => {
    res.render('userViews/payment')
});





router.post("/payment", userDetails, async (req, res) => {
    const user = req.session.user;
    

    try {
        const { plotname, ownername, catename, vehcomp, vehreno, model, inTime, outTime, submitSource, charges } = req.body;
        const parkingNumber = Math.floor(10000 + Math.random() * 90000);
        console.log(plotname);

        let newVehicle;

        if (submitSource === 'PayNow') {
            newVehicle = new VehicleEntry({
                parkinglotName: plotname,
                parkingNumber: "CA-" + parkingNumber,
                ownerName: ownername,
                ownerContactNumber: user.phoneNumber,
                registrationNumber: vehreno,
                vehicleCategory: catename,
                vehicleCompanyname: vehcomp,
                vehicleModel: model,
                inTime: inTime,
                outTime: outTime,
                paymentStatus: "paid",
                totalCharge: charges
            });

           
            await newVehicle.save();
            await parkingLots.findOneAndUpdate(
                { name: plotname },
                { $inc: { totalSpots: -1 } }
            );
        } else if (submitSource === 'PayLater') {
            newVehicle = new VehicleEntry({
                parkinglotName: plotname,
                parkingNumber: "CA-" + parkingNumber,
                ownerName: ownername,
                ownerContactNumber: user.phoneNumber,
                registrationNumber: vehreno,
                vehicleCategory: catename,
                vehicleCompanyname: vehcomp,
                vehicleModel: model,
                inTime: inTime,
                outTime: outTime,
                paymentStatus: "awaited",
                totalCharge: charges
            });

            await newVehicle.save();
            await parkingLots.findOneAndUpdate(
                { name: plotname },
                { $inc: { totalSpots: -1 } }
            );
        }

        const parkingLotDetails = await parkingLots.findOne({ name: plotname });
        const lat = parkingLotDetails.latitude;
        const longt = parkingLotDetails.longitude;
        

        // Sending a message to the user's phone number using Twilio
        const messageBody = `Dear ${user.fullName},\nYour Parking slot at ${plotname} has been successfully booked from ${inTime} to ${outTime}. Thank you for choosing ParKing!`;

        await client.messages.create({
            body: messageBody,
            to: `+91${user.phoneNumber}`,
            from: twilioPhone,
        });

        console.log('Message sent successfully');

        return res.status(200).render('./userViews/paymentSucess', { parkingNumber, inTime, outTime, submitSource, lat, longt });
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).send("Internal server error. Please try again later.");
    }
});



const razorpay = new Razorpay({
    key_id: "rzp_test_esJ9zn2E77SUXk",
    key_secret: "oPKYchsY7QOvBwppBSer2ywv",
});

router.post('/create-order', (req, res) => {
    const { amount } = req.body;
    const submitSource = req.body.submitSource;


    const options = {
        amount: amount * 100, // Razorpay amount is in paise, so multiply by 100
        currency: 'INR',
        receipt: 'order_receipt', // You can generate a unique receipt ID here
    };

    razorpay.orders.create(options, (err, order) => {
        if (err) {
            console.error('Error creating Razorpay order:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.json(order);
    });
});

router.post('/Cpayment', (req, res) => {
    const { payment_id, order_id, signature } = req.body;

    // Verify the payment signature
    const generatedSignature = razorpay.webhook.verifyPaymentSignature({
        order_id: order_id,
        payment_id: payment_id,
    }, signature);

    if (!generatedSignature) {
        console.error('Invalid Razorpay payment signature');
        return res.status(400).json({ error: 'Invalid Signature' });
    }

    // Perform additional validation and save data to your database
    // ...

    res.json({ success: true, message: 'Payment successful' });
});




//////////      ...............................NOTIFY USERS.................. //////////////////////

// const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
// const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// // Function to send a Twilio message
// const sendTwilioMessage = async (phoneNumber, message) => {
//   try {
//     const result = await twilioClient.messages.create({
//       body: message,
//       from: TWILIO_PHONE_NUMBER,
//       to: phoneNumber,
//     });
//     console.log('Twilio Message SID:', result.sid);
//   } catch (error) {
//     console.error('Error sending Twilio message:', error);
//   }
// };

// const notifyUsers = async () => {
//     try {
//       const currentTime = new Date().toISOString(); // Current time
//       const reminderTime = calculateReminderTime(currentTime); // Time 5 minutes before the current time
  
//       // Fetch users with outTime scheduled in the next 5 minutes
//       const usersToNotify = await VehicleEntry.find({ outTime: { $gte: reminderTime, $lt: currentTime } });
  
//       // Send messages to eligible users
//       await Promise.all(usersToNotify.map(async (user) => {
//         const phoneNumber = user.ownerContactNumber;
//         const userName = user.ownerName;
//         const vehicleRegistrationNumber = user.registrationNumber;
  
//         const message = `Hello ${userName}, your vehicle with registration number ${vehicleRegistrationNumber} is scheduled to leave the parking lot in 5 minutes. Please ensure to move your vehicle on time to avoid any inconvenience. Thank you for using our service.`;
  
//         // Send Twilio message
//         await sendTwilioMessage(phoneNumber, message);
//       }));
  
//       console.log('Notification process completed.');
//     } catch (error) {
//       console.error('Error during notification process:', error);
//     }
//   };
  
//   // Call the async function to start the notification process
//   notifyUsers();


module.exports = router;


