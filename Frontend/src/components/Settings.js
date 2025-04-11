import React, { useState } from 'react';
import '../styles/Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [accountInfo, setAccountInfo] = useState({
    businessName: 'Retail Store',
    email: 'contact@retailstore.com',
    category: 'Clothing & Apparel',
    timezone: 'Eastern Time (ET)',
    bio: 'Retail Store is a premier destination for fashion and lifestyle products. We offer a curated selection of high-quality clothing, accessories, and home goods.',
    website: 'https://retailstore.com'
  });

  const handleInputChange = (field, value) => {
    setAccountInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    // Here you would implement the API call to save changes
    console.log('Saving changes:', accountInfo);
  };

  return (
    <div className="settings">
      <h1>Settings</h1>
      <p className="subtitle">Manage your account and platform connections</p>

      <div className="settings-container">
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
          <button 
            className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
          <button 
            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Team
          </button>
          <button 
            className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            Billing
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'account' && (
            <div className="account-settings">
              <h2>Account Information</h2>
              <form onSubmit={handleSaveChanges}>
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={accountInfo.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={accountInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Business Category</label>
                  <select
                    value={accountInfo.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    <option value="Clothing & Apparel">Clothing & Apparel</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Beauty & Health">Beauty & Health</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Time Zone</label>
                  <select
                    value={accountInfo.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                  >
                    <option value="Eastern Time (ET)">Eastern Time (ET)</option>
                    <option value="Central Time (CT)">Central Time (CT)</option>
                    <option value="Mountain Time (MT)">Mountain Time (MT)</option>
                    <option value="Pacific Time (PT)">Pacific Time (PT)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={accountInfo.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={accountInfo.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>

                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="connections-settings">
              <h2>Platform Connections</h2>
              <div className="connections-grid">
                <div className="connection-card">
                  <div className="platform-icon instagram">
                    <i className="fab fa-instagram"></i>
                  </div>
                  <div className="platform-info">
                    <h3>Instagram</h3>
                    <p>Connected as @retailstore</p>
                  </div>
                  <button className="disconnect-btn">Disconnect</button>
                </div>

                <div className="connection-card">
                  <div className="platform-icon facebook">
                    <i className="fab fa-facebook"></i>
                  </div>
                  <div className="platform-info">
                    <h3>Facebook</h3>
                    <p>Connected as Retail Store</p>
                  </div>
                  <button className="disconnect-btn">Disconnect</button>
                </div>

                <div className="connection-card">
                  <div className="platform-icon twitter">
                    <i className="fab fa-twitter"></i>
                  </div>
                  <div className="platform-info">
                    <h3>Twitter</h3>
                    <p>Not connected</p>
                  </div>
                  <button className="connect-btn">Connect</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 