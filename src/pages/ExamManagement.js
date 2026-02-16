import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import '../styles/ExamManagement.css';

const ExamManagement = () => {
  const { currentUser } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    durationMinutes: '',
    totalMarks: '',
    description: '',
    instructions: '',
    negativeMarking: false,
    negativeMarks: ''
  });

  const categories = [
    'SSC CGL',
    'SSC CHSL',
    'SSC MTS',
    'IBPS PO',
    'IBPS Clerk',
    'SBI PO',
    'SBI Clerk',
    'RRB NTPC',
    'RRB Group D',
    'UPSC',
    'State PSC',
    'Other'
  ];

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const examsQuery = query(
        collection(db, 'exams'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(examsQuery);
      const examsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExams(examsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      durationMinutes: '',
      totalMarks: '',
      description: '',
      instructions: '',
      negativeMarking: false,
      negativeMarks: ''
    });
    setEditingExam(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.durationMinutes || !formData.totalMarks) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const examData = {
        title: formData.title,
        category: formData.category,
        durationMinutes: parseInt(formData.durationMinutes),
        totalMarks: parseInt(formData.totalMarks),
        description: formData.description,
        instructions: formData.instructions,
        negativeMarking: formData.negativeMarking,
        negativeMarks: formData.negativeMarking ? parseFloat(formData.negativeMarks) : 0,
        createdBy: currentUser.uid,
        updatedAt: new Date().toISOString()
      };

      if (editingExam) {
        // Update existing exam
        await updateDoc(doc(db, 'exams', editingExam.id), examData);
        alert('Exam updated successfully!');
      } else {
        // Create new exam
        examData.createdAt = new Date().toISOString();
        examData.totalQuestions = 0;
        await addDoc(collection(db, 'exams'), examData);
        alert('Exam created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Failed to save exam. Please try again.');
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      category: exam.category,
      durationMinutes: exam.durationMinutes.toString(),
      totalMarks: exam.totalMarks.toString(),
      description: exam.description || '',
      instructions: exam.instructions || '',
      negativeMarking: exam.negativeMarking || false,
      negativeMarks: exam.negativeMarks?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'exams', examId));
        alert('Exam deleted successfully!');
        fetchExams();
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam. Please try again.');
      }
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCopyLink = (examId) => {
    const link = `${window.location.origin}/test-overview/${examId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('✅ Test link copied to clipboard!\n\nShare this link with students:\n' + link);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✅ Test link copied to clipboard!\n\nShare this link with students:\n' + link);
    });
  };

  if (loading) {
    return <div className="loading">Loading exams...</div>;
  }

  return (
    <div className="exam-management">
      <div className="page-header">
        <div>
          <h1>Exam Management</h1>
          <p>Create and manage mock tests</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          + Create New Exam
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>No Exams Yet</h2>
          <p>Create your first exam to get started</p>
          <button className="btn-primary" onClick={openCreateModal}>
            Create First Exam
          </button>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="exam-card">
              <div className="exam-card-header">
                <div>
                  <h3>{exam.title}</h3>
                  <span className="category-badge">{exam.category}</span>
                </div>
              </div>
              
              <div className="exam-card-body">
                {exam.description && (
                  <p className="exam-description">{exam.description}</p>
                )}
                
                <div className="exam-stats">
                  <div className="stat-item">
                    <span className="stat-icon">⏱️</span>
                    <span>{exam.durationMinutes} min</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">📊</span>
                    <span>{exam.totalMarks} marks</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">❓</span>
                    <span>{exam.totalQuestions || 0} questions</span>
                  </div>
                </div>

                {exam.negativeMarking && (
                  <div className="negative-marking-badge">
                    ⚠️ Negative Marking: -{exam.negativeMarks} per wrong answer
                  </div>
                )}
              </div>
              
              <div className="exam-card-footer">
                <button 
                  className="btn-secondary btn-sm"
                  onClick={() => window.location.href = `/admin/exams/${exam.id}/questions`}
                >
                  Manage Questions
                </button>
                <div className="action-buttons">
                  <button 
                    className="btn-icon share-btn"
                    onClick={() => handleCopyLink(exam.id)}
                    title="Copy shareable link"
                  >
                    🔗
                  </button>
                  <button 
                    className="btn-icon"
                    onClick={() => handleEdit(exam)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(exam.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit Exam */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExam ? 'Edit Exam' : 'Create New Exam'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="exam-form">
              <div className="form-group">
                <label htmlFor="title">Exam Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., SSC CGL Tier 1 Mock Test 2024"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="durationMinutes">Duration (minutes) *</label>
                  <input
                    type="number"
                    id="durationMinutes"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    placeholder="60"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="totalMarks">Total Marks *</label>
                  <input
                    type="number"
                    id="totalMarks"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the exam..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="instructions">Instructions</label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  placeholder="Exam instructions for students..."
                  rows="4"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="negativeMarking"
                    checked={formData.negativeMarking}
                    onChange={handleInputChange}
                  />
                  Enable Negative Marking
                </label>
              </div>

              {formData.negativeMarking && (
                <div className="form-group">
                  <label htmlFor="negativeMarks">Negative Marks per Wrong Answer</label>
                  <input
                    type="number"
                    id="negativeMarks"
                    name="negativeMarks"
                    value={formData.negativeMarks}
                    onChange={handleInputChange}
                    placeholder="0.25"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
