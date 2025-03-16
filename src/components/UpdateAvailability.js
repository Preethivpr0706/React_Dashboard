import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, User, Grid, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import createAuthenticatedAxios from '../createAuthenticatedAxios';
const UpdateAvailability = () => {
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const clientId = location.state?.clientId;
  const clientName = location.state?.clientName || null;

  const axiosInstance = createAuthenticatedAxios();

  useEffect(() => {
    // Set the background color when the component is mounted
    document.body.style.background = "linear-gradient(135deg, #6e8efb, #a777e3)";
  
    // Cleanup when the component is unmounted or navigation happens
    return () => {
      document.body.style.background = "";
    };
  }, []);
    
  useEffect(() => {
    // Fetch departments
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
  }, [clientId]);
   
  useEffect(() => {
    if (selectedDoctor) {
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
    }
  }, [selectedDoctor]);
   
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
      // Fetch doctors for the selected department
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
      setSelectedTimings([]); // Reset selected timings when switching to partial
    }
    setMessage('');
  };
   
  const handleDateTileClick = (dateObj) => {
    if (dateObj.active_status === 'blocked') return;
    
    setSelectedDate(dateObj.Schedule_Date);
    setMessage('');
    
    if (availability === 'partial') {
      setIsLoading(true);
      // Fetch available timings for the selected doctor and date
      axiosInstance
        .post("/api/pocs/available-times-update", { 
          pocId: selectedDoctor.POC_ID, 
          date: dateObj.Schedule_Date 
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
  };
    
  const handleTimingClick = (timing) => {
    if (timing.active_status === 'blocked') return;
    
    setSelectedTimings((prev) => {
      return prev.includes(timing.appointment_time)
        ? prev.filter((t) => t !== timing.appointment_time)
        : [...prev, timing.appointment_time];
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
    
    setIsLoading(true);
    const endpoint = availability === 'full' ? '/api/pocs/update-full' : '/api/pocs/update-partial';
    const body = {
      pocId: selectedDoctor.POC_ID,
      date: selectedDate,
      timings: availability === 'partial' ? selectedTimings : [],
    };
    
    axiosInstance
      .post(endpoint, body)
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          setMessage("Doctor's availability has been updated successfully.");
          setMessageType('success');
          
          // Refresh available dates
          if (selectedDoctor) {
            axiosInstance
              .post("/api/pocs/available-dates-update", { pocId: selectedDoctor.POC_ID })
              .then((response) => response.data)
              .then((data) => {
                setAvailableDates(data.map((date) => ({ 
                  Schedule_Date: date.Schedule_Date, 
                  active_status: date.active_status 
                })));
              })
              .catch((error) => console.error('Error refreshing dates:', error));
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
  };

  // Format date for better display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'blocked': return 'Blocked';
      case 'partial': return 'Partial';
      default: return 'Available';
    }
  };

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
          
          {/* Date Selection Section */}
          {selectedDoctor && (
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
          )}
          
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
                  {messageType === 'success' ? <CheckCircle size={16} className="mr-2" /> : <AlertTriangle size={16} className="mr-2" />}
                  {message}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateAvailability;