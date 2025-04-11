import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const metrics = {
    instagram: {
      followers: '5.2K',
      growth: '12%',
      trend: 'positive'
    },
    facebook: {
      followers: '3.8K',
      growth: '5%',
      trend: 'positive'
    },
    twitter: {
      followers: '2.1K',
      growth: '8%',
      trend: 'positive'
    },
    engagement: {
      rate: '4.7%',
      change: '0.5%',
      trend: 'negative'
    }
  };

  const engagementData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      {
        label: 'Instagram',
        data: [400, 380, 450, 520],
        backgroundColor: '#E1306C',
        borderColor: '#E1306C',
      },
      {
        label: 'Facebook',
        data: [220, 210, 280, 320],
        backgroundColor: '#4267B2',
        borderColor: '#4267B2',
      },
      {
        label: 'Twitter',
        data: [180, 190, 220, 250],
        backgroundColor: '#1DA1F2',
        borderColor: '#1DA1F2',
      }
    ]
  };

  const audienceGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      {
        label: 'Instagram',
        data: [4000, 4500, 4800, 5200],
        borderColor: '#E1306C',
        tension: 0.4,
        fill: false
      },
      {
        label: 'Facebook',
        data: [3000, 3200, 3500, 3800],
        borderColor: '#4267B2',
        tension: 0.4,
        fill: false
      },
      {
        label: 'Twitter',
        data: [1800, 1900, 2000, 2100],
        borderColor: '#1DA1F2',
        tension: 0.4,
        fill: false
      }
    ]
  };

  return (
    <div className="analytics">
      <h1>Analytics</h1>
      <p className="subtitle">Track your social media performance and audience metrics</p>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Instagram Followers</h3>
          <div className="metric-value">{metrics.instagram.followers}</div>
          <div className={`metric-change ${metrics.instagram.trend}`}>
            ↑ {metrics.instagram.growth} from last month
          </div>
        </div>
        <div className="metric-card">
          <h3>Facebook Audience</h3>
          <div className="metric-value">{metrics.facebook.followers}</div>
          <div className={`metric-change ${metrics.facebook.trend}`}>
            ↑ {metrics.facebook.growth} from last month
          </div>
        </div>
        <div className="metric-card">
          <h3>Twitter Followers</h3>
          <div className="metric-value">{metrics.twitter.followers}</div>
          <div className={`metric-change ${metrics.twitter.trend}`}>
            ↑ {metrics.twitter.growth} from last month
          </div>
        </div>
        <div className="metric-card">
          <h3>Avg. Engagement</h3>
          <div className="metric-value">{metrics.engagement.rate}</div>
          <div className={`metric-change ${metrics.engagement.trend}`}>
            ↓ {metrics.engagement.change} from last month
          </div>
        </div>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          Engagement
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audience' ? 'active' : ''}`}
          onClick={() => setActiveTab('audience')}
        >
          Audience
        </button>
        <button 
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Engagement Overview</h3>
          <div className="chart-container">
            <Bar 
              data={engagementData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <h3>Audience Growth</h3>
          <div className="chart-container">
            <Line 
              data={audienceGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 