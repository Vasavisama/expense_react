const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const cors = require('cors');

const app = express();
app.use(cors()); // Allow frontend to communicate first
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

const newschema = new mongoose.Schema({
    email: { // Changed from userid to email
        required: true,
        type: String,
        unique: true
    },
    username: {
        required: true,
        type: String
    },
    age: Number,
    password: {
        required: true,
        type: String
    }
});

const model = mongoose.model('Profile', newschema);

const transactionSchema = new mongoose.Schema({
    email: {
        required: true,
        type: String,
    },
    type: { // 'income' or 'expense'
        required: true,
        type: String,
        enum: ['income', 'expense']
    },
    amount: {
        required: true,
        type: Number
    },
    category: {
        required: true,
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
connectDB();

app.get('/', (req, res) => {
    res.send('Expense Tracker API is running');
});

app.post("/register", async (req, res) => {
    try {
        const { email, username, age, password } = req.body;
        
        // Check if user already exists
        const existingUser = await model.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists." });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const data = await model.create({
            email,
            username,
            age,
            password: hashPassword
        });
        
        // Generate token immediately on signup so user stays logged in
        const token = jwt.sign({ email: data.email, username: data.username }, "vasavi", { expiresIn: "1h" });

        res.status(201).json({ message: "Registration successful", token, user: { email: data.email, username: data.username } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    try {
        if (!authHeader) {
            console.error('No auth header found');
            return res.status(401).send('Access denied');
        }

        let token = authHeader.split(" ")[1];
        if (!token) {
            console.error('Malformed auth header');
            return res.status(401).send('Access denied');
        }

        // Remove any quotes if the frontend accidentally stringified the token itself
        token = token.replace(/^"(.*)"$/, '$1');

        const matched = jwt.verify(token, 'vasavi');
        
        if (matched) {
            req.user = matched;
            next();
        }
    } catch (err) {
        console.error('Auth verification failed:', err.message);
        res.status(401).send('Access denied');
    }
};

app.post('/login', async (req, res) => { // Removed `auth` middleware from login endpoint because users login TO GET the token
    try {
        const { email, password } = req.body;
        const user = await model.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Secure password check
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ email: user.email, username: user.username }, "vasavi", { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token, user: { email: user.email, username: user.username } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transaction Endpoints
app.post('/transactions', auth, async (req, res) => {
    try {
        const { type, amount, category, description } = req.body;
        const email = req.user.email; // Extracted from auth middleware token

        const newTransaction = await Transaction.create({
            email,
            type,
            amount: Number(amount),
            category,
            description
        });

        res.status(201).json({ message: "Transaction added successfully", transaction: newTransaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/transactions', auth, async (req, res) => {
    try {
        const email = req.user.email;
        const { type } = req.query; // get type from query params
        
        const filter = { email };
        if (type) {
            filter.type = type;
        }

        const transactions = await Transaction.find(filter).sort({ date: -1 }); // Newest first
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Summary Endpoint
app.get('/transactions/summary', auth, async (req, res) => {
    try {
        const email = req.user.email;
        const transactions = await Transaction.find({ email });
        
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });

        res.status(200).json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/profile/:email", auth, async (req, res) => {
    const { email } = req.params;
    const { newEmail, username, age, password } = req.body;
    try {
        const data = await model.findOne({ email });
        if (!data) return res.status(404).send("User not found");

        if (newEmail) data.email = newEmail;
        if (username) data.username = username;
        if (age) data.age = age;
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }
        
        await data.save();
        res.json({ message: "PROFILE UPDATED", data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/profile/:email", auth, async (req, res) => {
    const { email } = req.params;
    const data = await model.findOne({ email });
    if (!data) return res.status(404).send("User not found");
    // Don't send password back!
    res.json({ email: data.email, username: data.username, age: data.age });
});

app.delete("/profile/:email", auth, async (req, res) => {
    const { email } = req.params;
    await model.deleteOne({ email });
    res.send("PROFILE DELETED");
});

app.get('/profiles', auth, async (req, res) => {
    const { age } = req.query;
    let query = {};
    if (age) query.age = { $gt: age };
    
    // Do not return passwords in the profiles list
    const data = await model.find(query).select('-password').sort({ age: -1 });
    res.json(data);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
