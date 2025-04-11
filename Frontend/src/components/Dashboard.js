import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import { BsPostcard } from 'react-icons/bs';
import '../styles/Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    instagramPosts: 0,
    facebookPosts: 0,
    twitterPosts: 0,
    monthlyGrowth: {
      total: 0,
      instagram: 0,
      facebook: 0,
      twitter: 0
    },
    engagementRate: 0,
    campaigns: 0
  });
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [upcomingPosts, setUpcomingPosts] = useState([]);
  const navigate = useNavigate();

  const [chartData, setChartData] = useState({
    labels: ['Instagram', 'Facebook', 'Twitter'],
    datasets: [
      {
        label: 'Number of Posts',
        data: [0, 0, 0],
        backgroundColor: [
          'rgba(225, 48, 108, 0.6)',  // Instagram color
          'rgba(24, 119, 242, 0.6)',  // Facebook color
          'rgba(29, 161, 242, 0.6)',  // Twitter color
        ],
        borderColor: [
          'rgb(225, 48, 108)',
          'rgb(24, 119, 242)',
          'rgb(29, 161, 242)',
        ],
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Posts by Platform',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        // Fetch user data
        const userRes = await axios.get('https://zitharaproject.onrender.com/api/auth/me', config);
        if (!userRes.data) {
          throw new Error('No user data received');
        }
        setUser(userRes.data);

        // Fetch campaigns
        const campaignsRes = await axios.get('https://zitharaproject.onrender.com/api/campaigns', config);
        const campaigns = campaignsRes.data.data || [];

        // Get active campaigns
        const active = campaigns.filter(campaign => 
          campaign.status === 'active' || campaign.status === 'scheduled'
        ).slice(0, 3);
        setActiveCampaigns(active);

        // Calculate campaign counts by platform
        const platformCounts = campaigns.reduce((acc, campaign) => {
          campaign.platforms.forEach(platform => {
            acc[platform.toLowerCase()] = (acc[platform.toLowerCase()] || 0) + 1;
          });
          return acc;
        }, {});

        // Get upcoming scheduled posts
        const upcoming = campaigns
          .filter(campaign => campaign.status === 'scheduled')
          .sort((a, b) => new Date(a.schedule?.startDate) - new Date(b.schedule?.startDate))
          .slice(0, 3)
          .map(campaign => ({
            title: campaign.name,
            platform: campaign.platforms[0],
            date: campaign.schedule?.startDate ? new Date(campaign.schedule.startDate).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }) : 'Not scheduled'
          }));
        
        setUpcomingPosts(upcoming);

        // Calculate total posts and active campaigns
        const totalPosts = campaigns.length;
        const activeCampaignsCount = campaigns.filter(
          campaign => campaign.status === 'active' || campaign.status === 'scheduled'
        ).length;

        // Calculate engagement rate with null check
        const socialConnections = userRes.data.socialConnections || {};
        const engagementRate = ((
          (socialConnections.instagram?.engagement || 0) +
          (socialConnections.facebook?.engagement || 0) +
          (socialConnections.twitter?.engagement || 0)
        ) / 3).toFixed(1);

        // Calculate current stats
        const currentStats = {
          totalPosts,
          instagramPosts: platformCounts.instagram || 0,
          facebookPosts: platformCounts.facebook || 0,
          twitterPosts: platformCounts.twitter || 0,
        };

        // Calculate monthly growth
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const thisMonthCampaigns = campaigns.filter(c => new Date(c.createdAt) > lastMonth);
        const monthlyGrowth = {
          total: thisMonthCampaigns.length,
          instagram: thisMonthCampaigns.filter(c => c.platforms.includes('instagram')).length,
          facebook: thisMonthCampaigns.filter(c => c.platforms.includes('facebook')).length,
          twitter: thisMonthCampaigns.filter(c => c.platforms.includes('twitter')).length
        };

        setStats({
          ...currentStats,
          monthlyGrowth,
          engagementRate: parseFloat(engagementRate),
          campaigns: activeCampaignsCount
        });

        // Update chart data
        setChartData(prev => ({
          ...prev,
          datasets: [{
            ...prev.datasets[0],
            data: [
              currentStats.instagramPosts,
              currentStats.facebookPosts,
              currentStats.twitterPosts
            ]
          }]
        }));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
        navigate('/login');
      }
    };

    fetchData();
  }, [navigate]);

  const StatCard = ({ title, count, icon, color, growth }) => (
    <div className="stat-card" style={{ borderColor: color }}>
      <div className="stat-info">
        <h3>{title}</h3>
        <div className="stat-count">{count}</div>
        {growth !== 0 && (
          <div className={`stat-growth ${growth < 0 ? 'negative' : ''}`}>
            {growth > 0 ? '+' : ''}{growth} from last month
          </div>
        )}
      </div>
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
    </div>
  );

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* <div className="welcome-section">
        <h1>Welcome back to your dashboard</h1>
        <p>Your dashboard is your central hub for managing your social media campaigns and insights.</p>
      </div> */}
      {/* Stats Section */}
      <div className="stats-container">
        <StatCard
          title="Total Posts"
          count={stats.totalPosts}
          icon={<BsPostcard />}
          color="#7c3aed"
          growth={stats.monthlyGrowth.total}
        />
        <StatCard
          title="Instagram Posts"
          count={stats.instagramPosts}
          icon={<FaInstagram />}
          color="#E1306C"
          growth={stats.monthlyGrowth.instagram}
        />
        <StatCard
          title="Facebook Posts"
          count={stats.facebookPosts}
          icon={<FaFacebook />}
          color="#1877f2"
          growth={stats.monthlyGrowth.facebook}
        />
        <StatCard
          title="Twitter Posts"
          count={stats.twitterPosts}
          icon={<FaTwitter />}
          color="#1da1f2"
          growth={stats.monthlyGrowth.twitter}
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Engagement Overview */}
        <div className="engagement-overview">
          <h2>Engagement Overview</h2>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} height={300} />
          </div>
        </div>

        {/* Upcoming Posts */}
        <div className="upcoming-posts">
          <div className="section-header">
            <h2>Upcoming Posts</h2>
            <Link to="/calendar" className="view-calendar">View Calendar</Link>
          </div>
          <div className="posts-list">
            {upcomingPosts.map((post, index) => (
              <div key={index} className="post-item">
                <div className="post-platform">
                  {post.platform === 'instagram' && <span className="social-badge instagram">I</span>}
                  {post.platform === 'facebook' && <span className="social-badge facebook">F</span>}
                  {post.platform === 'twitter' && <span className="social-badge twitter">T</span>}
                </div>
                <div className="post-info">
                  <h4>{post.title}</h4>
                  <p>{post.date}</p>
                </div>
                <button className="post-menu">•••</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="active-campaigns">
        <div className="section-header">
          <h2>Active Campaigns</h2>
          <Link to="/campaigns" className="view-all">View All</Link>
        </div>
        <div className="campaigns-grid">
          {activeCampaigns.map((campaign, index) => (
            <div key={campaign._id || index} className="campaign-card">
              <h3>{campaign.name}</h3>
              <span className={`status-badge ${campaign.status.toLowerCase()}`}>
                {campaign.status}
              </span>
              <div className="campaign-platforms">
                {campaign.platforms.map(platform => (
                  <i key={platform} className={`fab fa-${platform.toLowerCase()}`}></i>
                ))}
              </div>
              {campaign.schedule?.startDate && (
                <p className="campaign-date">
                  {new Date(campaign.schedule.startDate).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              )}

                {/* </p>
              )} */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
