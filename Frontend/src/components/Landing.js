import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Welcome to Social Media Campaign Manager</h1>
        <p className="subtitle">Streamline your social media marketing with our powerful campaign management tools</p>
        <div className="cta-buttons">
          <Link to="/login" className="primary-button">
            Get Started
          </Link>
          <Link to="/register" className="secondary-button">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing; 