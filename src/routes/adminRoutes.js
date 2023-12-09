const express = require('express');
const router = express.Router();
const session = require('express-session');
const control= require ('../controllers/control')

const adminDetails = (req, res, next) => {
  if (req.session.admin && req.session.adminDetails) {
    next();
  } else {
    res.redirect('/adminLogin');
  }
}
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(
  session({
    secret: 'mySecret',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 1000 }
  })
);

router.get('/adminLogin',control.getAdminLogin);
router.post('/adminLogin',control.postAdminLogin);
router.get('/logout', control.getAdminLogout);

router.get('/dashboard', adminDetails, control.getAdminDashboard);

router.get('/manage-vehicles', adminDetails, control.getManageVehicles);
router.post("/manage-vehicles", adminDetails,control.postManageVehicles);

router.get('/in-vehicles', adminDetails,control.getInVehicles);

router.get('/update-incomingdetail/:id', adminDetails, control.getUpdateIncoming);
router.post('/update-incomingdetail/:id', adminDetails, control.postUpdateIncoming);

router.get('/out-vehicles', adminDetails, control.getOutVehicles);

router.get('/print-receipt/:id',control.getPrint);

router.get('/total-income', adminDetails,control.getTotalIncome);

router.get('/outgoing-detail', adminDetails, control.getOutgoing);

router.get('/outgoing-detail/:id', adminDetails, control.getOutgoingId);

router.get('/awaited', adminDetails, control.getAwaited);
router.post('/awaited/:id',control.awaitedId );


module.exports = router;