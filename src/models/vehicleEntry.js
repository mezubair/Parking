const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
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
    required: true,
     unique:true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  vehicleCategory: {
    type: String,
    enum: ['Four Wheeler', 'Three Wheeler', 'Two Wheeler'],
    required: true
  },
  vehicleCompanyname: {
    type: String,
    enum: [ 'Hyundai',
            'Maruti Suzuki',
            'Renault',
            'Mahindra',
            'Tata',
            'Honda',
            'Other'],
    required: true
  },
  vehicleModel:{
    type:String,
    required:true
  },
  inTime: {
      type: Date
 
  },
  outTime:{
    type:Date
  },
  status: {
    type: String,
    enum: ['In', 'Out'],
    default: 'In'
  },
  totalCharge: {
    type: Number
  },
  remarks: {
    type: String
  }
});

const VehicleEntry = new mongoose.model('VehicleEntry', vehicleSchema);

module.exports = VehicleEntry;
