const Expense = require('../models/Expense');
const mongoose = require('mongoose');

class ExpenseController {
    static async addExpense(req, res) {
        try {
            const { category, amount, date } = req.body;
            const email = req.user.email;

            if (!category || !amount) {
                return res.status(400).json({ message: "Category and amount are required" });
            }

            // Create new Expense
            const newExpense = new Expense({
                email,
                category,
                amount: Number(amount),
                date: date ? new Date(date) : new Date()
            });
            await newExpense.save();

            // Dual write to legacy Transaction model to maintain Dashboard integrity
            try {
                const Transaction = mongoose.model('Transaction');
                await Transaction.create({
                    _id: newExpense._id,
                    email,
                    type: 'expense',
                    amount: Number(amount),
                    category,
                    date: newExpense.date,
                    description: 'Managed by Expense API'
                });
            } catch (err) {
                console.warn('Failed to dual-write to Transaction. This might affect dashboard stats.', err);
            }

            res.status(201).json({ message: "Expense added successfully", expense: newExpense });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getExpense(req, res) {
        try {
            const email = req.user.email;
            
            // Sync legacy transactions to Expense model if they don't exist yet
            const Transaction = mongoose.model('Transaction');
            const legacyExpenses = await Transaction.find({ email, type: 'expense' });
            
            for (const t of legacyExpenses) {
                try {
                    const exists = await Expense.findById(t._id);
                    if (!exists) {
                        await Expense.create({
                            _id: t._id,
                            email: t.email,
                            category: t.category,
                            amount: t.amount,
                            date: t.date
                        });
                    }
                } catch(e) { /* ignore single sync errors */ }
            }

            const expenses = await Expense.find({ email }).sort({ date: -1 });
            res.status(200).json(expenses);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateExpense(req, res) {
        try {
            const { id } = req.params;
            const { category, amount, date } = req.body;
            const email = req.user.email;

            const updateFields = { category, amount: Number(amount) };
            if (date) updateFields.date = new Date(date);

            const updatedExpense = await Expense.findOneAndUpdate(
                { _id: id, email },
                updateFields,
                { new: true }
            );

            if (!updatedExpense) {
                return res.status(404).json({ message: "Expense not found or unauthorized" });
            }

            // Update legacy Transaction
            try {
                const Transaction = mongoose.model('Transaction');
                const legacyFields = { category, amount: Number(amount) };
                if (date) legacyFields.date = new Date(date);
                
                await Transaction.findOneAndUpdate(
                    { _id: id, email },
                    legacyFields
                );
            } catch (err) {
                console.warn('Failed to dual-update Transaction.', err);
            }

            res.status(200).json({ message: "Expense updated successfully", expense: updatedExpense });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteExpense(req, res) {
        try {
            const { id } = req.params;
            const email = req.user.email;

            const deletedExpense = await Expense.findOneAndDelete({ _id: id, email });

            if (!deletedExpense) {
                return res.status(404).json({ message: "Expense not found or unauthorized" });
            }

            // Delete from legacy Transaction
            try {
                const Transaction = mongoose.model('Transaction');
                await Transaction.findOneAndDelete({ _id: id, email });
            } catch (err) {
                console.warn('Failed to dual-delete Transaction.', err);
            }

            res.status(200).json({ message: "Expense deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ExpenseController;
