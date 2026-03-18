import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    Receipt,
    LogOut,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Plus,
    Zap,
    Edit2,
    Trash2
} from 'lucide-react';
import AIInsightsCard from '../../components/AIInsightsCard';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, income, expense

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('income');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        let token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        // Clean potentially corrupted tokens that got JSON.stringified
        if (token.startsWith('"') && token.endsWith('"')) {
            token = token.slice(1, -1);
            localStorage.setItem('token', token);
        }

        setUser(JSON.parse(storedUser));
        fetchSummary(token);
        fetchTransactions(token, activeTab);
    }, [navigate, activeTab]);

    const fetchSummary = async (token) => {
        try {
            const res = await fetch('http://localhost:8000/transactions/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSummary(data);
            }
        } catch (error) {
            console.error('Failed to fetch summary', error);
        }
    };

    const fetchTransactions = async (token, tab) => {
        try {
            let url = 'http://localhost:8000/transactions';
            if (tab === 'income') url += '?type=income';
            if (tab === 'expense') url += '?type=expense';

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            let endpoint = '';
            let payload = {};

            if (editId) {
                // UPDATE
                if (modalType === 'income') {
                    endpoint = `http://localhost:8000/api/income/update-income/${editId}`;
                    payload = { source: category, amount: Number(amount) };
                } else {
                    endpoint = `http://localhost:8000/api/expense/update-expense/${editId}`;
                    payload = { category, amount: Number(amount) };
                }
            } else {
                // CREATE
                if (modalType === 'income') {
                    endpoint = `http://localhost:8000/api/income/add-income`;
                    payload = { source: category, amount: Number(amount) };
                } else {
                    endpoint = `http://localhost:8000/api/expense/add-expense`;
                    payload = { category, amount: Number(amount) };
                }
            }

            const res = await fetch(endpoint, {
                method: editId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                closeModal();
                fetchSummary(token);
                fetchTransactions(token, activeTab); // Refresh
            } else {
                const errorData = await res.json();
                console.error('Failed to save transaction', errorData);
                alert('Failed to save transaction: ' + (errorData.message || errorData.error));
            }
        } catch (error) {
            console.error('Failed to save transaction (caught error)', error);
            alert('Error connecting to server. Is it running?');
        }
    };

    const handleDelete = async (id, transactionType) => {
        if (!window.confirm(`Are you sure you want to delete this ${transactionType}?`)) return;
        const token = localStorage.getItem('token');
        try {
            const endpoint = transactionType === 'income' 
                ? `http://localhost:8000/api/income/delete-income/${id}` 
                : `http://localhost:8000/api/expense/delete-expense/${id}`;
            
            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchSummary(token);
                fetchTransactions(token, activeTab);
            } else {
                alert('Failed to delete transaction');
            }
        } catch(error) {
            console.error('Delete error', error);
        }
    };

    const openEditModal = (transaction) => {
        setModalType(transaction.type);
        setCategory(transaction.category);
        setAmount(transaction.amount);
        setEditId(transaction._id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setAmount('');
        setCategory('');
        setEditId(null);
    };

    // Derived statistics from the backend summary
    const { totalIncome, totalExpense, balance } = summary;

    // Charts Data
    const pieData = [
        { name: 'Total Balance', value: balance, color: '#8B5CF6' },
        { name: 'Total Expenses', value: totalExpense, color: '#EF4444' },
        { name: 'Total Income', value: totalIncome, color: '#F97316' },
    ];

    // For the bar chart: aggregate simply by date or just display recent individual transactions as bars for mock visual purposes
    const barData = transactions.slice(0, 7).reverse().map(t => ({
        name: new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        value: t.amount,
        type: t.type
    }));

    if (!user) return null;

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand">
                    <h2>Expense Tracker</h2>
                </div>

                <div className="user-profile">
                    <h3>{user.username}</h3>
                </div>

                <nav className="nav-menu">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'income' ? 'active' : ''}`}
                        onClick={() => setActiveTab('income')}
                    >
                        <Wallet size={20} />
                        Income
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'expense' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expense')}
                    >
                        <Receipt size={20} />
                        Expense
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`}
                        onClick={() => setActiveTab('insights')}
                    >
                        <Zap size={20} />
                        AI Insights
                    </button>
                </nav>

                <button className="nav-item logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Top Summary Cards */}
                <div className="summary-cards">
                    <div className="card balance-card">
                        <div className="card-icon bg-purple">
                            <CreditCard size={24} color="white" />
                        </div>
                        <div className="card-info">
                            <p>Total Balance</p>
                            <h3>${balance.toLocaleString()}</h3>
                        </div>
                    </div>

                    <div className="card income-card">
                        <div className="card-icon bg-orange">
                            <Wallet size={24} color="white" />
                        </div>
                        <div className="card-info">
                            <p>Total Income</p>
                            <h3>${totalIncome.toLocaleString()}</h3>
                        </div>
                    </div>

                    <div className="card expense-card">
                        <div className="card-icon bg-red">
                            <Receipt size={24} color="white" />
                        </div>
                        <div className="card-info">
                            <p>Total Expenses</p>
                            <h3>${totalExpense.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                {activeTab === 'dashboard' && (
                    <div className="dashboard-grid">
                        {/* Left Column: Recent Transactions */}
                        <div className="grid-card recent-transactions">
                            <div className="card-header">
                                <h3>Recent Transactions</h3>
                                <div className="action-buttons">
                                    <button className="add-btn income" onClick={() => { setModalType('income'); setShowModal(true); }}>
                                        <Plus size={16} /> Add Income
                                    </button>
                                    <button className="add-btn expense" onClick={() => { setModalType('expense'); setShowModal(true); }}>
                                        <Plus size={16} /> Add Expense
                                    </button>
                                </div>
                            </div>

                            <div className="transactions-list">
                                {transactions.length === 0 ? (
                                    <p className="empty-state">No transactions yet.</p>
                                ) : (
                                    transactions.slice(0, 6).map((t, idx) => (
                                        <div className="transaction-item" key={idx}>
                                            <div className="t-info">
                                                <div className="t-icon">
                                                    {t.type === 'income' ? <TrendingUp size={16} color="#10B981" /> : <TrendingDown size={16} color="#EF4444" />}
                                                </div>
                                                <div>
                                                    <h4>{t.category}</h4>
                                                    <p>{new Date(t.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className={`t-amount ${t.type}`}>
                                                {t.type === 'income' ? '+' : '-'} ${t.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Column: Charts */}
                        <div className="charts-column">
                            <div className="grid-card chart-card pie-chart-container">
                                <h3>Financial Overview</h3>
                                <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `$${value}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="chart-legend">
                                    <span className="legend-item"><span className="dot" style={{ backgroundColor: '#8B5CF6' }}></span> Total Balance</span>
                                    <span className="legend-item"><span className="dot" style={{ backgroundColor: '#EF4444' }}></span> Total Expenses</span>
                                    <span className="legend-item"><span className="dot" style={{ backgroundColor: '#F97316' }}></span> Total Income</span>
                                </div>
                            </div>

                            <div className="grid-card chart-card bar-chart-container">
                                <h3>Recent Activity</h3>
                                <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
                                    <ResponsiveContainer>
                                        <BarChart data={barData}>
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis hide />
                                            <Tooltip formatter={(value) => `$${value}`} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                                {barData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.type === 'income' ? '#A78BFA' : '#FCA5A5'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'income' && (
                    <div className="tab-content">
                        <h2>Income Transactions</h2>
                        <div className="transactions-list full-width">
                            {transactions.length === 0 ? (
                                <p className="empty-state">No income recorded yet.</p>
                            ) : (
                                transactions.map((t, idx) => (
                                    <div className="transaction-item" key={idx}>
                                        <div className="t-info">
                                            <div className="t-icon">
                                                <TrendingUp size={16} color="#10B981" />
                                            </div>
                                            <div>
                                                <h4>{t.category}</h4>
                                                <p>{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="t-actions-container">
                                            <div className="t-amount income">
                                                + ${t.amount.toLocaleString()}
                                            </div>
                                            <div className="t-buttons">
                                                <button onClick={() => openEditModal(t)} className="action-btn edit-btn" title="Edit"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDelete(t._id, 'income')} className="action-btn delete-btn" title="Delete"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'expense' && (
                    <div className="tab-content">
                        <h2>Expense Transactions</h2>
                        <div className="transactions-list full-width">
                            {transactions.length === 0 ? (
                                <p className="empty-state">No expenses recorded yet.</p>
                            ) : (
                                transactions.map((t, idx) => (
                                    <div className="transaction-item" key={idx}>
                                        <div className="t-info">
                                            <div className="t-icon">
                                                <TrendingDown size={16} color="#EF4444" />
                                            </div>
                                            <div>
                                                <h4>{t.category}</h4>
                                                <p>{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="t-actions-container">
                                            <div className="t-amount expense">
                                                - ${t.amount.toLocaleString()}
                                            </div>
                                            <div className="t-buttons">
                                                <button onClick={() => openEditModal(t)} className="action-btn edit-btn" title="Edit"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDelete(t._id, 'expense')} className="action-btn delete-btn" title="Delete"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'insights' && (
                    <AIInsightsCard user={user} token={localStorage.getItem('token')} />
                )}
            </main>

            {/* Modal for Adding Transactions */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editId ? 'Edit' : 'Add'} {modalType === 'income' ? 'Income' : 'Expense'}</h2>
                        <form onSubmit={handleSaveTransaction}>
                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="e.g. Salary, Shopping"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Amount ($)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    min="0.01" step="0.01"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
