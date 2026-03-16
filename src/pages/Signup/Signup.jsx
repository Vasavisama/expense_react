import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Upload, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    username: fullName,
                    age: 25, // Default age since it's not in the design
                    password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Signup failed');
            }

            // Store token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            alert('Signup successful!');
            navigate('/login'); // We can redirect to dashboard when it exists
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="login-container">
            {/* Left section: Signup Form */}
            <div className="login-form-section">
                <div className="login-form-wrapper">
                    <h2 className="logo-text">Expense Tracker</h2>

                    <div className="login-header">
                        <h1 className="welcome-title">Create an Account</h1>
                        <p className="welcome-subtitle">Join us today by entering your details below.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSignup}>
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-row">
                            <div className="form-group half-width">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="John"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group half-width">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    placeholder="Min 8 Characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary login-btn" disabled={loading}>
                            {loading ? 'SIGNING UP...' : 'SIGN UP'}
                        </button>
                    </form>

                    <p className="signup-link-text">
                        Already have an account? <a href="/login">Login</a>
                    </p>
                </div>
            </div>

            {/* Right section: Hero display area (reusing styles from Login) */}
            <div className="login-hero-section">
                <div className="hero-content">
                    <div className="hero-card tracking-card">
                        <div className="hero-icon-bg">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M7 14L11 10L15 14L21 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M17 8H21V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="tracking-text">
                            <p>Track Your Income & Expenses</p>
                            <h3>$430,000</h3>
                        </div>
                    </div>

                    <div className="hero-card transaction-card">
                        <div className="transaction-header">
                            <div>
                                <h4>All Transactions</h4>
                                <p>2nd Jan to 21th Dec</p>
                            </div>
                            <button className="view-more-btn">View More</button>
                        </div>

                        <div className="chart-preview">
                            <div className="chart-bar" style={{ height: '40%' }}><div className="bar-fill"></div></div>
                            <div className="chart-bar" style={{ height: '60%' }}><div className="bar-fill"></div></div>
                            <div className="chart-bar" style={{ height: '80%' }}><div className="bar-fill"></div></div>
                            <div className="chart-bar" style={{ height: '30%' }}><div className="bar-fill"></div></div>
                            <div className="chart-bar" style={{ height: '70%' }}><div className="bar-fill"></div></div>
                            <div className="chart-bar active" style={{ height: '100%' }}><div className="bar-fill"></div></div>
                        </div>

                        <div className="chart-labels">
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
