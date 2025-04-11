import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";
import '../styles/Content.css';

const Content = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState('post');
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }
  }, []);

  // Initialize Gemini API with proper error handling
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // Directly use the API key instead of environment variable for testing
      const genAI = new GoogleGenerativeAI("AIzaSyC1oiWz_qr1ZDceyKg9SedUtsPLUW6gYM4");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Rest of your code remains the same
      const enhancedPrompt = `As a social media content creator for a retail business, ${prompt}. Keep the tone professional and engaging.`;
      
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();
      setGeneratedContent(text);
    } catch (err) {
      console.error('Error generating content:', err);
      console.error('Error details:', err.message);
      setError(`API error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const templates = [
    { id: 1, title: 'Product Launch', type: 'post' },
    { id: 2, title: 'Special Offer', type: 'post' },
    { id: 3, title: 'Holiday Sale', type: 'post' },
    { id: 4, title: 'Customer Story', type: 'post' }
  ];

  const promptSuggestions = [
    'Write a compelling product launch post for Instagram',
    'Create an engaging Facebook post about a summer sale',
    'Draft a Twitter thread about customer success stories',
    'Generate a Pinterest description for a new product collection'
  ];

  const posts = [
    { id: 1, title: 'Summer Collection Launch', platform: 'Instagram', type: 'Post', date: '2024-03-20', status: 'Published' },
    { id: 2, title: 'Spring Sale Announcement', platform: 'Facebook', type: 'Post', date: '2024-03-21', status: 'Draft' },
    { id: 3, title: 'Customer Testimonial', platform: 'Twitter', type: 'Thread', date: '2024-03-22', status: 'Scheduled' }
  ];

  return (
    <div className="content-layout">
      {/* <div className="left-sidebar">
        <div className="user-profile" onClick={handleProfileClick}>
          <div className="profile-image">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" />
            ) : (
              <div className="profile-initial">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h3>{user?.name || 'User Name'}</h3>
            <span className="role-badge">Admin</span>
          </div>
        </div>
      </div> */}

      <div className="content-creator">
        <div className="content-header">
          {/* <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go Back
          </button> */}
          <h1>Content Creator</h1>
        </div>

        <div className="content-grid">
          <div className="main-section">
            <div className="ai-generator">
              <h2>AI Content Generator</h2>
              <div className="generator-input">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your content prompt here..."
                  rows={4}
                />
                <button 
                  className="generate-btn"
                  onClick={handleGenerateContent}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Content'}
                </button>
                {error && <div className="error-message">{error}</div>}
              </div>
              {generatedContent && (
                <div className="generated-content">
                  <h3>Generated Content:</h3>
                  <div className="content-box">
                    {generatedContent}
                  </div>
                </div>
              )}
              <div className="prompt-suggestions">
                <h3>Prompt Suggestions:</h3>
                <div className="suggestions-grid">
                  {promptSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-btn"
                      onClick={() => setPrompt(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="content-library">
              <div className="library-header">
                <h2>Content Library</h2>
                <button className="create-new">Create New</button>
              </div>
              <div className="content-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Platform</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id}>
                        <td>{post.title}</td>
                        <td>{post.platform}</td>
                        <td>{post.type}</td>
                        <td>{post.date}</td>
                        <td>
                          <span className={`status-badge ${post.status.toLowerCase()}`}>
                            {post.status}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn">Edit</button>
                          <button className="action-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h2>Recent Templates</h2>
            <div className="templates-list">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <h3>{template.title}</h3>
                  <p>Type: {template.type}</p>
                  <button className="use-template">Use Template</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content; 