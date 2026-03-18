const Income = require('../models/Income');
const mongoose = require('mongoose');

class IncomeController {
    static async addIncome(req, res) {
        try {
            const { source, amount, date } = req.body;
            // Assuming auth middleware puts email in req.user.email
            const email = req.user.email;

            if (!source || !amount) {
                return res.status(400).json({ message: "Source and amount are required" });
            }

            // Create new Income
            const newIncome = new Income({
                email,
                source,
                amount: Number(amount),
                date: date ? new Date(date) : new Date()
            });
            await newIncome.save();

            // Dual write to legacy Transaction model to maintain Dashboard integrity
            try {
                const Transaction = mongoose.model('Transaction');
                await Transaction.create({
                    _id: newIncome._id, // Keep IDs synced so we can update/delete easily
                    email,
                    type: 'income',
                    amount: Number(amount),
                    category: source, // Map 'source' to 'category' for transactions
                    date: newIncome.date,
                    description: 'Managed by Income API'
                });
            } catch (err) {
                console.warn('Failed to dual-write to Transaction. This might affect dashboard stats.', err);
            }

            res.status(201).json({ message: "Income added successfully", income: newIncome });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getIncome(req, res) {
        try {
            const email = req.user.email;
            
            // Sync legacy transactions to Income model if they don't exist yet
            // This ensures old data shows up in the new UI natively!
            const Transaction = mongoose.model('Transaction');
            const legacyIncomes = await Transaction.find({ email, type: 'income' });
            
            for (const t of legacyIncomes) {
                try {
                    const exists = await Income.findById(t._id);
                    if (!exists) {
                        await Income.create({
                            _id: t._id,
                            email: t.email,
                            source: t.category,
                            amount: t.amount,
                            date: t.date
                        });
                    }
                } catch(e) { /* ignore single sync errors */ }
            }

            const incomes = await Income.find({ email }).sort({ date: -1 });
            res.status(200).json(incomes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateIncome(req, res) {
        try {
            const { id } = req.params;
            const { source, amount, date } = req.body;
            const email = req.user.email;

            const updateFields = { source, amount: Number(amount) };
            if (date) updateFields.date = new Date(date);

            const updatedIncome = await Income.findOneAndUpdate(
                { _id: id, email },
                updateFields,
                { new: true }
            );

            if (!updatedIncome) {
                return res.status(404).json({ message: "Income not found or unauthorized" });
            }

            // Update legacy Transaction
            try {
                const Transaction = mongoose.model('Transaction');
                const legacyFields = { category: source, amount: Number(amount) };
                if (date) legacyFields.date = new Date(date);
                
                await Transaction.findOneAndUpdate(
                    { _id: id, email },
                    legacyFields
                );
            } catch (err) {
                console.warn('Failed to dual-update Transaction.', err);
            }

            res.status(200).json({ message: "Income updated successfully", income: updatedIncome });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteIncome(req, res) {
        try {
            const { id } = req.params;
            const email = req.user.email;

            const deletedIncome = await Income.findOneAndDelete({ _id: id, email });

            if (!deletedIncome) {
                return res.status(404).json({ message: "Income not found or unauthorized" });
            }

            // Delete from legacy Transaction
            try {
                const Transaction = mongoose.model('Transaction');
                await Transaction.findOneAndDelete({ _id: id, email });
            } catch (err) {
                console.warn('Failed to dual-delete Transaction.', err);
            }

            res.status(200).json({ message: "Income deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = IncomeController;
