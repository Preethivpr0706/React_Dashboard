import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/ViewAppointments.css';
import createAuthenticatedAxios from '../createAuthenticatedAxios';

const ViewAppointments = () => {
  // Core data states
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Information states
  const [clientName, setClientName] = useState('');
  const [pocName, setPocName] = useState('');
  const [pocSpecialization, setPocSpecialization] = useState('');
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Protected state with persistence
  const [clientId, setClientId] = useState(null);
  const [pocId, setPocId] = useState(null);
  const [stateLoading, setStateLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const axiosInstance = createAuthenticatedAxios();
  const initialLoadRef = useRef(true);

  const appointmentsPerPage = 6;

  // Load state from location or sessionStorage
  useEffect(() => {
    const loadState = () => {
      // First try to get state from location
      if (location.state && location.state.pocId && location.state.clientId) {
        setPocId(location.state.pocId);
        setClientId(location.state.clientId);
        
        if (location.state.pocName) {
          setPocName(location.state.pocName);
        }
        
        if (location.state.clientName) {
          setClientName(location.state.clientName);
        }
        
        // Save to sessionStorage for persistence
        try {
          sessionStorage.setItem('pocId', JSON.stringify(location.state.pocId));
          sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
          
          if (location.state.pocName) {
            sessionStorage.setItem('pocName', JSON.stringify(location.state.pocName));
          }
          
          if (location.state.clientName) {
            sessionStorage.setItem('clientName', JSON.stringify(location.state.clientName));
          }
        } catch (error) {
          console.error("Failed to save state to sessionStorage:", error);
        }
        
        setStateLoading(false);
        return;
      }
      
      // If not available in location, try sessionStorage
      try {
        const storedPocId = sessionStorage.getItem('pocId');
        const storedClientId = sessionStorage.getItem('clientId');
        const storedPocName = sessionStorage.getItem('pocName');
        const storedClientName = sessionStorage.getItem('clientName');
        
        if (storedPocId && storedClientId) {
          setPocId(JSON.parse(storedPocId));
          setClientId(JSON.parse(storedClientId));
          
          if (storedPocName) {
            setPocName(JSON.parse(storedPocName));
          }
          
          if (storedClientName) {
            setClientName(JSON.parse(storedClientName));
          }
          
          setStateLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to retrieve state from sessionStorage:", error);
      }
      
      // If we get here, we couldn't get state from either source
      navigate('/', { replace: true });
    };
    
    loadState();
  }, [location, navigate]);

  // Restore search and pagination from sessionStorage if available
  useEffect(() => {
    if (initialLoadRef.current && !stateLoading) {
      try {
        const storedSearchTerm = sessionStorage.getItem('appointmentsSearchTerm');
        const storedCurrentPage = sessionStorage.getItem('appointmentsCurrentPage');
        
        if (storedSearchTerm) {
          setSearchTerm(JSON.parse(storedSearchTerm));
        }
        
        if (storedCurrentPage) {
          setCurrentPage(JSON.parse(storedCurrentPage));
        }
        
        initialLoadRef.current = false;
      } catch (error) {
        console.error("Failed to retrieve UI state from sessionStorage:", error);
      }
    }
  }, [stateLoading]);

  // Background gradient effect
  useEffect(() => {
    document.body.style.background = "linear-gradient(135deg, #f5f7fa, #c3cfe2)";

    return () => {
      document.body.style.background = "";
    };
  }, []);

  // Fetch appointments data
  useEffect(() => {
    if (!stateLoading && clientId && pocId) {
      setIsLoading(true);
      axiosInstance
        .post('/api/appointments', { clientId: clientId, pocId: pocId })
        .then((response) => {
          const data = response.data || {};
          console.log(response.data);
          
          // Only set these if they're not already set from location state
          if (!clientName) {
            setClientName(data.clientName || 'Unknown Client');
          }
          
          if (!pocName) {
            setPocName(data.pocName || 'Unknown POC');
          }
          
          setPocSpecialization(data.pocSpecialization || 'Unknown Specialization');
          
          const appointmentDetails = data.appointmentDetails || [];
          setAppointments(appointmentDetails);
          
          // Apply existing search filter if there is one
          if (searchTerm) {
            const filtered = appointmentDetails.filter((appointment) =>
              ['date', 'day', 'time'].some((key) =>
                appointment[key]?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            );
            setFilteredAppointments(filtered);
            setTotalPages(Math.ceil(filtered.length / appointmentsPerPage));
          } else {
            setFilteredAppointments(appointmentDetails);
            setTotalPages(Math.ceil(appointmentDetails.length / appointmentsPerPage));
          }
          
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching appointments:', error);
          setIsLoading(false);
        });
    }
  }, [clientId, pocId, stateLoading, clientName, pocName, searchTerm]);

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    const filtered = appointments.filter((appointment) =>
      ['date', 'day', 'time'].some((key) =>
        appointment[key]?.toLowerCase().includes(term)
      )
    );
    
    console.log(filtered);
    setFilteredAppointments(filtered);
    setTotalPages(Math.ceil(filtered.length / appointmentsPerPage));
    setCurrentPage(1);
    setSearchTerm(term);
    
    // Save search term to sessionStorage
    try {
      sessionStorage.setItem('appointmentsSearchTerm', JSON.stringify(term));
    } catch (error) {
      console.error("Failed to save search term to sessionStorage:", error);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    
    // Save current page to sessionStorage
    try {
      sessionStorage.setItem('appointmentsCurrentPage', JSON.stringify(pageNumber));
    } catch (error) {
      console.error("Failed to save current page to sessionStorage:", error);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      
      // Save current page to sessionStorage
      try {
        sessionStorage.setItem('appointmentsCurrentPage', JSON.stringify(newPage));
      } catch (error) {
        console.error("Failed to save current page to sessionStorage:", error);
      }
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      
      // Save current page to sessionStorage
      try {
        sessionStorage.setItem('appointmentsCurrentPage', JSON.stringify(newPage));
      } catch (error) {
        console.error("Failed to save current page to sessionStorage:", error);
      }
    }
  };

  const getAppointmentStatus = (booked, total) => {
    const ratio = booked / total;
    if (ratio >= 0.8) return "high";
    if (ratio >= 0.5) return "medium";
    return "low";
  };

  // Show loading state while state initialization is in progress
  if (stateLoading) {
    return (
      <div className="app-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading application state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-card">
        <div className="app-header">
          <div className="doctor-profile">
            <div className="avatar">
              {pocName.charAt(0).toUpperCase()}
            </div>
            <div className="doctor-info">
              <h1>{pocName}</h1>
              <span className="specialization">{pocSpecialization}</span>
            </div>
          </div>

          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="search"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by date, day or time..."
              className="search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>No appointments found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="appointments-grid">
              {filteredAppointments
                .slice((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage)
                .map((appointment, index) => (
                  <div key={index} className="appointment-card">
                    <div className="appointment-date">
                      <span className="day">{appointment.day}</span>
                      <span className="date">{appointment.date}</span>
                    </div>
                    <div className="appointment-time">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{appointment.time}</span>
                    </div>
                    <div className="appointment-slots">
                      <div className={`slot-status ${getAppointmentStatus(appointment.noOfAppointments, appointment.totalSlots)}`}>
                        <span>{appointment.noOfAppointments}/{appointment.totalSlots}</span>
                        <div className="slot-progress">
                          <div
                            className="progress-bar"
                            style={{ width: `${(appointment.noOfAppointments / appointment.totalSlots) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="page-button prev"
                aria-label="Previous page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageToShow;
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (currentPage <= 3) {
                    pageToShow = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i;
                  } else {
                    pageToShow = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageToShow}
                      onClick={() => handlePageChange(pageToShow)}
                      className={`page-number ${currentPage === pageToShow ? 'active' : ''}`}
                    >
                      {pageToShow}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="page-ellipsis">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`page-number ${currentPage === totalPages ? 'active' : ''}`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="page-button next"
                aria-label="Next page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewAppointments;