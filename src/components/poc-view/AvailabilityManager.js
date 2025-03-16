import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import '../styles/AvailabilityManager.css';
import BackButtonPOC from './BackButtonPOC';
import authenticatedFetch from '../../authenticated Fetch';

const AvailabilityManager = () => {
  const location = useLocation();
  const pocId = location.state?.pocId;
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState('full');
  const [timings, setTimings] = useState([]);
  const [selectedTimings, setSelectedTimings] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Set the background color when the component is mounted
    document.body.style.backgroundColor = "#f5f7fa";
    
    // Cleanup when the component is unmounted
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);
  
  useEffect(() => {
    // Fetch available dates immediately
    setLoading(true);
    authenticatedFetch('api/pocs/available-dates-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pocId: pocId }),
    })
      .then((response) => response.json())
      .then((data) => {
        setAvailableDates(
          data.map((date) => ({
            Schedule_Date: date.Schedule_Date,
            active_status: date.active_status,
          }))
        );
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching available dates:', error);
        setLoading(false);
      });
  }, [pocId]);

  const handleAvailabilityChange = (e) => {
    setAvailability(e.target.value);
    if (e.target.value === 'partial') {
      setSelectedTimings([]); // Reset selected timings when switching to partial
    }
  };

  const handleDateTileClick = (dateObj) => {
    setSelectedDate(dateObj.Schedule_Date);
    setTimings([]);
    setSelectedTimings([]);
    
    // Show loading indicator in timings section
    if (availability === 'partial') {
      setLoading(true);
      
      // Fetch available timings for the selected date
      authenticatedFetch('api/pocs/available-times-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pocId: pocId, date: dateObj.Schedule_Date }),
      })
        .then((response) => response.json())
        .then((data) => {
          setTimings(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching timings:', error);
          setLoading(false);
        });
    }
  };

  const handleTimingClick = (timing) => {
    setSelectedTimings((prev) => {
      return prev.includes(timing)
        ? prev.filter((t) => t !== timing)
        : [...prev, timing];
    });
  };

  const handleUpdateAvailability = () => {
    if (!selectedDate) {
      setMessage("Please select a date first.");
      return;
    }
    
    if (availability === 'partial' && selectedTimings.length === 0) {
      setMessage("Please select at least one time slot or choose 'Full' availability.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    const endpoint = availability === 'full' ? 'api/pocs/update-full' : 'api/pocs/update-partial';
    const body = {
      pocId: pocId,
      date: selectedDate,
      timings: availability === 'partial' ? selectedTimings : [],
    };

    authenticatedFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((response) => {
        setLoading(false);
        if (response.ok) {
          // Success message with animation
          setMessage("Doctor's availability has been updated successfully!");
          
          // Refresh available dates
          return authenticatedFetch('api/pocs/available-dates-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pocId: pocId }),
          });
        } else {
          throw new Error('Failed to update availability');
        }
      })
      .then((response) => {
        if (response) return response.json();
      })
      .then((data) => {
        if (data) {
          setAvailableDates(
            data.map((date) => ({
              Schedule_Date: date.Schedule_Date,
              active_status: date.active_status,
            }))
          );
        }
      })
      .catch((error) => {
        console.error('Error updating availability:', error);
        setLoading(false);
        setMessage('Error updating availability. Please try again.');
      });
  };

  const handleBackButton = () => {  
    navigate("/doctor-dashboard", { state: { pocId } });  
  };
  
  // Format date for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };
  
  const getStatusLabel = (status) => {
    switch(status) {
      case 'blocked': return 'Blocked';
      case 'partial': return 'Partial';
      default: return 'Available';
    }
  };
  
  return (
    <div className="availability-page">
      <div className="availability-header">
        <BackButtonPOC onClick={handleBackButton} />
        <h1 className="availability-title">Manage Availability</h1>
      </div>
      
      <div className="availability-container">
        {loading && (
          <div className="availability-loading-overlay">
            <div className="availability-loading-spinner"></div>
          </div>
        )}
        
        <div className="availability-content">
          <div className="availability-section">
            <h2 className="availability-section-title">Select Date</h2>
            <p className="availability-section-desc">Choose a date to manage availability</p>
            
            <div className="dates-legend">
              <div className="legend-item">
                <span className="legend-color available"></span>
                <span className="legend-text">Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-color partial"></span>
                <span className="legend-text">Partial</span>
              </div>
              <div className="legend-item">
                <span className="legend-color blocked"></span>
                <span className="legend-text">Blocked</span>
              </div>
            </div>
            
            <div className="dates-container">
              {availableDates.length > 0 ? (
                <div className="dates-grid">
                  {availableDates.map((dateObj) => (
                    <div
                      key={dateObj.Schedule_Date}
                      className={`date-tile ${dateObj.active_status} ${
                        selectedDate === dateObj.Schedule_Date ? 'selected' : ''
                      }`}
                      onClick={() => dateObj.active_status !== 'blocked' && handleDateTileClick(dateObj)}
                    >
                      <div className="date-display">{formatDateDisplay(dateObj.Schedule_Date)}</div>
                      <div className="date-status">{getStatusLabel(dateObj.active_status)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-dates">
                  <p>No available dates found</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="availability-section">
            <h2 className="availability-section-title">
              {selectedDate ? (
                <>Set Availability for <span className="highlight-date">{formatDateDisplay(selectedDate)}</span></>
              ) : (
                'Set Availability'
              )}
            </h2>
            
            <div className="availability-options">
              <div className="option-card">
                <input
                  type="radio"
                  id="full-availability"
                  name="availability-type"
                  value="full"
                  checked={availability === 'full'}
                  onChange={handleAvailabilityChange}
                />
                <label htmlFor="full-availability" className="option-label">
                  <div className="option-icon full-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div className="option-text">
                    <span className="option-title">Full Availability</span>
                    <span className="option-desc">Doctor is available for all time slots on this date</span>
                  </div>
                </label>
              </div>
              
              <div className="option-card">
                <input
                  type="radio"
                  id="partial-availability"
                  name="availability-type"
                  value="partial"
                  checked={availability === 'partial'}
                  onChange={handleAvailabilityChange}
                />
                <label htmlFor="partial-availability" className="option-label">
                  <div className="option-icon partial-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div className="option-text">
                    <span className="option-title">Partial Availability</span>
                    <span className="option-desc">Doctor is available for selected time slots only</span>
                  </div>
                </label>
              </div>
            </div>
            
            {availability === 'partial' && (
              <div className="timings-section">
                <h3 className="timings-title">Select Available Time Slots</h3>
                
                {selectedDate ? (
                  <>
                    {timings.length > 0 ? (
                      <div className="timings-grid">
                        {timings.map((timing) => (
                          <div
                            key={timing.appointment_time}
                            className={`timing-tile ${timing.active_status} ${
                              selectedTimings.includes(timing.appointment_time) ? 'selected' : ''
                            }`}
                            onClick={() =>
                              timing.active_status !== 'blocked' &&
                              handleTimingClick(timing.appointment_time)
                            }
                          >
                            {timing.appointment_time}
                            {timing.active_status === 'blocked' && (
                              <span className="timing-blocked-indicator">Booked</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-timings">
                        <p>No time slots available for this date</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-date-selected">
                    <p>Please select a date first</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleUpdateAvailability}
            className="update-button"
            disabled={loading || !selectedDate}
          >
            {loading ? 'Updating...' : 'Update Availability'}
          </button>
          
          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;