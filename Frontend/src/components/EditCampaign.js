import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/CreateCampaign.css';

const EditCampaign = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
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

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/campaigns/${id}`, {
          headers: {
            'x-auth-token': token
          }
        });

        if (!response.data || !response.data.campaign) {
          throw new Error('Campaign not found');
        }

        const campaign = response.data.campaign;
        
        // Parse the date and time
        const startDate = new Date(campaign.startDate);
        const formattedDate = startDate.toISOString().split('T')[0];
        const formattedTime = startDate.toTimeString().slice(0, 5);

        setFormData({
          title: campaign.name || '',
          content: campaign.description || '',
          platforms: campaign.platforms || [],
          scheduleDate: formattedDate,
          scheduleTime: formattedTime,
          image: null,
          imagePreview: campaign.content?.image || null
        });

        // Set selected platforms
        const platforms = {
          instagram: campaign.platforms?.includes('instagram') || false,
          facebook: campaign.platforms?.includes('facebook') || false,
          twitter: campaign.platforms?.includes('twitter') || false
        };
        
        setSelectedPlatforms(platforms);
        setLoading(false);
      } catch (error) {
        console.error('Error loading campaign:', error);
        setErrors({ submit: 'Failed to load campaign: ' + (error.response?.data?.message || error.message) });
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id, navigate]);

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
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

      const validPlatforms = formData.platforms.filter(p => ['instagram', 'facebook', 'twitter'].includes(p));
      
      if (validPlatforms.length === 0) {
        setErrors(prev => ({
          ...prev,
          platforms: 'Please select at least one valid platform (Instagram, Facebook, or Twitter)'
        }));
        setLoading(false);
        return;
      }

      const startDate = new Date(formData.scheduleDate + 'T' + formData.scheduleTime);

      const requestData = {
        name: formData.title,
        description: formData.content,
        platforms: validPlatforms,
        startDate: startDate.toISOString(),
        content: {
          text: formData.content,
          image: null,
          video: null
        },
        status: 'scheduled'
      };

      if (formData.image) {
        const formDataToSend = new FormData();
        Object.keys(requestData).forEach(key => {
          if (key === 'platforms' || key === 'content') {
            formDataToSend.append(key, JSON.stringify(requestData[key]));
          } else {
            formDataToSend.append(key, requestData[key]);
          }
        });
        formDataToSend.append('image', formData.image);

        await axios.put(`http://localhost:5000/api/campaigns/${id}`, formDataToSend, {
          headers: {
            'x-auth-token': token
          }
        });
      } else {
        await axios.put(`http://localhost:5000/api/campaigns/${id}`, requestData, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
      }

      // Clear the stored campaign data
      localStorage.removeItem('editCampaign');
      navigate('/campaigns');
    } catch (error) {
      console.error('Error updating campaign:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.response?.data?.error || error.message || 'Failed to update campaign. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading campaign...</div>;

  return (
    <div className="create-campaign-container">
      <div className="campaign-header">
        <h1>Edit Campaign</h1>
        <p>Update your social media campaign</p>
      </div>

      <form onSubmit={handleSubmit} className="campaign-form">
        <div className="form-section">
          <h2>Post Details</h2>
          <p>Update the details for your social media post</p>
          
          <div className="form-group">
            <label htmlFor="title">Post Title</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Enter post title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="content">Post Content</label>
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
            <label>Upload Image (Optional)</label>
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
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCampaign; 