const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    category: {
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

module.exports = mongoose.model('Expense', expenseSchema);
