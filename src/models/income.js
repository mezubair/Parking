const mongoose = require('mongoose');

// Schema for income tracking
const IncomeSchema = new mongoose.Schema({
    totalIncome: {
        type: Number,
        required: true
    },
    todaysIncome: {
        type: Number,
        required: true
    },
    yesterdaysIncome: {
        type: Number,
        required: true
    },
});

const income = mongoose.model('income', IncomeSchema);

module.exports = income;
