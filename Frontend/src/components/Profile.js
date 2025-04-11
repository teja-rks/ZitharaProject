import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import '../styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    location: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [socialAccounts, setSocialAccounts] = useState({
    instagram: {
      connected: false,
      username: '',
      accessToken: ''
    },
    facebook: {
      connected: false,
      username: '',
      accessToken: ''
    },
    twitter: {
      connected: false,
      username: '',
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      accessTokenSecret: ''
    }
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const userData = response.data || {};
      
      setFormData(prev => ({
        ...prev,
        name: userData.name || '',
        email: userData.email || '',
        company: userData.company || '',
        phone: userData.phone || '',
        location: userData.location || '',
        bio: userData.bio || ''
      }));

      setSocialAccounts(prev => ({
        ...prev,
        instagram: {
          connected: userData.socialConnections?.instagram?.connected || false,
          username: userData.socialConnections?.instagram?.username || '',
          accessToken: userData.socialConnections?.instagram?.accessToken || ''
        },
        facebook: {
          connected: userData.socialConnections?.facebook?.connected || false,
          username: userData.socialConnections?.facebook?.username || '',
          accessToken: userData.socialConnections?.facebook?.accessToken || ''
        },
        twitter: {
          connected: userData.socialConnections?.twitter?.connected || false,
          username: userData.socialConnections?.twitter?.username || '',
          apiKey: userData.socialConnections?.twitter?.apiKey || '',
          apiSecret: userData.socialConnections?.twitter?.apiSecret || '',
          accessToken: userData.socialConnections?.twitter?.accessToken || '',
          accessTokenSecret: userData.socialConnections?.twitter?.accessTokenSecret || ''
        }
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/auth/update-profile',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/auth/change-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage({ type: 'success', text: 'Password updated successfully' });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialConnect = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setMessage({ type: '', text: '' });

      if (platform === 'twitter') {
        // Validate Twitter credentials
        const { username, apiKey, apiSecret, accessToken, accessTokenSecret } = socialAccounts.twitter;
        
        if (!username || !apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
          setMessage({ 
            type: 'error', 
            text: 'Please fill in all Twitter credentials' 
          });
          setLoading(false);
          return;
        }

        try {
          const response = await axios.post(
            'http://localhost:5000/api/auth/twitter/connect',
            {
              username,
              apiKey,
              apiSecret,
              accessToken,
              accessTokenSecret
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            setSocialAccounts(prev => ({
              ...prev,
              twitter: {
                ...prev.twitter,
                connected: true,
                username,
                apiKey,
                apiSecret,
                accessToken,
                accessTokenSecret
              }
            }));
            setMessage({ type: 'success', text: 'Twitter account connected successfully' });
            // Force refresh connected platforms
            await fetchUserData();
            // Trigger a refresh of the connected platforms in the parent component
            window.dispatchEvent(new Event('socialConnectionsUpdated'));
          }
        } catch (error) {
          console.error('Twitter connection error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            details: error.response?.data?.message || 'Unknown error'
          });
          setMessage({ 
            type: 'error', 
            text: error.response?.data?.message || 'Failed to connect Twitter account. Please check your credentials.' 
          });
        }
      } else if (platform === 'instagram') {
        if (!socialAccounts.instagram.username) {
          setMessage({ type: 'error', text: 'Please enter your Instagram username' });
          return;
        }

        const saveResponse = await axios.post(
          'http://localhost:5000/api/auth/instagram/save-username',
          { username: socialAccounts.instagram.username },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (saveResponse.data.success) {
          const oauthResponse = await axios.get('http://localhost:5000/api/auth/instagram/connect', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (oauthResponse.data.url) {
            localStorage.setItem('instagram_oauth_state', oauthResponse.data.state);
            window.location.href = oauthResponse.data.url;
          }
        }
      } else if (platform === 'facebook') {
        if (!socialAccounts.facebook.username) {
          setMessage({ type: 'error', text: 'Please enter your Facebook username' });
          return;
        }

        const saveResponse = await axios.post(
          'http://localhost:5000/api/auth/facebook/save-username',
          { username: socialAccounts.facebook.username },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (saveResponse.data.success) {
          const oauthResponse = await axios.get('http://localhost:5000/api/auth/facebook/connect', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (oauthResponse.data.url) {
            localStorage.setItem('facebook_oauth_state', oauthResponse.data.state);
            window.location.href = oauthResponse.data.url;
          }
        }
      }
    } catch (error) {
      console.error('Social connection error:', {
        platform,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || `Failed to connect ${platform} account` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialDisconnect = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(`http://localhost:5000/api/auth/${platform}/disconnect`, {}, {
        headers: {
          'x-auth-token': token
        }
      });

      setSocialAccounts(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          connected: false,
          username: '',
          accessToken: ''
        }
      }));
      setMessage({ type: 'success', text: `${platform} disconnected successfully!` });
    } catch (error) {
      console.error('Error disconnecting social account:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to disconnect social account' });
    }
  };

  const handleSocialInputChange = (platform, field, value) => {
    setSocialAccounts(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const handleUsernameChange = (platform, username) => {
    setSocialAccounts(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        username
      }
    }));
  };

  const handleDisconnect = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(`http://localhost:5000/api/auth/${platform}/disconnect`, {}, {
        headers: {
          'x-auth-token': token
        }
      });

      setSocialAccounts(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          connected: false,
          username: ''
        }
      }));
      setMessage({ type: 'success', text: `${platform} disconnected successfully!` });
    } catch (error) {
      console.error('Error disconnecting social account:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to disconnect social account' });
    }
  };

  const handleFacebookConnect = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      if (!socialAccounts.facebook.username) {
        setMessage({ type: 'error', text: 'Please enter your Facebook username' });
        return;
      }

      // First save the username
      const saveResponse = await axios.post(
        'http://localhost:5000/api/auth/facebook/save-username',
        { username: socialAccounts.facebook.username },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (saveResponse.data.success) {
        // Then get the OAuth URL
        const oauthResponse = await axios.get(
          'http://localhost:5000/api/auth/facebook/connect',
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (oauthResponse.data.url) {
          // Store state in localStorage for verification
          localStorage.setItem('facebook_oauth_state', oauthResponse.data.state);
          
          // Open Facebook OAuth window
          const width = 600;
          const height = 600;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          
          window.open(
            oauthResponse.data.url,
            'Facebook OAuth',
            `width=${width},height=${height},left=${left},top=${top}`
          );
        }
      }
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error connecting Facebook account' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const facebookStatus = urlParams.get('facebook');
    const errorMessage = urlParams.get('message');
    
    if (facebookStatus === 'error' && errorMessage) {
      setMessage({ type: 'error', text: decodeURIComponent(errorMessage) });
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (facebookStatus === 'connected') {
      setMessage({ type: 'success', text: 'Facebook account connected successfully!' });
      setSocialAccounts(prev => ({
        ...prev,
        facebook: {
          ...prev.facebook,
          connected: true
        }
      }));
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-content">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Info
          </button>
          <button 
            className={`tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Social Media
          </button>
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {activeTab === 'personal' && (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Enter your company name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter your location"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                rows="4"
              />
            </div>

            {message.text && activeTab === 'personal' && (
              <div className={`alert ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button" 
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'social' && (
          <div className="social-connections">
            {/* Twitter Connection */}
            <div className="social-connection-item">
              <div className="platform-header">
                <div className="platform-icon twitter">
                  <FaTwitter />
                </div>
                <h3>Twitter</h3>
              </div>
              <div className="connection-details">
                {!socialAccounts.twitter.connected ? (
                  <>
                    <div className="input-group">
                      <label>Twitter Username</label>
                      <input
                        type="text"
                        value={socialAccounts.twitter.username}
                        onChange={(e) => handleSocialInputChange('twitter', 'username', e.target.value)}
                        placeholder="Enter your Twitter username"
                      />
                    </div>
                    <div className="input-group">
                      <label>API Key</label>
                      <input
                        type="text"
                        value={socialAccounts.twitter.apiKey}
                        onChange={(e) => handleSocialInputChange('twitter', 'apiKey', e.target.value)}
                        placeholder="Enter your Twitter API Key"
                      />
                    </div>
                    <div className="input-group">
                      <label>API Secret</label>
                      <input
                        type="text"
                        value={socialAccounts.twitter.apiSecret}
                        onChange={(e) => handleSocialInputChange('twitter', 'apiSecret', e.target.value)}
                        placeholder="Enter your Twitter API Secret"
                      />
                    </div>
                    <div className="input-group">
                      <label>Access Token</label>
                      <input
                        type="text"
                        value={socialAccounts.twitter.accessToken}
                        onChange={(e) => handleSocialInputChange('twitter', 'accessToken', e.target.value)}
                        placeholder="Enter your Twitter Access Token"
                      />
                    </div>
                    <div className="input-group">
                      <label>Access Token Secret</label>
                      <input
                        type="text"
                        value={socialAccounts.twitter.accessTokenSecret}
                        onChange={(e) => handleSocialInputChange('twitter', 'accessTokenSecret', e.target.value)}
                        placeholder="Enter your Twitter Access Token Secret"
                      />
                    </div>
                    <button 
                      className="connect-btn"
                      onClick={() => handleSocialConnect('twitter')}
                      disabled={loading}
                    >
                      Connect Twitter
                    </button>
                  </>
                ) : (
                  <div className="connected-status">
                    <p>Connected as @{socialAccounts.twitter.username}</p>
                    <button 
                      className="disconnect-btn"
                      onClick={() => handleSocialDisconnect('twitter')}
                      disabled={loading}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Instagram */}
            <div className="social-account-card">
              <div className="platform-icon instagram">
                <FaInstagram />
              </div>
              <div className="platform-details">
                <h3>Instagram</h3>
                {!socialAccounts.instagram.connected ? (
                  <div className="connect-form">
                    <input
                      type="text"
                      placeholder="Enter Instagram username"
                      value={socialAccounts.instagram.username}
                      onChange={(e) => handleUsernameChange('instagram', e.target.value)}
                    />
                    <button
                      onClick={() => handleSocialConnect('instagram')}
                      disabled={loading || !socialAccounts.instagram.username}
                    >
                      Connect
                    </button>
                  </div>
                ) : (
                  <div className="connected-status">
                    <span className="connected-badge">
                      Connected as @{socialAccounts.instagram.username}
                    </span>
                    <button 
                      onClick={() => handleDisconnect('instagram')} 
                      className="disconnect-btn"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Facebook */}
            <div className="social-account-card">
              <div className="platform-icon facebook">
                <FaFacebook />
              </div>
              <div className="platform-details">
                <h3>Facebook</h3>
                {!socialAccounts.facebook.connected ? (
                  <div className="connect-form">
                    <input
                      type="text"
                      placeholder="Enter Facebook username"
                      value={socialAccounts.facebook.username}
                      onChange={(e) => handleUsernameChange('facebook', e.target.value)}
                    />
                    <button
                      onClick={() => handleFacebookConnect()}
                      disabled={loading || !socialAccounts.facebook.username}
                    >
                      Connect
                    </button>
                  </div>
                ) : (
                  <div className="connected-status">
                    <span className="connected-badge">
                      Connected as @{socialAccounts.facebook.username}
                    </span>
                    <button 
                      onClick={() => handleDisconnect('facebook')} 
                      className="disconnect-btn"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-section">
            <h2>Security Settings</h2>
            
            {/* Password Change Form */}
            <div className="password-section">
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your new password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your new password"
                  />
                </div>

                {message.text && activeTab === 'security' && (
                  <div className={`alert ${message.type}`}>
                    {message.text}
                  </div>
                )}

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="save-button" 
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Logout Button */}
            <div className="logout-section">
              <button 
                className="logout-button"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 