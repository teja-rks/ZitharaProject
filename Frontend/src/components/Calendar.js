import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await axios.get('https://emailcampaign-backend.onrender.com/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const campaigns = response.data.data.map(campaign => {
          // Safely handle campaign date
          let campaignDate;
          
          // If schedule exists and has type
          if (campaign.schedule && typeof campaign.schedule === 'object') {
            if (campaign.schedule.type === 'now') {
              campaignDate = new Date(campaign.publishedAt || campaign.createdAt);
            } else if (campaign.schedule.type === 'later' && campaign.schedule.date) {
              // For scheduled posts, combine date and time
              const date = new Date(campaign.schedule.date);
              if (campaign.schedule.time) {
                const [hours, minutes] = campaign.schedule.time.split(':');
                date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
              }
              campaignDate = date;
            }
          }
          
          // If no valid date was set, use publishedAt or createdAt
          if (!campaignDate) {
            campaignDate = new Date(campaign.publishedAt || campaign.createdAt);
          }

          return {
            id: campaign._id,
            title: campaign.name,
            date: campaignDate,
            platforms: Array.isArray(campaign.platforms) ? campaign.platforms : [],
            status: campaign.status || 'scheduled'
          };
        });
        setEvents(campaigns);
      } else {
        setError('Failed to load campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error.response?.data?.error || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = 42; // 6 weeks * 7 days
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === currentDate.getMonth() && 
                     new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.map(event => (
              <div key={event.id} className={`event ${event.status}`}>
                <div className="event-title">{event.title}</div>
                <div className="event-platforms">
                  {event.platforms.map(platform => (
                    <span key={platform} className={`platform-badge ${platform}`}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Add empty cells for days after the last day of the month
    const remainingDays = totalDays - (startingDay + daysInMonth);
    for (let i = 0; i < remainingDays; i++) {
      days.push(<div key={`empty-end-${i}`} className="calendar-day empty"></div>);
    }

    return days;
  };

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }

  if (error) {
    return <div className="calendar-error">{error}</div>;
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav-button">
          &lt;
        </button>
        <h2>{getMonthName(currentDate)}</h2>
        <button onClick={handleNextMonth} className="calendar-nav-button">
          &gt;
        </button>
      </div>
      <div className="calendar-grid">
        <div className="calendar-weekday">Sun</div>
        <div className="calendar-weekday">Mon</div>
        <div className="calendar-weekday">Tue</div>
        <div className="calendar-weekday">Wed</div>
        <div className="calendar-weekday">Thu</div>
        <div className="calendar-weekday">Fri</div>
        <div className="calendar-weekday">Sat</div>
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar; 
