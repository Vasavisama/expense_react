const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expenseController');

// All these routes will be prefixed by /api/expense and protected by auth middleware in index.js
router.post('/add-expense', ExpenseController.addExpense);
router.get('/get-expense', ExpenseController.getExpense);
router.put('/update-expense/:id', ExpenseController.updateExpense);
router.delete('/delete-expense/:id', ExpenseController.deleteExpense);

module.exports = router;
