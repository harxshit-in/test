import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
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
          <h2>TestBook Platform - Admin</h2>
        </div>
        <div className="nav-user">
          <span>Admin: {currentUser?.displayName || currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Admin Dashboard</h1>
          <p>Manage exams and questions</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <h3>Total Exams</h3>
            <p className="stat-value">0</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">❓</div>
            <h3>Total Questions</h3>
            <p className="stat-value">0</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <h3>Total Students</h3>
            <p className="stat-value">0</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <h3>Tests Attempted</h3>
            <p className="stat-value">0</p>
          </div>
        </div>
        
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="btn-action">
              <span className="action-icon">➕</span>
              Create New Exam
            </button>
            <button className="btn-action">
              <span className="action-icon">📝</span>
              Add Questions
            </button>
            <button className="btn-action">
              <span className="action-icon">📊</span>
              View Reports
            </button>
          </div>
        </div>
        
        <div className="section">
          <h2>Recent Exams</h2>
          <p className="section-description">
            Admin panel features will be implemented in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
