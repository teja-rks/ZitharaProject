import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateCampaign.css';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Wand2 } from 'lucide-react';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const MAX_WORDS = 28;

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    platforms: [],
    scheduleDate: '',
    scheduleTime: '',
    image: null,
    imagePreview: null
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState({
    instagram: false,
    facebook: false,
    twitter: false
  });

  // Update word count whenever content changes
  useEffect(() => {
    const words = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [formData.content]);

  const promptSuggestions = [
    'Create a post for our summer sale with 25% off all items',
    'Write an Instagram caption about our new store location',
    'Generate a Twitter post announcing our flash sale this weekend',
    'Create Facebook post about new product arrivals'
  ];

  const handlePlatformSelect = (platform) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
    
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
    
    if (errors.platforms) {
      setErrors(prev => ({ ...prev, platforms: null }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If it's the content field, check word count
    if (name === 'content') {
      const words = value.trim() ? value.trim().split(/\s+/) : [];
      
      // Only update if within limit or if deleting text
      if (words.length <= MAX_WORDS || value.length < formData.content.length) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size should be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, image: null }));
    }
  };

  const generateAIContent = async (prompt) => {
    if (!prompt.trim()) {
      setErrors(prev => ({ ...prev, ai: 'Please enter a prompt' }));
      return;
    }

    setAiLoading(true);
    setErrors(prev => ({ ...prev, ai: null }));

    try {
      // Initialize the API
      const genAI = new GoogleGenerativeAI("AIzaSyC1oiWz_qr1ZDceyKg9SedUtsPLUW6gYM4");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Add more context to the prompt including word limit
      const enhancedPrompt = `As a social media content creator for a business, create the following: ${prompt}. 
      Keep the tone professional and engaging. IMPORTANT: Limit the response to no more than ${MAX_WORDS} words.`;
      
      const result = await model.generateContent(enhancedPrompt);
      if (!result || !result.response) {
        throw new Error('Empty response from API');
      }
      
      const response = result.response;
      const text = response.text();
      
      // Check if the generated content exceeds word limit
      const words = text.trim().split(/\s+/);
      if (words.length > MAX_WORDS) {
        // Truncate to MAX_WORDS words
        const truncatedText = words.slice(0, MAX_WORDS).join(' ');
        setGeneratedContent(truncatedText);
      } else {
        setGeneratedContent(text);
      }
    } catch (err) {
      console.error('Error generating content:', err);
      
      // More descriptive error messages
      if (err.message.includes('API key')) {
        setErrors(prev => ({
          ...prev,
          ai: 'API key issue. Please check your configuration.'
        }));
      } else if (err.message.includes('network')) {
        setErrors(prev => ({
          ...prev,
          ai: 'Network error. Please check your connection.'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          ai: `Failed to generate content: ${err.message}`
        }));
      }
    } finally {
      setAiLoading(false);
    }
  };

  const useGeneratedContent = () => {
    setFormData(prev => ({
      ...prev,
      content: generatedContent
    }));
    setShowAiGenerator(false);
    setGeneratedContent('');
    setAiPrompt('');
  };

  const validateForm = () => {
    const newErrors = {};
    console.log('Validating form data:', formData);
    
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (wordCount > MAX_WORDS) {
      newErrors.content = `Content exceeds the maximum limit of ${MAX_WORDS} words`;
    }
    if (formData.platforms.length === 0) {
      newErrors.platforms = 'Please select at least one platform';
    }
    if (!formData.scheduleDate) {
      newErrors.scheduleDate = 'Schedule date is required';
    }
    if (!formData.scheduleTime) {
      newErrors.scheduleTime = 'Schedule time is required';
    }
    
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
  
      console.log('Form data before submission:', formData);
  
      // Format the date and time properly
      const date = new Date(formData.scheduleDate);
      const time = formData.scheduleTime.split(':');
      date.setHours(parseInt(time[0]), parseInt(time[1]));
  
      const requestData = new FormData();
      requestData.append('name', formData.name);
      requestData.append('content', formData.content);
      requestData.append('platforms', JSON.stringify(formData.platforms));

      // Create schedule object as expected by backend
      requestData.append('schedule', JSON.stringify({
        startDate: date.toISOString(),
        postTime: formData.scheduleTime
      }));
      
      if (formData.image) {
        requestData.append('image', formData.image);
      }
  
      // Log the FormData contents
      for (let [key, value] of requestData.entries()) {
        console.log(`${key}:`, value);
      }
  
      const response = await axios.post('https://emailcampaign-backend.onrender.com/api/campaigns', requestData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });
  
      console.log('Server response:', response.data);
  
      if (response.data.success) {
        navigate('/campaigns');
      } else {
        throw new Error(response.data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      console.error('Error response:', error.response?.data);
      setErrors(prev => ({
        ...prev,
        submit: error.response?.data?.error || error.message || 'Failed to create campaign'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Calculate color for word count indicator
  const getWordCountColor = () => {
    if (wordCount > MAX_WORDS) return 'word-count-error';
    if (wordCount > MAX_WORDS * 0.8) return 'word-count-warning';
    return 'word-count-normal';
  };

  return (
    <div className="create-campaign-container">
      <div className="campaign-header">
        <h1>Create Campaign</h1>
        <p>Schedule your social media campaign</p>
      </div>

      {/* AI Content Generator Modal */}
      {showAiGenerator && (
        <div className="ai-generator-modal">
          <div className="ai-generator-content">
            <div className="ai-generator-header">
              <h3><Wand2 size={16} />
              AI Content Generator</h3>
              <button 
                type="button" 
                className="close-btn"
                onClick={() => {
                  setShowAiGenerator(false);
                  setGeneratedContent('');
                  setAiPrompt('');
                }}
              >
                ×
              </button>
            </div>
            <p>Describe what you want to post about and let AI create content for you</p>
            
            <div className="prompt-suggestions">
              <h4>Prompt suggestions:</h4>
              <div className="suggestions-list">
                {promptSuggestions.map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    className="suggestion-btn"
                    onClick={() => {
                      setAiPrompt(prompt);
                      generateAIContent(prompt);
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="prompt-input">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Write a post about our upcoming summer collection launch..."
                rows={4}
              />
              <button
                type="button"
                className="generate-btn"
                onClick={() => generateAIContent(aiPrompt)}
                disabled={aiLoading || !aiPrompt.trim()}
              >
                {aiLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {errors.ai && <div className="error-message">{errors.ai}</div>}

            {generatedContent && (
              <div className="generated-content">
                <h4>Generated content:</h4>
                <div className="content-preview">
                  {generatedContent}
                </div>
                <button
                  type="button"
                  className="use-content-btn"
                  onClick={useGeneratedContent}
                >
                  Use this content
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="campaign-form">
        <div className="form-section">
          <div className="section-header">
            <h2>Post Details</h2>
            <button
              type="button"
              className="ai-generate-btn"
              onClick={() => setShowAiGenerator(true)}
            >
               <Wand2 size={16} /> Generate with AI
            </button>
          </div>
          <p>Enter the details for your social media post</p>
          
          <div className="form-group">
            <label htmlFor="name">Campaign Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter campaign name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="content">
              Post Content
              <span className={`word-count ${getWordCountColor()}`}>
                {wordCount}/{MAX_WORDS} words
              </span>
            </label>
            <textarea
              id="content"
              name="content"
              placeholder="Enter your post content here..."
              value={formData.content}
              onChange={handleInputChange}
              rows={6}
              className={errors.content ? 'error' : ''}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}
            {wordCount > MAX_WORDS && 
              <span className="error-message">
                Your content exceeds the {MAX_WORDS} word limit. Please shorten your text.
              </span>
            }
          </div>

          <div className="form-group">
            <label>Platforms</label>
            <div className="platform-buttons">
              <button
                type="button"
                className={`platform-btn ${selectedPlatforms.instagram ? 'active' : ''}`}
                onClick={() => handlePlatformSelect('instagram')}
              >
                Instagram
              </button>
              <button
                type="button"
                className={`platform-btn ${selectedPlatforms.facebook ? 'active' : ''}`}
                onClick={() => handlePlatformSelect('facebook')}
              >
                Facebook
              </button>
              <button
                type="button"
                className={`platform-btn ${selectedPlatforms.twitter ? 'active' : ''}`}
                onClick={() => handlePlatformSelect('twitter')}
              >
                Twitter
              </button>
            </div>
            {errors.platforms && <span className="error-message">{errors.platforms}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scheduleDate">Schedule Date</label>
              <input
                type="date"
                id="scheduleDate"
                name="scheduleDate"
                value={formData.scheduleDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={errors.scheduleDate ? 'error' : ''}
              />
              {errors.scheduleDate && <span className="error-message">{errors.scheduleDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="scheduleTime">Schedule Time</label>
              <input
                type="time"
                id="scheduleTime"
                name="scheduleTime"
                value={formData.scheduleTime}
                onChange={handleInputChange}
                className={errors.scheduleTime ? 'error' : ''}
              />
              {errors.scheduleTime && <span className="error-message">{errors.scheduleTime}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Upload Image</label>
            <div className="upload-area">
              {formData.imagePreview ? (
                <div className="image-preview">
                  <img src={formData.imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="upload-box">
                  <p>Drag and drop an image here, or click to browse</p>
                  <div className="upload-options">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="imageUpload"
                    />
                    <button
                      type="button"
                      className="browse-btn"
                      onClick={() => document.getElementById('imageUpload').click()}
                    >
                      Browse Files
                    </button>
                  </div>
                </div>
              )}
            </div>
            {errors.image && <span className="error-message">{errors.image}</span>}
          </div>
        </div>

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/campaigns')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || wordCount > MAX_WORDS}
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
