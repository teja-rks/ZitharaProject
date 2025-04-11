import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Campaigns.css';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);


  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
  
      const response = await axios.get('https://emailcampaign-backend.onrender.com/api/campaigns', {
        headers: {
          'x-auth-token': token
        }
      });
  
      // Parse the schedule field for each campaign
      const processedCampaigns = response.data.data.map(campaign => {
        if (campaign.schedule && typeof campaign.schedule === 'string') {
          return {
            ...campaign,
            schedule: JSON.parse(campaign.schedule)
          };
        }
        return campaign;
      });
  
      setCampaigns(processedCampaigns);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to fetch campaigns');
      setLoading(false);
    }
  };
  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleEdit = (campaign) => {
    // Store campaign data in localStorage for edit form
    localStorage.setItem('editCampaign', JSON.stringify(campaign));
    navigate(`/edit-campaign/${campaign._id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://emailcampaign-backend.onrender.com/api/campaigns/${id}`, {
        headers: {
          'x-auth-token': token
        }
      });

      // Remove the deleted campaign from state
      setCampaigns(campaigns.filter(campaign => campaign._id !== id));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign. Please try again.');
    }
  };

  const getPlatformIcons = (platforms) => {
    return platforms.map(platform => {
      switch (platform) {
        case 'facebook':
          return <i key={platform} className="fab fa-facebook" title="Facebook"></i>;
        case 'instagram':
          return <i key={platform} className="fab fa-instagram" title="Instagram"></i>;
        case 'twitter':
          return <i key={platform} className="fab fa-twitter" title="Twitter"></i>;
        default:
          return null;
      }
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
      case 'published':
        return 'status-badge status-active';
      case 'draft':
        return 'status-badge status-draft';
      case 'scheduled':
        return 'status-badge status-scheduled';
      case 'completed':
        return 'status-badge status-completed';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (campaign) => {
    // First check for scheduledTime field from backend
    if (campaign.scheduledTime) {
      const date = new Date(campaign.scheduledTime);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
    
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Fall back to checking the schedule object (used during edit or from localStorage)
    if (campaign.schedule && campaign.schedule.startDate) {
      const date = new Date(campaign.schedule.startDate);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
    
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  
    return 'Not scheduled';
  };
  if (loading) return <div className="loading">Loading campaigns...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h1>Campaigns</h1>
        <button className="create-campaign-btn" onClick={handleCreateCampaign}>
          <i className="fas fa-plus"></i> Create Campaign
        </button>
      </div>

      <div className="campaigns-grid">
        {campaigns.map(campaign => (
          <div key={campaign._id} className="campaign-card">
            <div className="campaign-header">
              <h2>{campaign.name}</h2>
              <span className={getStatusBadgeClass(campaign.status)}>
                {campaign.status}
              </span>
            </div>

            <div className="platform-icons">
              {getPlatformIcons(campaign.platforms)}
            </div>

            <div className="campaign-dates">
              <div className="date-item">
                <i className="far fa-calendar-alt"></i>
                <span>Scheduled: {formatDate(campaign)}</span>
              </div>
            </div>

            <div className="campaign-actions">
              <button
                className="edit-btn"
                onClick={() => handleEdit(campaign)}
              >
                <i className="fas fa-edit"></i> Edit
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(campaign._id)}
              >
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Campaigns; 
