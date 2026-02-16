import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import '../styles/StudentDashboard.css';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    totalTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'SSC CGL', 'SSC CHSL', 'SSC MTS', 'IBPS PO', 'IBPS Clerk', 
                      'SBI PO', 'SBI Clerk', 'RRB NTPC', 'RRB Group D', 'UPSC', 'State PSC', 'Other'];

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      console.log('Fetching data for user:', currentUser.uid);
      
      // Fetch all exams
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const examsData = examsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Exams fetched:', examsData.length);
      setExams(examsData);

      // Fetch user's attempts
      const attemptsQuery = query(
        collection(db, 'attempts'),
        where('userId', '==', currentUser.uid)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);
      let attemptsData = attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Attempts fetched:', attemptsData.length);
      
      // Sort by endTime (most recent first)
      attemptsData.sort((a, b) => {
        const dateA = a.endTime ? new Date(a.endTime).getTime() : 0;
        const dateB = b.endTime ? new Date(b.endTime).getTime() : 0;
        return dateB - dateA;
      });
      
      setAttempts(attemptsData);

      // Calculate stats
      if (attemptsData.length > 0) {
        const totalScore = attemptsData.reduce((sum, attempt) => {
          const score = attempt.score || 0;
          const total = attempt.totalMarks || 100;
          return sum + (score / total) * 100;
        }, 0);
        const avgScore = totalScore / attemptsData.length;
        
        const totalTimeMs = attemptsData.reduce((sum, attempt) => {
          return sum + (attempt.timeTaken || 0);
        }, 0);
        const totalHours = totalTimeMs / 3600;

        console.log('Stats calculated:', {
          totalAttempts: attemptsData.length,
          averageScore: avgScore,
          totalTime: totalHours
        });

        setStats({
          totalAttempts: attemptsData.length,
          averageScore: Math.round(avgScore),
          totalTime: totalHours.toFixed(1)
        });
      } else {
        setStats({
          totalAttempts: 0,
          averageScore: 0,
          totalTime: 0
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleStartTest = (examId) => {
    navigate(`/test-overview/${examId}`);
  };

  const handleViewResult = (attemptId) => {
    navigate(`/results/${attemptId}`);
  };

  const filteredExams = selectedCategory === 'All' 
    ? exams 
    : exams.filter(exam => exam.category === selectedCategory);

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>ExamPrepBook</h2>
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
            <p className="stat-value">{loading ? '...' : stats.totalAttempts}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>Average Score</h3>
            <p className="stat-value">
              {loading ? '...' : stats.totalAttempts > 0 ? `${stats.averageScore}%` : '-'}
            </p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <h3>Tests Available</h3>
            <p className="stat-value">{loading ? '...' : exams.length}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <h3>Total Time Spent</h3>
            <p className="stat-value">{loading ? '...' : stats.totalTime} hrs</p>
          </div>
        </div>
        
        <div className="section">
          <div className="section-header">
            <h2>Available Mock Tests</h2>
            <div className="category-filter">
              <label>Filter by Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          {loading ? (
            <p className="section-description">Loading exams...</p>
          ) : filteredExams.length === 0 ? (
            <div className="empty-state-small">
              <p>No exams available in this category.</p>
            </div>
          ) : (
            <div className="exams-grid">
              {filteredExams.map(exam => {
                const userAttempts = attempts.filter(a => a.examId === exam.id);
                const bestScore = userAttempts.length > 0 
                  ? Math.max(...userAttempts.map(a => a.score || 0))
                  : null;

                return (
                  <div key={exam.id} className="exam-card-student">
                    <div className="exam-card-header">
                      <h3>{exam.title}</h3>
                      <span className="category-badge">{exam.category}</span>
                    </div>
                    
                    <div className="exam-card-body">
                      {exam.description && (
                        <p className="exam-description">{exam.description}</p>
                      )}
                      
                      <div className="exam-stats">
                        <div className="stat-item">
                          <span className="stat-icon">❓</span>
                          <span>{exam.totalQuestions || 0} questions</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">⏱️</span>
                          <span>{exam.durationMinutes} min</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">📊</span>
                          <span>{exam.totalMarks} marks</span>
                        </div>
                      </div>

                      {exam.negativeMarking && (
                        <div className="negative-marking-badge">
                          ⚠️ Negative Marking: -{exam.negativeMarks || 0.25} per wrong answer
                        </div>
                      )}

                      {bestScore !== null && bestScore > 0 && (
                        <div className="best-score-badge">
                          🏆 Best Score: {bestScore}/{exam.totalMarks}
                        </div>
                      )}

                      {userAttempts.length > 0 && (
                        <div className="attempt-count">
                          Attempted {userAttempts.length} time{userAttempts.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    
                    <div className="exam-card-footer">
                      <button 
                        className="btn-primary"
                        onClick={() => handleStartTest(exam.id)}
                        disabled={!exam.totalQuestions || exam.totalQuestions === 0}
                      >
                        {userAttempts.length > 0 ? '📖 View & Reattempt' : '📖 View Details'}
                      </button>
                      {!exam.totalQuestions || exam.totalQuestions === 0 ? (
                        <span className="no-questions-note">No questions yet</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="section">
          <h2>Recent Activity</h2>
          {loading ? (
            <p className="section-description">Loading...</p>
          ) : attempts.length === 0 ? (
            <p className="section-description">
              No test attempts yet. Start your first test above!
            </p>
          ) : (
            <div className="activity-list">
              {attempts.slice(0, 5).map(attempt => {
                const exam = exams.find(e => e.id === attempt.examId);
                if (!exam) return null;

                const percentage = attempt.totalMarks > 0 
                  ? ((attempt.score / attempt.totalMarks) * 100).toFixed(1)
                  : 0;
                const date = attempt.endTime ? new Date(attempt.endTime).toLocaleDateString() : 'N/A';
                const time = attempt.endTime ? new Date(attempt.endTime).toLocaleTimeString() : 'N/A';

                return (
                  <div key={attempt.id} className="activity-item">
                    <div className="activity-info">
                      <h4>{exam.title}</h4>
                      <p className="activity-meta">
                        {date} at {time} • Score: {attempt.score}/{attempt.totalMarks} ({percentage}%)
                      </p>
                    </div>
                    <button 
                      className="btn-secondary btn-sm"
                      onClick={() => handleViewResult(attempt.id)}
                    >
                      View Result
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
