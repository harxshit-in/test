import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import '../styles/TestEngine.css';

const TestEngine = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    fetchExamAndQuestions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (exam && !testStartTime) {
      const startTime = new Date().toISOString();
      setTestStartTime(startTime);
      setTimeRemaining(exam.durationMinutes * 60);
      startTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  const fetchExamAndQuestions = async () => {
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

      // Fetch questions
      const questionsQuery = query(
        collection(db, 'questions'),
        where('examId', '==', examId)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsData = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (questionsData.length === 0) {
        alert('No questions available for this exam');
        navigate('/dashboard');
        return;
      }

      setQuestions(questionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exam:', error);
      alert('Failed to load exam');
      navigate('/dashboard');
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionIndex) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: optionIndex
    });
  };

  const handleClearResponse = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestionIndex];
    setAnswers(newAnswers);
  };

  const handleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedForReview(newMarked);
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };

  const getQuestionStatus = (index) => {
    if (answers[index] !== undefined && markedForReview.has(index)) {
      return 'answered-marked';
    }
    if (answers[index] !== undefined) {
      return 'answered';
    }
    if (markedForReview.has(index)) {
      return 'marked';
    }
    if (index < currentQuestionIndex) {
      return 'not-answered';
    }
    return 'not-visited';
  };

  const calculateScore = () => {
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const subjectWise = {};

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const subject = question.subject || 'General';

      if (!subjectWise[subject]) {
        subjectWise[subject] = {
          total: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          marks: 0
        };
      }
      subjectWise[subject].total++;

      if (userAnswer === undefined) {
        unanswered++;
        subjectWise[subject].unanswered++;
      } else if (userAnswer === question.correctOptionIndex) {
        correct++;
        score += question.marks;
        subjectWise[subject].correct++;
        subjectWise[subject].marks += question.marks;
      } else {
        incorrect++;
        if (exam.negativeMarking) {
          score -= exam.negativeMarks;
          subjectWise[subject].marks -= exam.negativeMarks;
        }
        subjectWise[subject].incorrect++;
      }
    });

    return {
      score: Math.max(0, score),
      correct,
      incorrect,
      unanswered,
      total: questions.length,
      subjectWise
    };
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const endTime = new Date().toISOString();
      const results = calculateScore();

      const attemptData = {
        userId: currentUser.uid,
        examId: examId,
        examTitle: exam.title,
        answers: answers,
        markedForReview: Array.from(markedForReview),
        score: results.score,
        totalMarks: exam.totalMarks,
        correctAnswers: results.correct,
        incorrectAnswers: results.incorrect,
        unansweredQuestions: results.unanswered,
        totalQuestions: results.total,
        subjectWiseAnalysis: results.subjectWise,
        startTime: testStartTime,
        endTime: endTime,
        timeTaken: exam.durationMinutes * 60 - timeRemaining
      };

      const docRef = await addDoc(collection(db, 'attempts'), attemptData);
      navigate(`/results/${docRef.id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    if (!submitting) {
      alert('Time is up! Your test will be submitted automatically.');
      handleSubmit();
    }
  };

  if (loading) {
    return <div className="loading">Loading exam...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const notAnsweredCount = questions.length - answeredCount;

  return (
    <div className="test-engine">
      {/* Header */}
      <div className="test-header">
        <div className="test-info">
          <h2>{exam.title}</h2>
          <p>{exam.category}</p>
        </div>
        <div className="timer-container">
          <div className={`timer ${timeRemaining < 300 ? 'timer-warning' : ''}`}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>

      <div className="test-body">
        {/* Question Panel */}
        <div className="question-panel">
          <div className="question-header">
            <span className="question-number">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="question-marks">+{currentQuestion.marks} marks</span>
          </div>

          <div className="question-content">
            <p className="question-text">{currentQuestion.text}</p>
            
            {currentQuestion.imageUrl && (
              <div className="question-image">
                <img src={currentQuestion.imageUrl} alt="Question" />
              </div>
            )}

            <div className="options-container">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`option ${answers[currentQuestionIndex] === index ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(index)}
                >
                  <div className="option-radio">
                    {answers[currentQuestionIndex] === index && <div className="radio-dot" />}
                  </div>
                  <div className="option-label">{String.fromCharCode(65 + index)}.</div>
                  <div className="option-text">{option}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="question-actions">
            <button 
              className="btn-action-secondary"
              onClick={handleMarkForReview}
            >
              {markedForReview.has(currentQuestionIndex) ? '✓ Marked for Review' : 'Mark for Review'}
            </button>
            <button 
              className="btn-action-secondary"
              onClick={handleClearResponse}
              disabled={answers[currentQuestionIndex] === undefined}
            >
              Clear Response
            </button>
          </div>

          <div className="navigation-buttons">
            <button 
              className="btn-nav"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>
            <button 
              className="btn-nav btn-primary"
              onClick={handleSaveAndNext}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Save' : 'Save & Next →'}
            </button>
          </div>
        </div>

        {/* Navigation Palette */}
        <div className="navigation-palette">
          <div className="palette-header">
            <h3>Question Palette</h3>
          </div>

          <div className="palette-legend">
            <div className="legend-item">
              <span className="legend-box answered"></span>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="legend-item">
              <span className="legend-box not-answered"></span>
              <span>Not Answered ({notAnsweredCount})</span>
            </div>
            <div className="legend-item">
              <span className="legend-box marked"></span>
              <span>Marked ({markedCount})</span>
            </div>
            <div className="legend-item">
              <span className="legend-box answered-marked"></span>
              <span>Answered & Marked</span>
            </div>
          </div>

          <div className="palette-grid">
            {questions.map((_, index) => (
              <button
                key={index}
                className={`palette-button ${getQuestionStatus(index)} ${index === currentQuestionIndex ? 'current' : ''}`}
                onClick={() => handleQuestionNavigation(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="submit-section">
            <button 
              className="btn-submit"
              onClick={() => setShowSubmitConfirm(true)}
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Submit Test?</h2>
            </div>
            <div className="submit-summary">
              <p>Are you sure you want to submit the test?</p>
              <div className="summary-stats">
                <div className="summary-item">
                  <strong>{answeredCount}</strong>
                  <span>Answered</span>
                </div>
                <div className="summary-item">
                  <strong>{notAnsweredCount}</strong>
                  <span>Not Answered</span>
                </div>
                <div className="summary-item">
                  <strong>{markedCount}</strong>
                  <span>Marked for Review</span>
                </div>
              </div>
              <p className="warning-text">You cannot change your answers after submission.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestEngine;
