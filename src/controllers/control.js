
const parkingLots = require('../models/parkingLot');
const VehicleEntry = require('../models/vehicleEntry');
const Register = require("../models/register");


const moment = require('moment-timezone');
const Razorpay = require('razorpay');
const twilio = require('twilio');
const axios = require("axios");


const accountSid = 'AC7c3ab69ecd3b61ad8d3e0c9fe8d736b8';
const authToken = '710d631200691a7d7187ab8d687bf7c5';
const twilioPhone = '+15637702743';
const client = twilio(accountSid, authToken);

const razorpay = new Razorpay({
  key_id: "rzp_test_esJ9zn2E77SUXk",
  key_secret: "oPKYchsY7QOvBwppBSer2ywv",
});

//Admin Controls
exports.getAdminLogin = (req, res) => {
  res.render('adminViews/adminLogin');
}

exports.postAdminLogin = async (req, res) => {
  const { ademail, adpass } = req.body;

  try {
    const admin = await parkingLots.findOne({
      'adminAuth.username': ademail,
      'adminAuth.password': adpass,
    });

    if (admin) {
      req.session.admin = admin;
      req.session.adminDetails = true;
      res.redirect('/dashboard');
    } else {
      res.send('Invalid username or password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
exports.getAdminLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/adminLogin');
  });
}
exports.getAdminDashboard = async (req, res) => {
  try {
    const details = req.session.admin;
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
    const awaitedEntries = await VehicleEntry.countDocuments({ paymentStatus: "awaited", parkinglotName: details.name });

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const within24HoursCount = await VehicleEntry.countDocuments({
      inTime: { $gte: twentyFourHoursAgo },
      parkinglotName: details.name,
    });

    res.render('adminViews/dashboard', {
      page: 'dashboard',
      parkinglotName: details.name,
      totalCount,
      inCount,
      outCount,
      within24HoursCount,
      awaitedEntries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error occurred while counting entries.');
  }
}
exports.getManageVehicles = (req, res) => {
  const details = req.session.admin;
  console.log(details)
  res.render('adminViews/manage-vehicles', { details, page: 'manage-vehicles' })

}
exports.postManageVehicles = async (req, res) => {
  const details = req.session.admin;
  console.log(details.name);
  try {

    const { ownername, ownercontno, catename, vehcomp, vehreno, model } = req.body;

    const existingEntry = await VehicleEntry.findOne({
      parkinglotName: details.name,
      registrationNumber: vehreno,
      status: 'In',
      inTime: { $lte: new Date() },
    });
    console.log("Existing entry:", existingEntry);


    if (existingEntry) {
      return res.status(400).render('./adminViews/manage-vehicles', { details, message: 'Duplicate entry. Please check the data.' });
    }

    const parkingNumber = Math.floor(10000 + Math.random() * 90000);
    const currentTime = moment().tz('Asia/Kolkata');

    const newVehicle = new VehicleEntry({
      parkinglotName: details.name,
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
    details.totalSpots -= 1;
    const registered = await newVehicle.save();
    await parkingLots.findOneAndUpdate(
      { name: details.name }, // Use the appropriate field to identify the specific document
      { $inc: { totalSpots: -1 } } // Decrement the totalSpots field by one
    );


    // Render a success message upon successful save

    return res.status(200).render('./adminViews/manage-vehicles', { details, message: 'Booked successfully' });
  } catch (error) {
    console.error("Error during registration:", error);
    // Check for duplicate entry error and handle accordingly
    if (error.code === 11000) {
      console.log("Duplicate entry error. Please check the data.");
      return res.status(400).render('./adminViews/manage-vehicles', { details, message: 'Duplicate entry. Please check the data.' });
    }
    // Handle other potential errors with a generic server error message
    console.log("Internal server error. Please try again later.");
    res.status(500).send("Internal server error. Please try again later.");
  }
}
exports.getInVehicles = async (req, res) => {
  try {
    const details = req.session.admin;
    const vehicles = await VehicleEntry.find({ status: "In", parkinglotName: details.name, paymentStatus: { $ne: "awaited" } }); // Fetch all entries from the database
    res.render('adminViews/in-vehicles', { vehicles, page: 'in-vehicles' }); // Pass the data to the 'in-vehicles' view
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(400).send('error'); // Redirect to an error page or another route in case of an error
  }
}
exports.getUpdateIncoming = async (req, res) => {
  try {
    const details = req.session.admin;
    const id = req.params.id;
    const vehicleDetail = await VehicleEntry.findById(id);

    let totalCharges = 0;
    let fine = 0;

    if (vehicleDetail.paymentStatus === 'notpaid') {
      if (vehicleDetail.outTime === null) {
        // Case 1: Vehicle not checked out yet
        const outTime = moment.tz("Asia/Kolkata");
        const inTime = moment(vehicleDetail.inTime);
        const timeDiffInMins = outTime.diff(inTime, 'minutes');
        const ratePerHour = details.chargesPerHour; // Set your own rate per hour here
        totalCharges = (timeDiffInMins / 60) * ratePerHour;
        totalCharges = Math.round(totalCharges);

      } else {
        // Case 2: Vehicle checked out but not paid
        const outTime = moment(vehicleDetail.outTime);
        const inTime = moment(vehicleDetail.inTime);
        const timeDiffInMins = outTime.diff(inTime, 'minutes');
        const ratePerHour = details.chargesPerHour; // Set your own rate per hour here
        totalCharges = (timeDiffInMins / 60) * ratePerHour;


        // Retrieve totalCharge from the database
        const databaseTotalCharge = vehicleDetail.totalCharge;

        // If the calculated totalCharges is greater, use it; otherwise, use the database value
        totalCharges = Math.max(totalCharges, databaseTotalCharge);
      }
    } else if (vehicleDetail.paymentStatus === 'paid') {
      // Case 3: Vehicle checked out and paid
      const outTime = moment(vehicleDetail.outTime);
      const inTime = moment(vehicleDetail.inTime);
      const timeDiffInMins = outTime.diff(inTime, 'minutes');
      const ratePerHour = details.chargesPerHour; // Set your own rate per hour here
      totalCharges = (timeDiffInMins / 60) * ratePerHour;
      totalCharges = Math.round(totalCharges);

      // Calculate Fine only if outTime is greater than the current time
      const currentTime = moment.tz("Asia/Kolkata");
      const diffInMins = currentTime.diff(outTime, 'minutes');
      fine = (diffInMins / 60) * (ratePerHour / 2);
      fine = Math.round(fine);
      // Ensure fine is not negative
      fine = Math.max(0, fine);
    }

    // Update the totalCharge in the database


    res.render('adminViews/update-incomingdetail', {
      availabeSlots: details.totalSpots,
      vehicleDetail,
      totalCharges,
      fine,
      page: 'update-incomingdetail'
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
}
exports.postUpdateIncoming = async (req, res) => {
  try {
    details = req.session.admin;

    details.totalSpots += 1;
    await parkingLots.findOneAndUpdate(
      { name: details.name }, // Use the appropriate field to identify the specific document
      { $inc: { totalSpots: +1 } } // Decrement the totalSpots field by one
    );
    const id = req.params.id;
    const { remark, status, fine, totalChargesPaid, parkingcharge } = req.body;

    const vehicleToUpdate = await VehicleEntry.findById(id);

    const existingEntry = await VehicleEntry.findOne({
      _id: { $ne: id },
      status: 'Out',
      inTime: vehicleToUpdate.inTime, // Ensuring the same inTime as the vehicle being updated
    });

    if (existingEntry) {
      return res.status(400).send('Duplicate entry. Vehicle has already been updated to "Out" status.');
    }

    // Ensure that undefined values are treated as zero
    const parsedTotalChargesPaid = parseFloat(totalChargesPaid) || 0;
    const parsedFine = parseFloat(fine) || 0;
    const parsedParkingCharge = parseFloat(parkingcharge) || 0;

    const updatedVehicle = await VehicleEntry.findByIdAndUpdate(
      id,
      {
        remarks: remark,
        status: status,
        totalCharge: parsedTotalChargesPaid + parsedFine + parsedParkingCharge
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
}
exports.getOutVehicles = async (req, res) => {
  try {
    const details = req.session.admin;
    const status = await VehicleEntry.find({ status: "Out", parkinglotName: details.name });
    res.render('adminViews/out-vehicles', { status, page: 'out-vehicles' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
}

exports.getPrint = async (req, res) => {
  try {
    const id = req.params.id;
    const printDetail = await VehicleEntry.findById(id);

    res.render('adminViews/print-receipt', { printDetail, page: 'print-receipt' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
}
exports.getTotalIncome = async (req, res) => {
  try {
    const details = req.session.admin;

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
}
exports.getOutgoing = (req, res) => {
  res.render('adminViews/outgoing-detail')
}
exports.getOutgoingId = async (req, res) => {
  try {
    const id = req.params.id;
    const vehicleInfo = await VehicleEntry.findById(id);

    res.render('adminViews/outgoing-detail', { vehicleInfo, page: 'outgoing-detail' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
}
exports.getAwaited = async (req, res) => {
  try {
    const details = req.session.admin;
    const vehicles = await VehicleEntry.find({ paymentStatus: "awaited", parkinglotName: details.name });

    res.render('adminViews/awaited', { vehicles, page: 'awaited' });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
}
exports.awaitedId = async (req, res) => {
  try {
    const { id } = req.params;

    await VehicleEntry.findByIdAndUpdate(id, { $set: { paymentStatus: 'notpaid' } });

    res.redirect('/in-vehicles');
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).send('Internal server error. Please try again later.');
  }
}

/////////////////User Controls////////////////
exports.getUserIndex = (req, res) => {
  res.render('userViews/index')
}
exports.getUserDetail =  (req, res) => {
  res.render('userViews/detail')
}

exports.getUserLogin = (req, res) => {

  res.render('userViews/login');
}
exports.postUserLogin = async (req, res) => {
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
}
exports.getUserLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Internal server error');
    }

    // Redirect to the login page after destroying the session
    res.redirect('login');
  });
}
exports.getUserRegister = (req, res) => {
  res.render('userViews/register')
}
exports.postUserRegister = async (req, res) => {
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
}
exports.getAfterLogin=async (req, res) => {


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
}
exports.getSlotBooking=(req, res) => {
  const details = req.session.user;

  res.render('userViews/slotBooking')
}
exports.postSlotBooking=async (req, res) => {
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
}
exports.getVbook= async (req, res) => {
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
}
exports.postVbook =async (req, res) => {
  try {
      const { plotname, ownername, ownercontno, catename, vehcomp, vehreno, model, inTime, outTime } = req.body;

      const currentDate = moment().format("YYYY-MM-DD");
      const intime = moment(`${currentDate} ${inTime}`);
      const outtime = moment(`${currentDate} ${outTime}`);

      if (!intime.isValid() || !outtime.isValid() || outtime.isSameOrBefore(intime)) {
          console.log("Invalid time inputs");
          return res.status(400).render('./userViews/vbook', { message: 'Invalid time inputs. Please check the data.' });
      }

      const existingEntry = await VehicleEntry.findOne({
          parkinglotName: plotname,
          registrationNumber: vehreno,
          status: 'In',
      });

      if (existingEntry) {
          console.log("Duplicate entry found. Please check the data.");
          return res.status(400).render('./userViews/vbook', { message: 'Duplicate entry. Please check the data.' });
      }

      const details = await parkingLots.findOne({ name: plotname });

      if (!details) {
          console.log("Parking lot details not found.");
          return res.status(400).render('./userViews/vbook', { message: 'Parking lot details not found. Please check the data.' });
      }

      const timeDiffInMins = outtime.diff(intime, 'minutes');
      const ratePerHour = details.chargesPerHour;

      let charges = (timeDiffInMins / 60) * ratePerHour;
      charges = Math.round(charges);

      return res.status(200).render('./userViews/payment', { plotname, ownername, ownercontno, catename, vehcomp, vehreno, model, inTime, outTime, charges });

  } catch (error) {
      console.error("Error during form validation:", error);
      res.status(500).send("Internal server error. Please try again later.");
  }
}
exports.getPayment=(req, res) => {
  res.render('userViews/payment')
}
exports.postPayment= async (req, res) => {
  const user = req.session.user;
  

  try {
      const { plotname, ownername, catename, vehcomp, vehreno, model, inTime, outTime, submitSource, charges } = req.body;
      const parkingNumber = Math.floor(10000 + Math.random() * 90000);
      const currentDate = moment().format("YYYY-MM-DD");
      const intime = moment(`${currentDate} ${inTime}`);
      const outtime = moment(`${currentDate} ${outTime}`);

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
              inTime: intime,
              outTime: outtime,
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
              inTime: intime,
              outTime: outtime,
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
}
exports.postCreateOrder=(req, res) => {
  const { amount } = req.body;
  const submitSource = req.body.submitSource;


  const options = {
      amount: amount * 100, 
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
}
exports.postCpayment=(req, res) => {
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
}
exports.getPaymentSuccess=(req, res) => {
  res.render('userViews/paymentSucess')
}