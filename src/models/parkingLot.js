const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  locality: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  chargesPerHour: {
    type: Number,
    required: true
  },
  totalSpots: {
    type: Number,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  adminAuth: {
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  }
});

const parkingLot = mongoose.model('parkingLot', parkingLotSchema);

module.exports = parkingLot;
