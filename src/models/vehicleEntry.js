const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    registrationNumber: {
        type: String,
        required: true
    },
    vehiclesCompanyName: {
        type: String,
        required: true

    },
    vehicleCategory: {
        type: String,
        enum: ['Four Wheeler', 'Three Wheeler', 'Two Wheeler'],
        required: true,
    },

    ownersFullName: {
        type: String,
        required: true
    },
    ownersContact: {
        type: String,
        required: true
    }
});

const VehicleEntry = new mongoose.model('VehicleEntry', vehicleSchema);

module.exports = VehicleEntry;
