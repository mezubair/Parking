const mongoose = require('mongoose');
const moment = require('moment-timezone')

const vehicleSchema = new mongoose.Schema({

  parkinglotName:{
    type: String,
    required: true,
  },
  availabeSlots:{
    type: String,
    required: true,
  },
  parkingNumber: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true
  },
  ownerContactNumber: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    index: true
  },
  vehicleCategory: {
    type: String,
    enum: ['Four Wheeler', 'Three Wheeler', 'Two Wheeler'],
    required: true
  },
  vehicleCompanyname: {
    type: String,
    enum: ['Hyundai',
      'Maruti Suzuki',
      'Renault',
      'Mahindra',
      'Tata',
      'Honda',
      'Other'],
    required: true
  },
  vehicleModel: {
    type: String,
    required: true
  },
  inTime: {
    type: Date,
    default: moment().tz('Asia/Kolkata')

  },
  outTime: {
    type: Date,
    default: moment().tz('Asia/Kolkata')
  },
  status: {
    type: String,
    enum: ['In', 'Out'],
    default: 'In',
    index: true
  },
  totalCharge: {
    type: Number
  },
  remarks: {
    type: String
  }
}, { versionKey: false });

vehicleSchema.index({ registrationNumber: 1, inTime: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'In', inTime: { $exists: true } } });


const VehicleEntry = new mongoose.model('VehicleEntry', vehicleSchema);

module.exports = VehicleEntry;
