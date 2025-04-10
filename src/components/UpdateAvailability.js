import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, User, Grid, CheckCircle, XCircle, AlertTriangle, List, X, ChevronDown } from 'lucide-react';
import createAuthenticatedAxios from '../createAuthenticatedAxios';
import './styles/UpdateAvailability.css';

const useProtectedState = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = sessionStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from sessionStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (value !== null && value !== undefined) {
        sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error saving ${key} to sessionStorage:`, error);
    }
  }, [key, value]);

  return [value, setValue];
};

const UpdateAvailability = () => {
  const [pocId, setPocId] = useProtectedState('pocId', null);
  const [clientId, setClientId] = useProtectedState('clientId', null);
  const [pocName, setPocName] = useProtectedState('pocName', null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState('full');
  const [timings, setTimings] = useState([]);
  const [selectedTimings, setSelectedTimings] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState('update');
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [expandedBlockedDates, setExpandedBlockedDates] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  
  // Modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    actionLabel: '',
    isDestructive: false,
    onConfirm: () => {}
  });

  const navigate = useNavigate();
  const location = useLocation();
  const axiosInstance = createAuthenticatedAxios();

  // Modal handlers
  const handleConfirm = () => {
    if (modalContent.onConfirm) {
      modalContent.onConfirm();
    }
    setShowConfirmationModal(false);
  };

  const handleCancel = () => {
    setShowConfirmationModal(false);
  };

  // Function to show confirmation modal
  const showConfirmModal = ({ title, message, actionLabel, isDestructive = false, onConfirm }) => {
    setModalContent({
      title,
      message,
      actionLabel,
      isDestructive,
      onConfirm
    });
    setShowConfirmationModal(true);
  };

  const toggleDateExpansion = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  useEffect(() => {
    const loadState = () => {
      if (location.state) {
        if (location.state.pocId) setPocId(location.state.pocId);
        if (location.state.clientId) setClientId(location.state.clientId);
        if (location.state.clientName || location.state.pocName) {
          setPocName(location.state.clientName || location.state.pocName);
        }
        return;
      }
      
      if (!clientId) {
        navigate('/', { replace: true });
      }
    };
    
    loadState();
  }, [location, navigate, setPocId, setClientId, setPocName, clientId]);

  useEffect(() => {
    document.body.style.background = "linear-gradient(135deg, #6e8efb, #a777e3)";
    return () => {
      document.body.style.background = "";
    };
  }, []);
    
  useEffect(() => {
    if (clientId) {
      setIsLoading(true);
      axiosInstance
        .post("/api/departments", { clientId })
        .then((response) => response.data)
        .then((data) => {
          setDepartments(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching departments:', error);
          setIsLoading(false);
          setMessage('Error fetching departments.');
          setMessageType('error');
        });
    }
  }, [clientId]);
   
  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailableDates();
      fetchBlockedSlots();
    }
  }, [selectedDoctor]);

  const fetchAvailableDates = () => {
    setIsLoading(true);
    axiosInstance
      .post("/api/pocs/available-dates-update", { pocId: selectedDoctor.POC_ID })
      .then((response) => response.data)
      .then((data) => {
        setAvailableDates(data.map((date) => ({ 
          Schedule_Date: date.Schedule_Date, 
          active_status: date.active_status 
        })));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching available dates:', error);
        setIsLoading(false);
        setMessage('Error fetching available dates.');
        setMessageType('error');
      });
  };

  const fetchBlockedSlots = () => {
    axiosInstance
      .post("/api/pocs/blocked-slots", { pocId: selectedDoctor.POC_ID })
      .then((response) => response.data)
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
          .filter(([_, { blocked }]) => blocked > 0) // only dates with at least one blocked slot
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
  
  useEffect(() => {
    if (selectedDoctor && selectedDate && availability === 'partial') {
      setTimings([]);
      setIsLoading(true);
      
      axiosInstance
        .post("/api/pocs/available-times-update", { 
          pocId: selectedDoctor.POC_ID, 
          date: selectedDate 
        })
        .then((response) => response.data)
        .then((data) => {
          setTimings(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching timings:', error);
          setIsLoading(false);
          setMessage('Error fetching timings.');
          setMessageType('error');
        });
    }
  }, [selectedDoctor, selectedDate, availability]);
   
  const handleDepartmentChange = (e) => {
    const departmentId = e.target.value;
    setSelectedDepartment(departmentId);
    setSelectedDoctor(null);
    setSelectedDate('');
    setTimings([]);
    setSelectedTimings([]);
    setMessage('');
   
    if (departmentId) {
      setIsLoading(true);
      axiosInstance
        .post("/api/pocs", { departmentId, clientId })
        .then((response) => response.data)
        .then((data) => {
          setDoctors(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching doctors:', error);
          setIsLoading(false);
          setMessage('Error fetching doctors.');
          setMessageType('error');
        });
    }
  };
   
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    if (doctorId) {
      const doctor = doctors.find((doc) => doc.POC_ID === parseInt(doctorId));
      setSelectedDoctor(doctor);
      setSelectedDate('');
      setTimings([]);
      setSelectedTimings([]);
      setMessage('');
    } else {
      setSelectedDoctor(null);
    }
  };
   
  const handleAvailabilityChange = (e) => {
    setAvailability(e.target.value);
    if (e.target.value === 'partial') {
      setSelectedTimings([]);
    }
    setMessage('');
  };
   
  const handleDateTileClick = (dateObj) => {
    if (dateObj.active_status === 'blocked') {
      // Show confirmation modal instead of window.confirm
      showConfirmModal({
        title: "Unblock Date",
        message: `Are you sure you want to unblock ${formatDateDisplay(dateObj.Schedule_Date)}?`,
        actionLabel: "Unblock",
        isDestructive: false,
        onConfirm: () => unblockSlot(dateObj.Schedule_Date)
      });
      return;
    }
    
    setSelectedDate(dateObj.Schedule_Date);
    setMessage('');
  };
    
  const handleTimingClick = (timing) => {
    if (timing.active_status === 'blocked') {
      // Show confirmation modal instead of window.confirm
      showConfirmModal({
        title: "Unblock Time Slot",
        message: `Are you sure you want to unblock the ${timing.appointment_time} slot?`,
        actionLabel: "Unblock",
        isDestructive: false,
        onConfirm: () => unblockTimingSlot(timing.appointment_time)
      });
      return;
    }
    
    setSelectedTimings((prev) => {
      return prev.includes(timing.appointment_time)
        ? prev.filter((t) => t !== timing.appointment_time)
        : [...prev, timing.appointment_time];
    });
  };

  const unblockSlot = (date) => {
    if (!selectedDoctor || !selectedDoctor.POC_ID || !date) {
      setMessage('Missing required information for unblocking');
      setMessageType('error');
      return;
    }
    
    setIsLoading(true);
    axiosInstance
      .post("/api/pocs/unblock-slot", {
        pocId: selectedDoctor.POC_ID,
        date
      })
      .then(() => {
        setMessage("Slot unblocked successfully.");
        setMessageType('success');
        fetchAvailableDates();
        fetchBlockedSlots();
      })
      .catch((error) => {
        console.error('Error unblocking slot:', error);
        setMessage('Error unblocking slot.');
        setMessageType('error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const unblockTimingSlot = (time) => {
    if (!selectedDoctor || !selectedDoctor.POC_ID || !selectedDate || !time) {
      setMessage('Missing required information for unblocking');
      setMessageType('error');
      return;
    }
    setIsLoading(true);
    axiosInstance
      .post("/api/pocs/unblock-slot", {
        pocId: selectedDoctor.POC_ID,
        date: selectedDate,
        time
      })
      .then(() => {
        setMessage("Time slot unblocked successfully.");
        setMessageType('success');
        // Refresh timings and blocked slots
        axiosInstance
          .post("/api/pocs/available-times-update", { 
            pocId: selectedDoctor.POC_ID, 
            date: selectedDate 
          })
          .then((response) => response.data)
          .then((data) => {
            setTimings(data);
          });
        fetchBlockedSlots();
      })
      .catch((error) => {
        console.error('Error unblocking time slot:', error);
        setMessage('Error unblocking time slot.');
        setMessageType('error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleUnblockSlot = (slotId) => {
    if (!slotId) {
      setMessage('Invalid slot ID');
      setMessageType('error');
      return;
    }
    
    // Show confirmation modal instead of window.confirm
    showConfirmModal({
      title: "Unblock Slot",
      message: "Are you sure you want to unblock this slot?",
      actionLabel: "Unblock",
      isDestructive: false,
      onConfirm: () => {
        setIsLoading(true);
        axiosInstance
          .post("/api/pocs/unblock-slot-by-id", { slotId })
          .then(() => {
            setMessage("Slot unblocked successfully.");
            setMessageType('success');
            fetchAvailableDates();
            fetchBlockedSlots();
          })
          .catch((error) => {
            console.error('Error unblocking slot:', error);
            setMessage('Error unblocking slot.');
            setMessageType('error');
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    });
  };
   
  const handleUpdateAvailability = () => {
    if (!selectedDoctor || !selectedDate) {
      setMessage('Please select a doctor and date.');
      setMessageType('error');
      return;
    }
    
    if (availability === 'partial' && selectedTimings.length === 0) {
      setMessage('Please select at least one timing slot.');
      setMessageType('error');
      return;
    }
    
    // Show confirmation modal before updating
    showConfirmModal({
      title: "Update Availability",
      message: `Are you sure you want to update availability for ${selectedDoctor.POC_Name} on ${formatDateDisplay(selectedDate)}?`,
      actionLabel: "Update",
      isDestructive: false,
      onConfirm: () => {
        setIsLoading(true);
        const endpoint = availability === 'full' ? '/api/pocs/update-full' : '/api/pocs/update-partial';
        const body = {
          pocId: selectedDoctor.POC_ID,
          date: selectedDate,
          timings: availability === 'partial' ? selectedTimings : [],
          reason
        };
        
        axiosInstance
          .post(endpoint, body)
          .then((response) => {
            setIsLoading(false);
            if (response.status === 200) {
              setMessage("Doctor's availability has been updated successfully.");
              setMessageType('success');
              setReason('');
              
              // Refresh data
              fetchAvailableDates();
              fetchBlockedSlots();
              
              // Refresh timings if partial
              if (availability === 'partial') {
                axiosInstance
                  .post("/api/pocs/available-times-update", { 
                    pocId: selectedDoctor.POC_ID, 
                    date: selectedDate 
                  })
                  .then((response) => response.data)
                  .then((data) => {
                    setTimings(data);
                  });
              }
            } else {
              setMessage('Error updating availability.');
              setMessageType('error');
            }
          })
          .catch((error) => {
            console.error('Error updating availability:', error);
            setMessage('Error updating availability.');
            setMessageType('error');
            setIsLoading(false);
          });
      }
    });
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTimeDisplay = (dateStr, timeStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return timeStr ? `${formattedDate} at ${timeStr}` : formattedDate;
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'blocked': return 'Blocked';
      case 'partial': return 'Partial';
      default: return 'Available';
    }
  };

  const toggleExpandBlockedDate = (date) => {
    setExpandedBlockedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!showConfirmationModal) return null;
    
    return (
      <div className="modal-container">
        <div className="modal-backdrop" onClick={handleCancel}></div>
        <div className="modal-box">
          <div className="modal-box-header">
            <h3>{modalContent.title}</h3>
            <button className="modal-box-close" onClick={handleCancel}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-box-body">
            <p>{modalContent.message}</p>
          </div>
          <div className="modal-box-footer">
            <button 
              className="modal-box-button cancel" 
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              className={`modal-box-button ${modalContent.isDestructive ? 'destructive' : 'confirm'}`}
              onClick={handleConfirm}
            >
              {modalContent.actionLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!clientId && !isLoading) {
    return (
      <div className="availability-page">
        <div className="availability-container">
          <div className="message error">
            <AlertTriangle size={16} className="mr-2" />
            Session expired or invalid. Please log in again.
          </div>
          <button 
            className="update-button" 
            onClick={() => navigate('/', { replace: true })}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="availability-page">
      <div className="availability-header">
        <h1 className="availability-title">UPDATE DOCTOR'S AVAILABILITY</h1>
      </div>
      
      <div className="availability-container">
        {isLoading && (
          <div className="availability-loading-overlay">
            <div className="availability-loading-spinner"></div>
          </div>
        )}
        
        <div className="availability-content">
          {/* Selection Section */}
          <div className="availability-section">
            <h2 className="availability-section-title">Select Doctor</h2>
            <p className="availability-section-desc">
              Choose the department and doctor to update their availability
            </p>
            
            <div className="form-group">
              <label className="form-label">Department</label>
              <div className="select-wrapper">
                <select 
                  value={selectedDepartment} 
                  onChange={handleDepartmentChange} 
                  className="form-select"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.Value_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Doctor</label>
              <div className="select-wrapper">
                <select 
                  value={selectedDoctor?.POC_ID || ''} 
                  onChange={handleDoctorChange} 
                  className="form-select"
                  disabled={!selectedDepartment}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.POC_ID} value={doc.POC_ID}>
                      {doc.POC_Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {selectedDoctor && (
            <div className="tabs-container">
              <div className="tabs-header">
                <button
                  className={`tab-button ${activeTab === 'update' ? 'active' : ''}`}
                  onClick={() => setActiveTab('update')}
                >
                  Update Slots
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
                    {/* Date Selection Section */}
                    <div className="availability-section">
                      <h2 className="availability-section-title">Select Date</h2>
                      <p className="availability-section-desc">
                        Choose a date to update {selectedDoctor.POC_Name}'s availability
                      </p>
                      
                      <div className="dates-legend">
                        <div className="legend-item">
                          <span className="legend-color available"></span>
                          <span className="legend-text">Available</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color partial"></span>
                          <span className="legend-text">Partially Available</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color blocked"></span>
                          <span className="legend-text">Fully Blocked</span>
                        </div>
                      </div>
                      
                      <div className="dates-container">
                        {availableDates.length > 0 ? (
                          <div className="dates-grid">
                            {availableDates.map((dateObj) => (
                              <div
                                key={dateObj.Schedule_Date}
                                className={`date-tile ${dateObj.active_status} ${selectedDate === dateObj.Schedule_Date ? 'selected' : ''}`}
                                onClick={() => handleDateTileClick(dateObj)}
                              >
                                <span className="date-display">{formatDateDisplay(dateObj.Schedule_Date)}</span>
                                <span className="date-status">{getStatusText(dateObj.active_status)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-dates">
                            <AlertTriangle size={20} className="mr-2" />
                            No available dates found
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Availability Options Section */}
                    {selectedDate && (
                      <div className="availability-section">
                        <h2 className="availability-section-title">Set Availability</h2>
                        <p className="availability-section-desc">
                          Choose how to update availability for <span className="highlight-date">{formatDateDisplay(selectedDate)}</span>
                        </p>
                        
                        <div className="availability-options">
                          <div className="option-card">
                            <input
                              type="radio"
                              id="full-availability"
                              name="availability"
                              value="full"
                              checked={availability === 'full'}
                              onChange={handleAvailabilityChange}
                            />
                            <label htmlFor="full-availability" className="option-label">
                              <div className="option-icon">
                                <CheckCircle size={20} />
                              </div>
                              <div className="option-text">
                                <div className="option-title">Full Day Available</div>
                                <div className="option-desc">Make all slots available for this date</div>
                              </div>
                            </label>
                          </div>
                          
                          <div className="option-card">
                            <input
                              type="radio"
                              id="partial-availability"
                              name="availability"
                              value="partial"
                              checked={availability === 'partial'}
                              onChange={handleAvailabilityChange}
                            />
                            <label htmlFor="partial-availability" className="option-label">
                              <div className="option-icon">
                                <Grid size={20} />
                              </div>
                              <div className="option-text">
                                <div className="option-title">Partial Availability</div>
                                <div className="option-desc">Select specific time slots to make available</div>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        {/* Reason Field */}
                        <div className="form-group">
                          <label className="form-label">Enter reason for blocking this slot</label>
                          <textarea
                            className="form-textarea"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for blocking..."
                            rows={3}
                          />
                        </div>
                        
                        {/* Timings Section */}
                        {availability === 'partial' && (
                          <div className="timings-section">
                            <h3 className="timings-title">Select Available Time Slots</h3>
                            
                            {timings.length > 0 ? (
                              <div className="timings-grid">
                                {timings.map((timing) => (
                                  <div
                                    key={timing.appointment_time}
                                    className={`timing-tile ${timing.active_status === 'blocked' ? 'blocked' : ''} ${selectedTimings.includes(timing.appointment_time) ? 'selected' : ''}`}
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
                                No time slots found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Update Button and Message */}
                    {selectedDate && (
                      <>
                        <button
                          type="button"
                          className="update-button"
                          onClick={handleUpdateAvailability}
                          disabled={isLoading || !selectedDoctor || !selectedDate || (availability === 'partial' && selectedTimings.length === 0)}
                        >
                          Update Availability
                        </button>
                        
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
                      </>
                    )}
                  </>
                ) : (
                  // Blocked Slots Tab Section
                  <div className="blocked-slots-section">
                    <h2 className="availability-section-title">Blocked Slots</h2>
                    <p className="availability-section-desc">
                      Currently blocked slots for {selectedDoctor.POC_Name}
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
                {slot.reason}
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
)  : (
                      <div className="no-blocked-slots">
                        <CheckCircle size={20} className="mr-2" />
                        No blocked slots found
                      </div>
                    )}

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
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal />
    </div>
  );
};

export default UpdateAvailability;