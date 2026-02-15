import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <nav className="home-nav">
        <div className="nav-brand">
          <h2>TestBook Platform</h2>
        </div>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/signup" className="btn-primary">Get Started</Link>
        </div>
      </nav>
      
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Master Your Exams with<br />
            <span className="highlight">Smart Test Preparation</span>
          </h1>
          <p className="hero-description">
            Practice with timed mock tests, get detailed performance analytics,
            and track your progress across multiple exam categories.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn-primary btn-large">
              Start Practicing Free
            </Link>
            <Link to="/login" className="btn-secondary btn-large">
              Sign In
            </Link>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="mockup-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
            <div className="mockup-content">
              <div className="mockup-stat">
                <span className="stat-label">Tests Taken</span>
                <span className="stat-value">150+</span>
              </div>
              <div className="mockup-stat">
                <span className="stat-label">Average Score</span>
                <span className="stat-value">85%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <h2 className="section-title">Why Choose TestBook Platform?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Timed Mock Tests</h3>
            <p>Experience real exam conditions with strict timing and auto-submit features</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Detailed Analytics</h3>
            <p>Track your performance with subject-wise breakdowns and accuracy metrics</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Instant Solutions</h3>
            <p>Get detailed explanations for every question after submission</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Multiple Categories</h3>
            <p>Practice for SSC, Banking, Railways, and many more competitive exams</p>
          </div>
        </div>
      </div>
      
      <footer className="home-footer">
        <p>&copy; 2026 TestBook Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
