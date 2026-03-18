const express = require('express');
const router = express.Router();
const IncomeController = require('../controllers/incomeController');

// All these routes will be prefixed by /api/income and protected by auth middleware in index.js
router.post('/add-income', IncomeController.addIncome);
router.get('/get-income', IncomeController.getIncome);
router.put('/update-income/:id', IncomeController.updateIncome);
router.delete('/delete-income/:id', IncomeController.deleteIncome);

module.exports = router;
