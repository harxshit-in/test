import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import '../styles/QuestionManagement.css';

const QuestionManagement = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    explanation: '',
    marks: '',
    subject: '',
    difficulty: 'medium'
  });

  const subjects = [
    'General Intelligence',
    'General Awareness',
    'Quantitative Aptitude',
    'English Comprehension',
    'Reasoning',
    'Mathematics',
    'Computer Knowledge',
    'General Knowledge',
    'Current Affairs',
    'Other'
  ];

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId]);

  const fetchExamAndQuestions = async () => {
    try {
      // Fetch exam details
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (examDoc.exists()) {
        setExam({ id: examDoc.id, ...examDoc.data() });
      } else {
        alert('Exam not found');
        navigate('/admin/exams');
        return;
      }

      // Fetch questions
      const questionsQuery = query(
        collection(db, 'questions'),
        where('examId', '==', examId),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(questionsQuery);
      const questionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuestions(questionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      setUploading(true);
      const timestamp = Date.now();
      const fileName = `questions/${examId}/${timestamp}_${imageFile.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      setUploading(false);
      return { url: downloadURL, path: fileName };
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploading(false);
      alert('Failed to upload image. Please try again.');
      return null;
    }
  };

  const deleteImage = async (imagePath) => {
    if (!imagePath) return;
    
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
      marks: '',
      subject: '',
      difficulty: 'medium'
    });
    setEditingQuestion(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.text || formData.options.some(opt => !opt) || !formData.marks) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let imageData = editingQuestion?.imageUrl ? {
        url: editingQuestion.imageUrl,
        path: editingQuestion.imagePath
      } : null;

      // Upload new image if selected
      if (imageFile) {
        // Delete old image if editing and had an image
        if (editingQuestion?.imagePath) {
          await deleteImage(editingQuestion.imagePath);
        }
        imageData = await uploadImage();
        if (!imageData) return; // Upload failed
      }

      const questionData = {
        examId: examId,
        text: formData.text,
        options: formData.options,
        correctOptionIndex: parseInt(formData.correctOptionIndex),
        explanation: formData.explanation,
        marks: parseFloat(formData.marks),
        subject: formData.subject,
        difficulty: formData.difficulty,
        imageUrl: imageData?.url || null,
        imagePath: imageData?.path || null,
        updatedAt: new Date().toISOString()
      };

      if (editingQuestion) {
        // Update existing question
        await updateDoc(doc(db, 'questions', editingQuestion.id), questionData);
        alert('Question updated successfully!');
      } else {
        // Create new question
        questionData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'questions'), questionData);
        
        // Increment total questions count in exam
        await updateDoc(doc(db, 'exams', examId), {
          totalQuestions: increment(1)
        });
        
        alert('Question added successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchExamAndQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      text: question.text,
      options: question.options,
      correctOptionIndex: question.correctOptionIndex.toString(),
      explanation: question.explanation || '',
      marks: question.marks.toString(),
      subject: question.subject || '',
      difficulty: question.difficulty || 'medium'
    });
    setImagePreview(question.imageUrl);
    setShowModal(true);
  };

  const handleDelete = async (question) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        // Delete image if exists
        if (question.imagePath) {
          await deleteImage(question.imagePath);
        }

        // Delete question document
        await deleteDoc(doc(db, 'questions', question.id));
        
        // Decrement total questions count in exam
        await updateDoc(doc(db, 'exams', examId), {
          totalQuestions: increment(-1)
        });
        
        alert('Question deleted successfully!');
        fetchExamAndQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question. Please try again.');
      }
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading questions...</div>;
  }

  if (!exam) {
    return <div className="loading">Exam not found</div>;
  }

  return (
    <div className="question-management">
      <div className="page-header">
        <div>
          <button 
            className="back-button"
            onClick={() => navigate('/admin/exams')}
          >
            ← Back to Exams
          </button>
          <h1>{exam.title}</h1>
          <p>{questions.length} questions • {exam.totalMarks} marks • {exam.durationMinutes} minutes</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          + Add Question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <h2>No Questions Yet</h2>
          <p>Add your first question to this exam</p>
          <button className="btn-primary" onClick={openCreateModal}>
            Add First Question
          </button>
        </div>
      ) : (
        <div className="questions-list">
          {questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <div className="question-number">Q{index + 1}</div>
                <div className="question-meta">
                  <span className="difficulty-badge difficulty-{question.difficulty}">
                    {question.difficulty}
                  </span>
                  {question.subject && (
                    <span className="subject-badge">{question.subject}</span>
                  )}
                  <span className="marks-badge">+{question.marks} marks</span>
                </div>
              </div>
              
              <div className="question-body">
                <p className="question-text">{question.text}</p>
                
                {question.imageUrl && (
                  <div className="question-image">
                    <img src={question.imageUrl} alt="Question" />
                  </div>
                )}
                
                <div className="options-list">
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex} 
                      className={`option-item ${optIndex === question.correctOptionIndex ? 'correct-option' : ''}`}
                    >
                      <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                      <span className="option-text">{option}</span>
                      {optIndex === question.correctOptionIndex && (
                        <span className="correct-indicator">✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {question.explanation && (
                  <div className="explanation-box">
                    <strong>Explanation:</strong>
                    <p>{question.explanation}</p>
                  </div>
                )}
              </div>
              
              <div className="question-footer">
                <button 
                  className="btn-secondary btn-sm"
                  onClick={() => handleEdit(question)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="btn-danger btn-sm"
                  onClick={() => handleDelete(question)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit Question */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="question-form">
              <div className="form-group">
                <label htmlFor="text">Question Text *</label>
                <textarea
                  id="text"
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  placeholder="Enter the question..."
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="questionImage">Question Image (Optional)</label>
                <input
                  type="file"
                  id="questionImage"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button 
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Options *</label>
                {formData.options.map((option, index) => (
                  <div key={index} className="option-input-group">
                    <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="correctOptionIndex">Correct Answer *</label>
                  <select
                    id="correctOptionIndex"
                    name="correctOptionIndex"
                    value={formData.correctOptionIndex}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                    <option value="3">Option D</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="marks">Marks *</label>
                  <input
                    type="number"
                    id="marks"
                    name="marks"
                    value={formData.marks}
                    onChange={handleInputChange}
                    placeholder="2"
                    step="0.5"
                    min="0.5"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject">Subject/Topic</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="difficulty">Difficulty Level</label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="explanation">Explanation (Shown after test)</label>
                <textarea
                  id="explanation"
                  name="explanation"
                  value={formData.explanation}
                  onChange={handleInputChange}
                  placeholder="Explain the correct answer..."
                  rows="4"
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : (editingQuestion ? 'Update Question' : 'Add Question')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
