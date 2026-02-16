import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamManagement from './pages/ExamManagement';
import QuestionManagement from './pages/QuestionManagement';
import TestEngine from './pages/TestEngine';
import Results from './pages/Results';
import Unauthorized from './pages/Unauthorized';

// Global Styles
import './styles/App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Student Routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute requiredRole="student">
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/test/:examId" 
              element={
                <PrivateRoute requiredRole="student">
                  <TestEngine />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/results/:attemptId" 
              element={
                <PrivateRoute requiredRole="student">
                  <Results />
                </PrivateRoute>
              } 
            />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/exams" 
              element={
                <PrivateRoute requiredRole="admin">
                  <ExamManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/exams/:examId/questions" 
              element={
                <PrivateRoute requiredRole="admin">
                  <QuestionManagement />
                </PrivateRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
