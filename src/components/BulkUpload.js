import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/BulkUpload.css';

const BulkUpload = ({ examId, onSuccess, onClose }) => {
  const [jsonText, setJsonText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showExample, setShowExample] = useState(false);

  const exampleJSON = `[
  {
    "text": "What is the capital of India?",
    "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
    "correctOptionIndex": 1,
    "explanation": "New Delhi is the capital of India.",
    "marks": 2,
    "subject": "General Knowledge",
    "difficulty": "easy"
  },
  {
    "text": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
    "correctOptionIndex": 1,
    "explanation": "Mars is known as the Red Planet due to its reddish appearance.",
    "marks": 2,
    "subject": "General Knowledge",
    "difficulty": "easy"
  },
  {
    "text": "What is 15 × 12?",
    "options": ["160", "170", "180", "190"],
    "correctOptionIndex": 2,
    "explanation": "15 × 12 = 180",
    "marks": 2,
    "subject": "Quantitative Aptitude",
    "difficulty": "medium"
  }
]`;

  const validateQuestion = (question, index) => {
    const errors = [];

    // Required fields
    if (!question.text || question.text.trim() === '') {
      errors.push(`Question ${index + 1}: Missing question text`);
    }

    // Options validation
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      errors.push(`Question ${index + 1}: Must have exactly 4 options`);
    } else {
      question.options.forEach((opt, i) => {
        if (!opt || opt.trim() === '') {
          errors.push(`Question ${index + 1}: Option ${i + 1} is empty`);
        }
      });
    }

    // Correct answer validation
    if (typeof question.correctOptionIndex !== 'number' || 
        question.correctOptionIndex < 0 || 
        question.correctOptionIndex > 3) {
      errors.push(`Question ${index + 1}: correctOptionIndex must be 0, 1, 2, or 3`);
    }

    // Marks validation
    if (!question.marks || question.marks <= 0) {
      errors.push(`Question ${index + 1}: marks must be a positive number`);
    }

    // Difficulty validation
    if (question.difficulty && !['easy', 'medium', 'hard'].includes(question.difficulty)) {
      errors.push(`Question ${index + 1}: difficulty must be "easy", "medium", or "hard"`);
    }

    return errors;
  };

  const handleUpload = async () => {
    setError('');

    // Validate JSON
    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch (e) {
      setError('Invalid JSON format. Please check your JSON syntax.');
      return;
    }

    // Check if it's an array
    if (!Array.isArray(questions)) {
      setError('JSON must be an array of questions.');
      return;
    }

    if (questions.length === 0) {
      setError('No questions found in JSON.');
      return;
    }

    // Validate all questions
    const allErrors = [];
    questions.forEach((question, index) => {
      const questionErrors = validateQuestion(question, index);
      allErrors.push(...questionErrors);
    });

    if (allErrors.length > 0) {
      setError(allErrors.join('\n'));
      return;
    }

    // Upload questions
    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const question of questions) {
        try {
          const questionData = {
            examId: examId,
            text: question.text.trim(),
            options: question.options.map(opt => opt.trim()),
            correctOptionIndex: question.correctOptionIndex,
            explanation: question.explanation?.trim() || '',
            marks: parseFloat(question.marks),
            subject: question.subject?.trim() || '',
            difficulty: question.difficulty || 'medium',
            imageUrl: null,
            imagePath: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await addDoc(collection(db, 'questions'), questionData);
          successCount++;
        } catch (err) {
          console.error('Error uploading question:', err);
          failCount++;
        }
      }

      // Update exam's total questions count
      await updateDoc(doc(db, 'exams', examId), {
        totalQuestions: increment(successCount)
      });

      if (failCount === 0) {
        alert(`Success! ${successCount} questions uploaded.`);
        onSuccess();
      } else {
        alert(`Partially uploaded: ${successCount} succeeded, ${failCount} failed.`);
        onSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload questions. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a .json file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target.result);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const copyExample = () => {
    setJsonText(exampleJSON);
    setShowExample(false);
    alert('Example JSON copied to editor!');
  };

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-header">
        <h2>Bulk Upload Questions</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="bulk-upload-content">
        <div className="upload-instructions">
          <h3>📋 Instructions:</h3>
          <ol>
            <li>Prepare questions in JSON format (see example below)</li>
            <li>Paste JSON in the editor or upload a .json file</li>
            <li>Click "Validate & Upload"</li>
            <li>Questions will be added to the exam</li>
          </ol>

          <div className="example-section">
            <button 
              className="btn-secondary btn-sm"
              onClick={() => setShowExample(!showExample)}
            >
              {showExample ? 'Hide Example' : 'Show Example JSON'}
            </button>

            {showExample && (
              <div className="example-json">
                <pre>{exampleJSON}</pre>
                <button className="btn-primary btn-sm" onClick={copyExample}>
                  Copy Example to Editor
                </button>
              </div>
            )}
          </div>

          <div className="json-format-guide">
            <h4>Required Fields:</h4>
            <ul>
              <li><code>text</code> (string): Question text</li>
              <li><code>options</code> (array): Exactly 4 options</li>
              <li><code>correctOptionIndex</code> (number): 0, 1, 2, or 3</li>
              <li><code>marks</code> (number): Points for question</li>
            </ul>

            <h4>Optional Fields:</h4>
            <ul>
              <li><code>explanation</code> (string): Answer explanation</li>
              <li><code>subject</code> (string): Subject/topic name</li>
              <li><code>difficulty</code> (string): "easy", "medium", or "hard"</li>
            </ul>

            <p className="note">
              <strong>Note:</strong> Images cannot be uploaded via JSON. 
              Add them individually for questions that need images.
            </p>
          </div>
        </div>

        <div className="upload-editor">
          <div className="editor-toolbar">
            <label htmlFor="file-upload" className="btn-secondary btn-sm">
              📁 Upload JSON File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <span className="toolbar-hint">or paste JSON below:</span>
          </div>

          <textarea
            className="json-editor"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste your JSON here or upload a file..."
            rows={15}
            disabled={uploading}
          />

          {error && (
            <div className="error-box">
              <strong>⚠️ Errors Found:</strong>
              <pre>{error}</pre>
            </div>
          )}

          <div className="upload-actions">
            <button 
              className="btn-secondary"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleUpload}
              disabled={uploading || !jsonText.trim()}
            >
              {uploading ? 'Uploading...' : 'Validate & Upload'}
            </button>
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-spinner"></div>
              <p>Uploading questions to Firebase...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
