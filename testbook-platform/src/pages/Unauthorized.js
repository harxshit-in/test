import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

const Unauthorized = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Access Denied</h1>
          <p>You don't have permission to access this page</p>
        </div>
        
        <div className="error-message">
          This page requires specific permissions that your account doesn't have.
        </div>
        
        <div className="auth-footer">
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
