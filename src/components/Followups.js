import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authenticatedFetch from '../authenticatedFetch';
import './styles/Followups.css';

const Followups = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State from location
  const [clientId, setClientId] = useState(null);
  const [clientName, setClientName] = useState(null);
  
  useEffect(() => {
    if (location.state && location.state.clientId) {
      setClientId(location.state.clientId);
      setClientName(location.state.clientName || '');
    } else {
      navigate('/'); // Redirect if no state
    }
  }, [location, navigate]);
  
  useEffect(() => {
    if (!clientId) return;
    
    const fetchFollowups = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await authenticatedFetch('/api/followups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setFollowups(data);
        } else {
          throw new Error('Failed to fetch followups');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load followups. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFollowups();
  }, [clientId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '📅';
      case 'completed':
        return '✅';
      case 'canceled':
        return '❌';
      default:
        return '📋';
    }
  };
  
  if (loading) {
    return (
      <div className="followups-container">
        <div className="followups-header">
          <h1 className="followups-title">Upcoming Followups</h1>
          {clientName && <p className="followups-subtitle">for {clientName}</p>}
        </div>
        <div className="followups-loading">
          <div className="loading-spinner"></div>
          <p>Loading followups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="followups-container">
        <div className="followups-header">
          <h1 className="followups-title">Upcoming Followups</h1>
          {clientName && <p className="followups-subtitle">for {clientName}</p>}
        </div>
        <div className="followups-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="followups-container">
      <div className="followups-header">
        <div className="header-content">
          <h1 className="followups-title">Upcoming Followups</h1>
          {clientName && <p className="followups-subtitle">for {clientName}</p>}
        </div>
        <div className="followups-stats">
          <div className="stat-item">
            <span className="stat-number">{followups.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {followups.filter(f => f.Status.toLowerCase() === 'scheduled').length}
            </span>
            <span className="stat-label">Scheduled</span>
          </div>
        </div>
      </div>
      
      {followups.length === 0 ? (
        <div className="followups-empty">
          <div className="empty-icon">📅</div>
          <h3>No Upcoming Followups</h3>
          <p>There are currently no followups scheduled for this client.</p>
        </div>
      ) : (
        <div className="followups-grid">
          {followups.map((followup) => (
            <div key={followup.FollowupId} className="followup-card">
              <div className="followup-header">
                <div className="followup-date-section">
                  <span className="followup-date">
                    {formatDate(followup.Followup_Date)}
                  </span>
                </div>
                <div className="followup-status-section">
                  <span className={`followup-status ${followup.Status.toLowerCase()}`}>
                    <span className="status-icon">{getStatusIcon(followup.Status)}</span>
                    {followup.Status}
                  </span>
                </div>
              </div>
              
              <div className="followup-content">
                <div className="followup-patient">
                  <div className="info-row">
                    <span className="info-icon">👤</span>
                    <div className="info-content">
                      <span className="info-label">Patient</span>
                      <span className="info-value">{followup.PatientName}</span>
                    </div>
                  </div>
                </div>
                
                <div className="followup-original">
                  <div className="info-row">
                    <span className="info-icon">🗓️</span>
                    <div className="info-content">
                      <span className="info-label">Original Appointment</span>
                      <span className="info-value">
                        {followup.OriginalDate} at {followup.OriginalTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="followup-actions">
                <button className="action-btn primary">View Details</button>
                <button className="action-btn secondary">Reschedule</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Followups;