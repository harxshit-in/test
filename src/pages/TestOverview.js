import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import '../styles/TestOverview.css';

const TestOverview = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAttempts, setUserAttempts] = useState([]);

  useEffect(() => {
    fetchExamDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      // Fetch exam
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (!examDoc.exists()) {
        alert('Exam not found');
        navigate('/dashboard');
        return;
      }
      const examData = { id: examDoc.id, ...examDoc.data() };
      setExam(examData);

      // Fetch questions count and subjects
      const questionsQuery = query(
        collection(db, 'questions'),
        where('examId', '==', examId)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsData = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuestions(questionsData);

      // Fetch user's previous attempts
      if (currentUser) {
        const attemptsQuery = query(
          collection(db, 'attempts'),
          where('examId', '==', examId),
          where('userId', '==', currentUser.uid)
        );
        const attemptsSnapshot = await getDocs(attemptsQuery);
        const attemptsData = attemptsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserAttempts(attemptsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching exam:', error);
      setLoading(false);
    }
  };

  const getSubjectDistribution = () => {
    const subjects = {};
    questions.forEach(q => {
      const subject = q.subject || 'General';
      subjects[subject] = (subjects[subject] || 0) + 1;
    });
    return subjects;
  };

  const getDifficultyDistribution = () => {
    const difficulty = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => {
      if (q.difficulty) {
        difficulty[q.difficulty]++;
      }
    });
    return difficulty;
  };

  const getBestAttempt = () => {
    if (userAttempts.length === 0) return null;
    return userAttempts.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  const handleStartTest = () => {
    navigate(`/test/${examId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading exam details...</div>;
  }

  if (!exam) {
    return <div className="loading">Exam not found</div>;
  }

  const subjects = getSubjectDistribution();
  const difficulty = getDifficultyDistribution();
  const bestAttempt = getBestAttempt();

  return (
    <div className="test-overview">
      <div className="overview-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="overview-container">
        {/* Main Info Card */}
        <div className="overview-main-card">
          <div className="exam-badge">{exam.category}</div>
          <h1 className="exam-title">{exam.title}</h1>
          
          {exam.description && (
            <p className="exam-description">{exam.description}</p>
          )}

          <div className="exam-meta-grid">
            <div className="meta-item">
              <span className="meta-icon">❓</span>
              <div className="meta-content">
                <span className="meta-value">{questions.length}</span>
                <span className="meta-label">Questions</span>
              </div>
            </div>

            <div className="meta-item">
              <span className="meta-icon">📊</span>
              <div className="meta-content">
                <span className="meta-value">{exam.totalMarks}</span>
                <span className="meta-label">Total Marks</span>
              </div>
            </div>

            <div className="meta-item">
              <span className="meta-icon">⏱️</span>
              <div className="meta-content">
                <span className="meta-value">{exam.durationMinutes}</span>
                <span className="meta-label">Minutes</span>
              </div>
            </div>

            <div className="meta-item">
              <span className="meta-icon">📝</span>
              <div className="meta-content">
                <span className="meta-value">{userAttempts.length}</span>
                <span className="meta-label">Attempts</span>
              </div>
            </div>
          </div>

          {exam.negativeMarking && (
            <div className="warning-box">
              <span className="warning-icon">⚠️</span>
              <div>
                <strong>Negative Marking Enabled</strong>
                <p>-{exam.negativeMarks || 0.25} marks will be deducted for each incorrect answer</p>
              </div>
            </div>
          )}

          {bestAttempt && (
            <div className="best-attempt-card">
              <div className="attempt-header">
                <span className="trophy-icon">🏆</span>
                <h3>Your Best Performance</h3>
              </div>
              <div className="attempt-stats">
                <div className="attempt-stat">
                  <span className="stat-value">
                    {bestAttempt.score}/{exam.totalMarks}
                  </span>
                  <span className="stat-label">Score</span>
                </div>
                <div className="attempt-stat">
                  <span className="stat-value">
                    {((bestAttempt.score / exam.totalMarks) * 100).toFixed(1)}%
                  </span>
                  <span className="stat-label">Percentage</span>
                </div>
                <div className="attempt-stat">
                  <span className="stat-value">
                    {bestAttempt.correctAnswers}/{questions.length}
                  </span>
                  <span className="stat-label">Correct</span>
                </div>
              </div>
            </div>
          )}

          <div className="start-test-section">
            <button className="btn-start-test" onClick={handleStartTest}>
              {userAttempts.length > 0 ? '🔄 Reattempt Test' : '▶️ Start Test'}
            </button>
            <p className="start-test-hint">
              {userAttempts.length > 0 
                ? `You've attempted this test ${userAttempts.length} time${userAttempts.length > 1 ? 's' : ''}`
                : 'Ready to begin? Click to start the test'}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="overview-sidebar">
          {/* Subject Distribution */}
          {Object.keys(subjects).length > 0 && (
            <div className="sidebar-card">
              <h3>📚 Subject Distribution</h3>
              <div className="subject-list">
                {Object.entries(subjects).map(([subject, count]) => (
                  <div key={subject} className="subject-item">
                    <span className="subject-name">{subject}</span>
                    <span className="subject-count">{count} Q</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Distribution */}
          {(difficulty.easy > 0 || difficulty.medium > 0 || difficulty.hard > 0) && (
            <div className="sidebar-card">
              <h3>🎯 Difficulty Level</h3>
              <div className="difficulty-bars">
                {difficulty.easy > 0 && (
                  <div className="difficulty-item">
                    <div className="difficulty-header">
                      <span className="difficulty-label easy">Easy</span>
                      <span className="difficulty-count">{difficulty.easy}</span>
                    </div>
                    <div className="difficulty-bar">
                      <div 
                        className="difficulty-fill easy"
                        style={{ width: `${(difficulty.easy / questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {difficulty.medium > 0 && (
                  <div className="difficulty-item">
                    <div className="difficulty-header">
                      <span className="difficulty-label medium">Medium</span>
                      <span className="difficulty-count">{difficulty.medium}</span>
                    </div>
                    <div className="difficulty-bar">
                      <div 
                        className="difficulty-fill medium"
                        style={{ width: `${(difficulty.medium / questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {difficulty.hard > 0 && (
                  <div className="difficulty-item">
                    <div className="difficulty-header">
                      <span className="difficulty-label hard">Hard</span>
                      <span className="difficulty-count">{difficulty.hard}</span>
                    </div>
                    <div className="difficulty-bar">
                      <div 
                        className="difficulty-fill hard"
                        style={{ width: `${(difficulty.hard / questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {exam.instructions && (
            <div className="sidebar-card">
              <h3>📋 Instructions</h3>
              <div className="instructions-content">
                <p>{exam.instructions}</p>
              </div>
            </div>
          )}

          {/* General Instructions */}
          <div className="sidebar-card">
            <h3>ℹ️ General Guidelines</h3>
            <ul className="guidelines-list">
              <li>Read each question carefully</li>
              <li>You can mark questions for review</li>
              <li>Timer will auto-submit at 00:00:00</li>
              <li>All questions are multiple choice</li>
              <li>Navigate using question palette</li>
              <li>Results are instant after submission</li>
            </ul>
          </div>

          {/* Previous Attempts */}
          {userAttempts.length > 0 && (
            <div className="sidebar-card">
              <h3>📊 Previous Attempts</h3>
              <div className="attempts-list">
                {userAttempts.slice(0, 3).map((attempt, index) => (
                  <div key={attempt.id} className="attempt-item">
                    <div className="attempt-number">Attempt #{userAttempts.length - index}</div>
                    <div className="attempt-details">
                      <span className="attempt-score">
                        {attempt.score}/{exam.totalMarks}
                      </span>
                      <span className="attempt-date">
                        {formatDate(attempt.endTime)}
                      </span>
                    </div>
                    <button 
                      className="btn-view-result"
                      onClick={() => navigate(`/results/${attempt.id}`)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestOverview;
