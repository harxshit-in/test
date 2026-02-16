import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Leaderboard from '../components/Leaderboard';
import '../styles/Results.css';

const Results = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResults = async () => {
    try {
      // Fetch attempt
      const attemptDoc = await getDoc(doc(db, 'attempts', attemptId));
      if (!attemptDoc.exists()) {
        alert('Results not found');
        navigate('/dashboard');
        return;
      }

      const attemptData = { id: attemptDoc.id, ...attemptDoc.data() };
      
      // Verify user owns this attempt
      if (attemptData.userId !== currentUser.uid) {
        alert('Unauthorized access');
        navigate('/dashboard');
        return;
      }

      setAttempt(attemptData);

      // Fetch questions
      const questionsQuery = query(
        collection(db, 'questions'),
        where('examId', '==', attemptData.examId)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsData = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setQuestions(questionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      alert('Failed to load results');
      navigate('/dashboard');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnswerStatus = (questionIndex) => {
    const userAnswer = attempt.answers[questionIndex];
    const question = questions[questionIndex];
    
    if (userAnswer === undefined) return 'unanswered';
    if (userAnswer === question.correctOptionIndex) return 'correct';
    return 'incorrect';
  };

  const renderOverview = () => {
    const percentage = ((attempt.score / attempt.totalMarks) * 100).toFixed(1);
    const accuracy = ((attempt.correctAnswers / attempt.totalQuestions) * 100).toFixed(1);

    return (
      <div className="overview-section">
        <div className="score-card">
          <div className="score-main">
            <h1>{attempt.score}</h1>
            <p className="score-total">out of {attempt.totalMarks}</p>
          </div>
          <div className="score-percentage">
            <div className={`percentage-badge ${percentage >= 75 ? 'excellent' : percentage >= 50 ? 'good' : 'needs-improvement'}`}>
              {percentage}%
            </div>
            <p className="percentage-label">
              {percentage >= 75 ? 'Excellent!' : percentage >= 50 ? 'Good Job!' : 'Keep Practicing!'}
            </p>
          </div>
        </div>

        <div className="stats-grid-results">
          <div className="stat-card-result">
            <div className="stat-icon-result correct">✓</div>
            <div className="stat-content">
              <h3>{attempt.correctAnswers}</h3>
              <p>Correct</p>
            </div>
          </div>

          <div className="stat-card-result">
            <div className="stat-icon-result incorrect">✗</div>
            <div className="stat-content">
              <h3>{attempt.incorrectAnswers}</h3>
              <p>Incorrect</p>
            </div>
          </div>

          <div className="stat-card-result">
            <div className="stat-icon-result unanswered">−</div>
            <div className="stat-content">
              <h3>{attempt.unansweredQuestions}</h3>
              <p>Unanswered</p>
            </div>
          </div>

          <div className="stat-card-result">
            <div className="stat-icon-result accuracy">📊</div>
            <div className="stat-content">
              <h3>{accuracy}%</h3>
              <p>Accuracy</p>
            </div>
          </div>

          <div className="stat-card-result">
            <div className="stat-icon-result time">⏱️</div>
            <div className="stat-content">
              <h3>{formatTime(attempt.timeTaken)}</h3>
              <p>Time Taken</p>
            </div>
          </div>

          <div className="stat-card-result">
            <div className="stat-icon-result avg-time">⌛</div>
            <div className="stat-content">
              <h3>{Math.round(attempt.timeTaken / attempt.totalQuestions)}s</h3>
              <p>Avg Time/Q</p>
            </div>
          </div>
        </div>

        <div className="analysis-info">
          <h3>Test Details</h3>
          <div className="detail-row">
            <span className="detail-label">Exam:</span>
            <span className="detail-value">{attempt.examTitle}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Submitted At:</span>
            <span className="detail-value">{formatDate(attempt.endTime)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Total Questions:</span>
            <span className="detail-value">{attempt.totalQuestions}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Total Marks:</span>
            <span className="detail-value">{attempt.totalMarks}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSubjectAnalysis = () => {
    const subjectData = Object.entries(attempt.subjectWiseAnalysis || {});

    if (subjectData.length === 0) {
      return <p className="no-data">No subject-wise data available</p>;
    }

    return (
      <div className="subject-analysis">
        {subjectData.map(([subject, data]) => {
          const accuracy = ((data.correct / data.total) * 100).toFixed(1);
          return (
            <div key={subject} className="subject-card">
              <div className="subject-header">
                <h3>{subject}</h3>
                <span className="subject-score">{data.marks.toFixed(1)} marks</span>
              </div>
              
              <div className="subject-stats">
                <div className="subject-stat">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{data.total}</span>
                </div>
                <div className="subject-stat">
                  <span className="stat-label">Correct</span>
                  <span className="stat-value correct-text">{data.correct}</span>
                </div>
                <div className="subject-stat">
                  <span className="stat-label">Incorrect</span>
                  <span className="stat-value incorrect-text">{data.incorrect}</span>
                </div>
                <div className="subject-stat">
                  <span className="stat-label">Unanswered</span>
                  <span className="stat-value">{data.unanswered}</span>
                </div>
              </div>

              <div className="accuracy-bar">
                <div className="accuracy-fill" style={{ width: `${accuracy}%` }}></div>
              </div>
              <p className="accuracy-text">{accuracy}% Accuracy</p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSolutions = () => {
    return (
      <div className="solutions-section">
        {questions.map((question, index) => {
          const status = getAnswerStatus(index);
          const userAnswer = attempt.answers[index];

          return (
            <div 
              key={question.id} 
              className={`solution-card ${status}`}
              onClick={() => setSelectedQuestion(selectedQuestion === index ? null : index)}
            >
              <div className="solution-header">
                <div className="solution-number">
                  <span className={`status-badge ${status}`}>
                    {status === 'correct' ? '✓' : status === 'incorrect' ? '✗' : '−'}
                  </span>
                  <span>Question {index + 1}</span>
                </div>
                <div className="solution-meta">
                  <span className="marks-badge">+{question.marks}</span>
                  {question.subject && <span className="subject-badge">{question.subject}</span>}
                </div>
              </div>

              <div className="solution-body">
                <p className="question-text">{question.text}</p>
                
                {question.imageUrl && (
                  <div className="question-image">
                    <img src={question.imageUrl} alt="Question" />
                  </div>
                )}

                <div className="options-review">
                  {question.options.map((option, optIndex) => {
                    const isCorrect = optIndex === question.correctOptionIndex;
                    const isUserAnswer = optIndex === userAnswer;

                    return (
                      <div 
                        key={optIndex}
                        className={`option-review ${isCorrect ? 'correct-answer' : ''} ${isUserAnswer && !isCorrect ? 'wrong-answer' : ''}`}
                      >
                        <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                        <span className="option-text">{option}</span>
                        {isCorrect && <span className="correct-indicator">✓ Correct</span>}
                        {isUserAnswer && !isCorrect && <span className="wrong-indicator">Your Answer</span>}
                      </div>
                    );
                  })}
                </div>

                {selectedQuestion === index && question.explanation && (
                  <div className="explanation-section">
                    <h4>Explanation:</h4>
                    <p>{question.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Test Results</h1>
      </div>

      <div className="results-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'subject' ? 'active' : ''}`}
          onClick={() => setActiveTab('subject')}
        >
          Subject Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'solutions' ? 'active' : ''}`}
          onClick={() => setActiveTab('solutions')}
        >
          Solutions
        </button>
      </div>

      <div className="results-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'subject' && renderSubjectAnalysis()}
        {activeTab === 'solutions' && renderSolutions()}
      </div>

      <div className="results-actions">
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </button>
        <button className="btn-secondary" onClick={() => setShowLeaderboard(true)}>
          🏆 View Leaderboard
        </button>
        <button className="btn-primary" onClick={() => navigate(`/test/${attempt.examId}`)}>
          Reattempt Test
        </button>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard
          examId={attempt.examId}
          userAttempt={attempt}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
};

export default Results;
