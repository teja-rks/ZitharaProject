import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNewPostClick = () => {
    navigate('/campaigns/create');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-header">
        <h1>Social Sync</h1>
        <p className="subtitle">Retail Social Media Manager</p>
      </div>
      <br></br>
      <button className="new-post-btn" onClick={handleNewPostClick}>
        <i className="fas fa-plus"></i>
        <span>New Post</span>
      </button>

      <nav className="sidebar-nav">
        <Link 
          to="/dashboard" 
          className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          <i className="fas fa-home"></i>
          <span>Dashboard</span>
        </Link>
        <Link 
          to="/calendar" 
          className={`nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}
        >
          <i className="fas fa-calendar"></i>
          <span>Calendar</span>
        </Link>
        <Link 
          to="/campaigns" 
          className={`nav-item ${location.pathname === '/campaigns' ? 'active' : ''}`}
        >
          <i className="fas fa-bullhorn"></i>
          <span>Campaigns</span>
        </Link>
        <Link 
          to="/analytics" 
          className={`nav-item ${location.pathname === '/analytics' ? 'active' : ''}`}
        >
          <i className="fas fa-chart-line"></i>
          <span>Analytics</span>
        </Link>
        <Link 
          to="/content" 
          className={`nav-item ${location.pathname === '/content' ? 'active' : ''}`}
        >
          <i className="fas fa-file-alt"></i>
          <span>Content</span>
        </Link>
        {/* <Link 
          to="/settings" 
          className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </Link> */}
      </nav>

      <div className="sidebar-footer">
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
      </div>
    </div>
  );
};

export default Sidebar; 