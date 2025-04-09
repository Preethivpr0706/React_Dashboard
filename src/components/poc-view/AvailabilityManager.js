import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, ChevronDown, X } from 'lucide-react';
import authenticatedFetch from '../../authenticatedFetch';
import '../styles/AvailabilityManager.css';

const AvailabilityManager = () => {
  // State from location/session
  const [pocId, setPocId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [pocName, setPocName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Availability state
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState('full');
  const [timings, setTimings] = useState([]);
  const [selectedTimings, setSelectedTimings] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});
  
  // UI state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState('update');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    document.body.style.backgroundColor = "#f5f7fa";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Load state from location or sessionStorage
  useEffect(() => {
    const loadState = () => {
      if (location.state && location.state.pocId) {
        setPocId(location.state.pocId);
        sessionStorage.setItem('pocId', JSON.stringify(location.state.pocId));
        
        if (location.state.clientId) {
          setClientId(location.state.clientId);
          sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
        }
        
        if (location.state.pocName) {
          setPocName(location.state.pocName);
          sessionStorage.setItem('pocName', JSON.stringify(location.state.pocName));
        }
        
        setIsLoading(false);
        return;
      }
      
      try {
        const storedPocId = sessionStorage.getItem('pocId');
        const storedClientId = sessionStorage.getItem('clientId');
        const storedPocName = sessionStorage.getItem('pocName');
        
        if (storedPocId) {
          setPocId(JSON.parse(storedPocId));
          if (storedClientId) setClientId(JSON.parse(storedClientId));
          if (storedPocName) setPocName(JSON.parse(storedPocName));
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to retrieve state:", error);
      }
      
      navigate('/', { replace: true });
    };
    
    loadState();
  }, [location, navigate]);

  // Fetch data when pocId is available
  useEffect(() => {
    if (!pocId || isLoading) return;
    
    fetchAvailableDates();
    fetchBlockedSlots();
  }, [pocId, isLoading]);

  const fetchAvailableDates = () => {
    setLoading(true);
    authenticatedFetch('/api/pocs/available-dates-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pocId: pocId }),
    })
      .then((response) => response.json())
      .then((data) => {
        setAvailableDates(data.map(date => ({
          Schedule_Date: date.Schedule_Date,
          active_status: date.active_status
        })));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching dates:', error);
        setLoading(false);
        setMessage('Error fetching available dates');
        setMessageType('error');
      });
  };

  const fetchBlockedSlots = () => {
    authenticatedFetch('/api/pocs/blocked-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pocId: pocId }),
    })
      .then((response) => response.json())
      .then((data) => {
        const groupedByDate = data.reduce((acc, slot) => {
          const date = slot.schedule_date;
          if (!acc[date]) {
            acc[date] = {
              total: 0,
              blocked: 0,
              blockedSlots: []
            };
          }
          acc[date].total += 1;
          if (slot.Active_Status === 'blocked') {
            acc[date].blocked += 1;
            acc[date].blockedSlots.push(slot);
          }
          return acc;
        }, {});

        const groupedArray = Object.entries(groupedByDate)
          .filter(([_, { blocked }]) => blocked > 0)
          .map(([date, { total, blocked, blockedSlots }]) => {
            const type = blocked === total ? 'full' : 'partial';
            return {
              date,
              slots: blockedSlots.sort((a, b) => a.start_time.localeCompare(b.start_time)),
              type
            };
          });

        setBlockedSlots(groupedArray);
      })
      .catch((error) => {
        console.error('Error fetching blocked slots:', error);
      });
  };

  const handleAvailabilityChange = (e) => {
    const newAvailability = e.target.value;
    setAvailability(newAvailability);
    
    if (newAvailability === 'partial' && selectedDate) {
      fetchTimingsForDate(selectedDate);
    } else {
      setTimings([]);
      setSelectedTimings([]);
    }
  };

  const fetchTimingsForDate = (date) => {
    setLoading(true);
    authenticatedFetch('/api/pocs/available-times-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pocId: pocId, date: date }),
    })
      .then((response) => response.json())
      .then((data) => {
        setTimings(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching timings:', error);
        setLoading(false);
        setMessage('Error fetching time slots');
        setMessageType('error');
      });
  };

  const handleDateTileClick = (dateObj) => {
    if (dateObj.active_status === 'blocked') {
      if (window.confirm("Do you want to unblock this date?")) {
        unblockSlot(dateObj.Schedule_Date);
      }
      return;
    }
    
    setSelectedDate(dateObj.Schedule_Date);
    setMessage('');
    
    if (availability === 'partial') {
      fetchTimingsForDate(dateObj.Schedule_Date);
    }
  };

  const handleTimingClick = (timing) => {
    if (timing.active_status === 'blocked') {
      if (window.confirm("Do you want to unblock this time slot?")) {
        unblockTimingSlot(timing.appointment_time);
      }
      return;
    }
    
    setSelectedTimings((prev) => {
      return prev.includes(timing.appointment_time)
        ? prev.filter((t) => t !== timing.appointment_time)
        : [...prev, timing.appointment_time];
    });
  };

  const unblockSlot = (date) => {
    setLoading(true);
    authenticatedFetch('/api/pocs/unblock-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pocId: pocId, date }),
    })
      .then(() => {
        setMessage("Slot unblocked successfully");
        setMessageType('success');
        fetchAvailableDates();
        fetchBlockedSlots();
      })
      .catch((error) => {
        console.error('Error unblocking slot:', error);
        setMessage('Error unblocking slot');
        setMessageType('error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const unblockTimingSlot = (time) => {
    setLoading(true);
    authenticatedFetch('/api/pocs/unblock-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pocId: pocId, date: selectedDate, time }),
    })
      .then(() => {
        setMessage("Time slot unblocked successfully");
        setMessageType('success');
        fetchTimingsForDate(selectedDate);
        fetchBlockedSlots();
      })
      .catch((error) => {
        console.error('Error unblocking time slot:', error);
        setMessage('Error unblocking time slot');
        setMessageType('error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleUnblockSlot = (slotId) => {
    if (window.confirm("Do you want to unblock this slot?")) {
      setLoading(true);
      authenticatedFetch('/api/pocs/unblock-slot-by-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      })
        .then(() => {
          setMessage("Slot unblocked successfully");
          setMessageType('success');
          fetchAvailableDates();
          fetchBlockedSlots();
        })
        .catch((error) => {
          console.error('Error unblocking slot:', error);
          setMessage('Error unblocking slot');
          setMessageType('error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleUpdateAvailability = () => {
    if (!selectedDate) {
      setMessage("Please select a date first.");
      setMessageType('error');
      return;
    }
    
    if (availability === 'partial' && selectedTimings.length === 0) {
      setMessage("Please select at least one time slot or choose 'Full' availability.");
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    const endpoint = availability === 'full' ? '/api/pocs/update-full' : '/api/pocs/update-partial';
    const body = {
      pocId: pocId,
      date: selectedDate,
      timings: availability === 'partial' ? selectedTimings : [],
      reason
    };

    authenticatedFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (response.ok) {
          setMessage("Availability updated successfully!");
          setMessageType('success');
          setReason('');
          fetchAvailableDates();
          fetchBlockedSlots();
          
          if (availability === 'partial') {
            fetchTimingsForDate(selectedDate);
          }
        } else {
          throw new Error('Failed to update availability');
        }
      })
      .catch((error) => {
        console.error('Error updating availability:', error);
        setMessage('Error updating availability');
        setMessageType('error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

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

  const toggleDateExpansion = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="availability-page">
      <div className="availability-header">
        <h1 className="availability-title">Manage Availability</h1>
        {pocName && <p className="availability-subtitle">for {pocName}</p>}
      </div>
      
      <div className="availability-container">
        {loading && (
          <div className="availability-loading-overlay">
            <div className="availability-loading-spinner"></div>
          </div>
        )}
        
        <div className="availability-content">
          <div className="tabs-container">
            <div className="tabs-header">
              <button
                className={`tab-button ${activeTab === 'update' ? 'active' : ''}`}
                onClick={() => setActiveTab('update')}
              >
                Update Availability
              </button>
              <button
                className={`tab-button ${activeTab === 'blocked' ? 'active' : ''}`}
                onClick={() => setActiveTab('blocked')}
              >
                Blocked Slots
              </button>
            </div>
            
            <div className="tabs-content">
              {activeTab === 'update' ? (
                <>
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
                              onClick={() => handleDateTileClick(dateObj)}
                            >
                              <div className="date-display">{formatDateDisplay(dateObj.Schedule_Date)}</div>
                              <div className="date-status">{getStatusLabel(dateObj.active_status)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-dates">
                          <AlertTriangle size={20} className="mr-2" />
                          <p>No available dates found</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedDate && (
                    <div className="availability-section">
                      <h2 className="availability-section-title">
                        Set Availability for <span className="highlight-date">{formatDateDisplay(selectedDate)}</span>
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
                              <CheckCircle size={20} />
                            </div>
                            <div className="option-text">
                              <span className="option-title">Full Availability</span>
                              <span className="option-desc">Available for all time slots on this date</span>
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
                              <Clock size={20} />
                            </div>
                            <div className="option-text">
                              <span className="option-title">Partial Availability</span>
                              <span className="option-desc">Available for selected time slots only</span>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Reason for blocking (if applicable)</label>
                        <textarea
                          className="form-textarea"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Enter reason for blocking..."
                          rows={3}
                        />
                      </div>
                      
                      {availability === 'partial' && (
                        <div className="timings-section">
                          <h3 className="timings-title">Select Available Time Slots</h3>
                          
                          {timings.length > 0 ? (
                            <div className="timings-grid">
                              {timings.map((timing) => (
                                <div
                                  key={timing.appointment_time}
                                  className={`timing-tile ${timing.active_status} ${
                                    selectedTimings.includes(timing.appointment_time) ? 'selected' : ''
                                  }`}
                                  onClick={() => handleTimingClick(timing)}
                                >
                                  {timing.appointment_time}
                                  {timing.active_status === 'blocked' && (
                                    <span className="timing-blocked-indicator">Blocked</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-timings">
                              <Clock size={20} className="mr-2" />
                              <p>No time slots available for this date</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={handleUpdateAvailability}
                        className="update-button"
                        disabled={loading || (availability === 'partial' && selectedTimings.length === 0)}
                      >
                        {loading ? 'Updating...' : 'Update Availability'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="blocked-slots-section">
                  <h2 className="availability-section-title">Blocked Slots</h2>
                  <p className="availability-section-desc">
                    Currently blocked time slots
                  </p>
                  
                  <div className="dates-legend">
                    <div className="legend-item">
                      <span className="legend-color blocked"></span>
                      <span className="legend-text">Fully Blocked</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color partial"></span>
                      <span className="legend-text">Partially Blocked</span>
                    </div>
                  </div>

                  {blockedSlots.length > 0 ? (
                    <div className="blocked-dates-container">
                      {blockedSlots.map(({ date, slots, type }) => (
                        <div key={date} className="blocked-date-group">
                          <div 
                            className="blocked-date-header"
                            onClick={() => toggleDateExpansion(date)}
                          >
                            <div className="blocked-date-info">
                              <Calendar size={16} />
                              <span className="blocked-date-title">
                                {formatDateDisplay(date)}
                              </span>
                              <span className={`blocked-date-type ${type}`}>
                                {type === 'full' ? 'Fully Blocked' : 'Partially Blocked'}
                              </span>
                            </div>
                            <ChevronDown 
                              className={`expand-icon ${expandedDates[date] ? 'expanded' : ''}`} 
                              size={20} 
                            />
                          </div>
                          
                          <div 
                            className="blocked-slots-list"
                            style={{
                              maxHeight: expandedDates[date] ? `${slots.length * 60}px` : '0',
                              opacity: expandedDates[date] ? 1 : 0
                            }}
                          >
                            {slots.map(slot => (
                              <div key={slot.slot_id} className="blocked-slot-item">
                                <div className="slot-time">
                                  {slot.start_time || 'All Day'}
                                </div>
                                <div className="slot-reason">
                                  {slot.reason || 'No reason provided'}
                                </div>
                                <button 
                                  className="unblock-button"
                                  onClick={() => handleUnblockSlot(slot.slot_id)}
                                >
                                  <X size={16} /> Unblock
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-blocked-slots">
                      <CheckCircle size={20} className="mr-2" />
                      <p>No blocked slots found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {message && (
            <div className={`message ${messageType}`}>
              {messageType === 'success' ? (
                <CheckCircle size={16} className="mr-2" />
              ) : (
                <AlertTriangle size={16} className="mr-2" />
              )}
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;