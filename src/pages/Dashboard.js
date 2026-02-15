import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>TestBook Platform</h2>
        </div>
        <div className="nav-user">
          <span>Welcome, {currentUser?.displayName || currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Student Dashboard</h1>
          <p>Your test preparation hub</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <h3>Tests Taken</h3>
            <p className="stat-value">0</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>Average Score</h3>
            <p className="stat-value">-</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <h3>Tests Available</h3>
            <p className="stat-value">0</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <h3>Total Time Spent</h3>
            <p className="stat-value">0 hrs</p>
          </div>
        </div>
        
        <div className="section">
          <h2>Available Mock Tests</h2>
          <p className="section-description">
            Mock tests will be displayed here once the admin creates them.
          </p>
        </div>
        
        <div className="section">
          <h2>Recent Activity</h2>
          <p className="section-description">
            Your test history will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
