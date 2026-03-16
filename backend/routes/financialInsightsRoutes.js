const express = require('express');
const router = express.Router();
const FinancialInsightsController = require('../controllers/financialInsightsController');

// The auth middleware will be applied in index.js when mounting this route
// GET /api/ai/insights/:userId
router.get('/insights/:userId', FinancialInsightsController.getInsights);

module.exports = router;
