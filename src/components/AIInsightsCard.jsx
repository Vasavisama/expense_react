import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, TrendingUp, Wallet, AlertCircle, ArrowUpRight } from 'lucide-react';
import './AIInsightsCard.css';

const AIInsightsCard = ({ user, token }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInsights = async () => {
            if (!user || !token) return;
            
            try {
                setLoading(true);
                // Based on standard schema where user email is the ID parameter
                const res = await fetch(`http://localhost:8000/api/ai/insights/${user.email}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) {
                    throw new Error('Failed to fetch AI insights');
                }
                
                const data = await res.json();
                setInsights(data);
                setError(null);
            } catch (err) {
                console.error("AI Insights Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [user, token]);

    if (loading) {
        return (
            <div className="ai-insights-loading">
                <Brain className="spinning-brain" size={48} color="#A78BFA" />
                <p>Analyzing your financial data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ai-insights-error">
                <AlertCircle size={32} color="#EF4444" />
                <p>Oops! Something went wrong.</p>
                <small>{error}</small>
            </div>
        );
    }

    if (!insights) return null;

    // Determine color based on score
    const getScoreColor = (score) => {
        if (score >= 80) return '#10B981'; // Green
        if (score >= 50) return '#F59E0B'; // Yellow/Orange
        return '#EF4444'; // Red
    };

    return (
        <div className="ai-insights-container">
            <div className="ai-header">
                <h2>
                    <Sparkles size={24} color="#A78BFA" /> 
                    AI Financial Insights
                </h2>
                <p>Intelligent breakdown of your spending habits</p>
            </div>

            <div className="ai-stats-grid">
                {/* Score Card */}
                <div className="ai-stat-card score-card">
                    <h3>Financial Health Score</h3>
                    <div className="score-circle" style={{ borderColor: getScoreColor(insights.financialHealthScore) }}>
                        <span style={{ color: getScoreColor(insights.financialHealthScore) }}>
                            {insights.financialHealthScore}
                        </span>
                    </div>
                </div>

                <div className="ai-stat-card">
                    <div className="stat-header">
                        <Wallet size={20} color="#F97316" />
                        <h3>Remaining Balance</h3>
                    </div>
                    <p className="stat-value">₹{insights.remainingBalance.toLocaleString()}</p>
                </div>

                <div className="ai-stat-card">
                    <div className="stat-header">
                        <TrendingUp size={20} color="#8B5CF6" />
                        <h3>Top Spending Category</h3>
                    </div>
                    <p className="stat-value">{insights.highestSpendingCategory}</p>
                </div>
                
                <div className="ai-stat-card">
                    <div className="stat-header">
                        <ArrowUpRight size={20} color="#10B981" />
                        <h3>Predicted Yearly Savings</h3>
                    </div>
                    <p className="stat-value">₹{insights.predictedYearlySavings.toLocaleString()}</p>
                </div>
            </div>

            <div className="ai-suggestions">
                <h3><Brain size={20} style={{ marginRight: '8px' }} /> Smart Suggestions</h3>
                <ul className="suggestions-list">
                    {insights.suggestions.length > 0 ? (
                        insights.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="suggestion-item">
                                <span className="bullet-point"></span>
                                {suggestion}
                            </li>
                        ))
                    ) : (
                        <p className="no-suggestions">Not enough data to generate suggestions yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AIInsightsCard;
