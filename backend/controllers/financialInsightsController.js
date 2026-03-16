const FinancialInsightsService = require('../services/financialInsightsService');

class FinancialInsightsController {
    static async getInsights(req, res) {
        try {
            // Using email extracted from auth middleware or from params
            // But per requirement, the endpoint is /api/ai/insights/:userId where :userId is email
            const email = req.params.userId;
            
            // Generate insights
            const insights = await FinancialInsightsService.generateInsights(email);
            
            res.status(200).json(insights);
        } catch (error) {
            console.error('Error in getInsights controller:', error);
            res.status(500).json({ error: error.message || 'Failed to generate financial insights' });
        }
    }
}

module.exports = FinancialInsightsController;
