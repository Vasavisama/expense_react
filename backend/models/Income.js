const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Income', incomeSchema);
