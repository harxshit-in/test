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
  const [rankData, setRankData] = useState(null);

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResults = async () => {
    try {
      const attemptDoc = await getDoc(doc(db, 'attempts', attemptId));
      if (!attemptDoc.exists()) {
        alert('Results not found');
        navigate('/dashboard');
        return;
      }

      const attemptData = { id: attemptDoc.id, ...attemptDoc.data() };
      
      if (attemptData.userId !== currentUser.uid) {
        alert('Unauthorized access');
        navigate('/dashboard');
        return;
      }

      setAttempt(attemptData);

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
      
      await fetchRankData(attemptData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setLoading(false);
    }
  };

  const fetchRankData = async (attemptData) => {
    try {
      const allAttemptsQuery = query(
        collection(db, 'attempts'),
        where('examId', '==', attemptData.examId)
      );
      const allAttemptsSnapshot = await getDocs(allAttemptsQuery);
      let allAttempts = allAttemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      allAttempts.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.timeTaken || 0) - (b.timeTaken || 0);
      });

      const userRank = allAttempts.findIndex(a => a.id === attemptData.id) + 1;
      const totalParticipants = allAttempts.length;

      const topperAttempt = allAttempts[0];
      const totalScore = allAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
      const avgScore = totalScore / allAttempts.length;
      const avgAccuracy = allAttempts.reduce((sum, a) => {
        const acc = ((a.correctAnswers || 0) / (a.totalQuestions || 1)) * 100;
        return sum + acc;
      }, 0) / allAttempts.length;

      setRankData({
        rank: userRank,
        totalParticipants,
        percentile: ((totalParticipants - userRank + 1) / totalParticipants) * 100,
        topper: {
          score: topperAttempt.score || 0,
          accuracy: (((topperAttempt.correctAnswers || 0) / (topperAttempt.totalQuestions || 1)) * 100).toFixed(1),
          timeTaken: topperAttempt.timeTaken || 0
        },
        average: {
          score: avgScore.toFixed(1),
          accuracy: avgAccuracy.toFixed(1)
        },
        userStats: {
          score: attemptData.score || 0,
          accuracy: (((attemptData.correctAnswers || 0) / (attemptData.totalQuestions || 1)) * 100).toFixed(1),
          timeTaken: attemptData.timeTaken || 0
        }
      });
    } catch (error) {
      console.error('Error fetching rank data:', error);
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

  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', text: 'Champion', class: 'gold' };
    if (rank === 2) return { emoji: '🥈', text: '2nd Place', class: 'silver' };
    if (rank === 3) return { emoji: '🥉', text: '3rd Place', class: 'bronze' };
    if (rank <= 10) return { emoji: '🏆', text: `Top 10`, class: 'top10' };
    return { emoji: '📊', text: `Rank ${rank}`, class: 'default' };
  };

  const renderOverview = () => {
    const percentage = ((attempt.score / attempt.totalMarks) * 100).toFixed(1);
    const accuracy = ((attempt.correctAnswers / attempt.totalQuestions) * 100).toFixed(1);
    const rankBadge = rankData ? getRankBadge(rankData.rank) : null;

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

        {rankData && (
          <div className="rank-comparison-section">
            <h3 className="comparison-title">📊 Your Performance Analysis</h3>
            
            <div className="rank-display-card">
              <div className="rank-badge-display">
                <span className="rank-emoji-large">{rankBadge.emoji}</span>
                <div className="rank-info">
                  <span className="rank-number">#{rankData.rank}</span>
                  <span className="rank-label">{rankBadge.text}</span>
                  <span className="rank-percentile">{rankData.percentile.toFixed(1)}th Percentile</span>
                </div>
              </div>
              <div className="participants-info">
                Out of <strong>{rankData.totalParticipants}</strong> participants
              </div>
            </div>

            <div className="comparison-grid">
              <div className="comparison-card topper-card">
                <div className="card-header">
                  <span className="card-icon">🥇</span>
                  <h4>Top Scorer</h4>
                </div>
                <div className="comparison-stats">
                  <div className="stat-row">
                    <span>Score:</span>
                    <strong>{rankData.topper.score}/{attempt.totalMarks}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Accuracy:</span>
                    <strong>{rankData.topper.accuracy}%</strong>
                  </div>
                  <div className="stat-row">
                    <span>Time:</span>
                    <strong>{formatTime(rankData.topper.timeTaken)}</strong>
                  </div>
                </div>
              </div>

              <div className="comparison-card you-card">
                <div className="card-header">
                  <span className="card-icon">👤</span>
                  <h4>Your Score</h4>
                </div>
                <div className="comparison-stats">
                  <div className="stat-row">
                    <span>Score:</span>
                    <strong>{rankData.userStats.score}/{attempt.totalMarks}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Accuracy:</span>
                    <strong>{rankData.userStats.accuracy}%</strong>
                  </div>
                  <div className="stat-row">
                    <span>Time:</span>
                    <strong>{formatTime(rankData.userStats.timeTaken)}</strong>
                  </div>
                </div>
              </div>

              <div className="comparison-card average-card">
                <div className="card-header">
                  <span className="card-icon">📊</span>
                  <h4>Class Average</h4>
                </div>
                <div className="comparison-stats">
                  <div className="stat-row">
                    <span>Score:</span>
                    <strong>{rankData.average.score}/{attempt.totalMarks}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Accuracy:</span>
                    <strong>{rankData.average.accuracy}%</strong>
                  </div>
                  <div className="stat-row">
                    <span>Avg Rank:</span>
                    <strong>#{Math.ceil(rankData.totalParticipants / 2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
