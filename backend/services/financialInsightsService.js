const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');

class FinancialInsightsService {
    static async generateInsights(email) {
        try {
            const transactions = await Transaction.find({ email });
            
            let totalIncome = 0;
            let totalExpenses = 0;
            const expensesByCategory = {};

            transactions.forEach(t => {
                if (t.type === 'income') {
                    totalIncome += t.amount;
                } else if (t.type === 'expense') {
                    totalExpenses += t.amount;
                    if (!expensesByCategory[t.category]) {
                        expensesByCategory[t.category] = 0;
                    }
                    expensesByCategory[t.category] += t.amount;
                }
            });

            const remainingBalance = totalIncome - totalExpenses;
            
            // Find highest spending category
            let highestSpendingCategory = 'None';
            let maxExpense = 0;
            for (const [category, amount] of Object.entries(expensesByCategory)) {
                if (amount > maxExpense) {
                    maxExpense = amount;
                    highestSpendingCategory = category;
                }
            }

            const suggestions = [];
            
            // 1. Monthly Expense Warning
            if (totalExpenses > totalIncome) {
                suggestions.push("Your expenses exceeded your income this month. This could lead to financial problems.");
            } else if (totalIncome > 0 && totalExpenses > (0.8 * totalIncome)) {
                suggestions.push("Your expenses are very close to your income this month. Consider reducing unnecessary spending.");
            }

            // 2. Income vs Expense Analysis
            if (totalIncome === 0 && totalExpenses === 0) {
                 suggestions.push("You have no income or expenses recorded yet.");
            } else if (totalExpenses <= (0.5 * totalIncome)) {
                 suggestions.push("Your spending is well balanced.");
            } else if (totalExpenses > (0.8 * totalIncome) && totalExpenses <= totalIncome) {
                 suggestions.push("Your spending is too high compared to your income.");
            }

            // 3. Highest Spending Category
            if (highestSpendingCategory !== 'None') {
                suggestions.push(`You are spending the most on ${highestSpendingCategory} this month.`);
            }

            // 4. Savings Prediction
            let predictedYearlySavings = 0;
            if (remainingBalance > 0) {
                predictedYearlySavings = remainingBalance * 12;
                suggestions.push(`If you save ₹${remainingBalance} every month, you could save ₹${predictedYearlySavings} in one year.`);
            }

            // 5. Balance Investment Suggestion
            if (remainingBalance > 20000) {
                 suggestions.push("You have a good remaining balance. Consider saving it in an interest-generating account.");
            }

            // 6. Financial Health Score
            let financialHealthScore = 100;
            
            if (totalIncome === 0) {
                financialHealthScore = totalExpenses > 0 ? 0 : 50; // Neutral if no data, 0 if only expenses
            } else {
                const expenseRatio = totalExpenses / totalIncome;
                
                // Deduct based on expense ratio
                if (expenseRatio > 1) {
                    financialHealthScore = Math.max(0, 100 - (expenseRatio * 50)); // Fast drop if exceeding income
                } else {
                    // 0 expense ratio = 100, 1 expense ratio = 50
                    financialHealthScore = 100 - (expenseRatio * 50); 
                }
                
                // Bonus for high savings
                if (remainingBalance > (0.2 * totalIncome)) {
                    financialHealthScore += 10;
                }
                
                // Penalty for heavy reliance on a single category (lack of distribution)
                if (maxExpense > (0.6 * totalExpenses) && totalExpenses > 0) {
                    financialHealthScore -= 10;
                }
            }
            
            // Ensure score is between 0 and 100
            financialHealthScore = Math.min(100, Math.max(0, Math.round(financialHealthScore)));

            return {
                financialHealthScore,
                totalIncome,
                totalExpenses,
                remainingBalance,
                highestSpendingCategory,
                predictedYearlySavings,
                suggestions
            };

        } catch (error) {
            console.error("Error generating financial insights:", error);
            throw error;
        }
    }
}

module.exports = FinancialInsightsService;
