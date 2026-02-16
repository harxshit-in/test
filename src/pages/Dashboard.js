import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all exams
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const examsData = examsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExams(examsData);

      // Fetch user's attempts
      const attemptsQuery = query(
        collection(db, 'attempts'),
        where('userId', '==', currentUser.uid),
        orderBy('endTime', 'desc')
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);
      const attemptsData = attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttempts(attemptsData);

      // Calculate stats
      if (attemptsData.length > 0) {
        const totalScore = attemptsData.reduce((sum, attempt) => sum + attempt.score, 0);
        const avgScore = (totalScore / attemptsData.length).toFixed(2);
        
        const totalTime = attemptsData.reduce((sum, attempt) => {
          const start = new Date(attempt.startTime);
          const end = new Date(attempt.endTime);
          return sum + (end - start);
        }, 0);
        const totalHours = (totalTime / (1000 * 60 * 60)).toFixed(1);

        setStats({
          totalAttempts: attemptsData.length,
          averageScore: avgScore,
          totalTime: totalHours
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
    navigate(`/test/${examId}`);
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
            <p className="stat-value">{loading ? '...' : stats.totalAttempts}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>Average Score</h3>
            <p className="stat-value">{loading ? '...' : stats.averageScore || '-'}</p>
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
                  ? Math.max(...userAttempts.map(a => a.score))
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
                          ⚠️ Negative Marking: -{exam.negativeMarks} per wrong answer
                        </div>
                      )}

                      {bestScore !== null && (
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
                        {userAttempts.length > 0 ? 'Reattempt Test' : 'Start Test'}
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

                const percentage = ((attempt.score / exam.totalMarks) * 100).toFixed(1);
                const date = new Date(attempt.endTime).toLocaleDateString();
                const time = new Date(attempt.endTime).toLocaleTimeString();

                return (
                  <div key={attempt.id} className="activity-item">
                    <div className="activity-info">
                      <h4>{exam.title}</h4>
                      <p className="activity-meta">
                        {date} at {time} • Score: {attempt.score}/{exam.totalMarks} ({percentage}%)
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
