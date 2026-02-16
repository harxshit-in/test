import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalExams: 0,
    totalQuestions: 0,
    totalStudents: 0,
    totalAttempts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total exams
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const totalExams = examsSnapshot.size;

      // Fetch total questions
      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const totalQuestions = questionsSnapshot.size;

      // Fetch total students
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      const usersSnapshot = await getDocs(usersQuery);
      const totalStudents = usersSnapshot.size;

      // Fetch total attempts
      const attemptsSnapshot = await getDocs(collection(db, 'attempts'));
      const totalAttempts = attemptsSnapshot.size;

      setStats({
        totalExams,
        totalQuestions,
        totalStudents,
        totalAttempts
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

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
          <p>Manage exams, questions, and monitor student performance</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <h3>Total Exams</h3>
            <p className="stat-value">{loading ? '...' : stats.totalExams}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">❓</div>
            <h3>Total Questions</h3>
            <p className="stat-value">{loading ? '...' : stats.totalQuestions}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <h3>Total Students</h3>
            <p className="stat-value">{loading ? '...' : stats.totalStudents}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <h3>Tests Attempted</h3>
            <p className="stat-value">{loading ? '...' : stats.totalAttempts}</p>
          </div>
        </div>
        
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="btn-action"
              onClick={() => navigate('/admin/exams')}
            >
              <span className="action-icon">📋</span>
              Manage Exams
            </button>
            <button 
              className="btn-action"
              onClick={() => navigate('/admin/exams')}
            >
              <span className="action-icon">❓</span>
              View All Questions
            </button>
            <button 
              className="btn-action"
              onClick={() => alert('Coming soon!')}
            >
              <span className="action-icon">📊</span>
              View Reports
            </button>
            <button 
              className="btn-action"
              onClick={() => alert('Coming soon!')}
            >
              <span className="action-icon">👥</span>
              Manage Students
            </button>
          </div>
        </div>
        
        <div className="section">
          <h2>Getting Started</h2>
          <div className="info-box">
            <h3>✨ Admin Panel Features</h3>
            <ul>
              <li>✅ Create and manage exams with categories (SSC, Banking, Railways, etc.)</li>
              <li>✅ Add multiple choice questions with 4 options</li>
              <li>✅ Upload images for questions</li>
              <li>✅ Set correct answers and explanations</li>
              <li>✅ Configure exam duration, marks, and negative marking</li>
              <li>✅ Edit and delete exams/questions anytime</li>
              <li>⏳ Student test engine - Coming in Phase 3</li>
              <li>⏳ Results and analytics - Coming in Phase 3</li>
            </ul>
            <button 
              className="btn-primary"
              onClick={() => navigate('/admin/exams')}
              style={{ marginTop: '20px' }}
            >
              Start Managing Exams →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
