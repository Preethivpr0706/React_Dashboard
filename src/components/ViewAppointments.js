import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './styles/ViewAppointments.css';
import createAuthenticatedAxios from '../createAuthenticatedAxios';

const ViewAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [clientName, setClientName] = useState('');
  const [pocName, setPocName] = useState('');
  const [pocSpecialization, setPocSpecialization] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const clientId = location.state?.clientId || null;
  const pocId = location.state?.pocId || null;

  const axiosInstance = createAuthenticatedAxios();

  const appointmentsPerPage = 6;

  useEffect(() => {
    document.body.style.background = "linear-gradient(135deg, #f5f7fa, #c3cfe2)";

    return () => {
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    axiosInstance
      .post('/api/appointments', { clientId: clientId, pocId: pocId })
      .then((response) => {
        const data = response.data || {};
        console.log(response.data);
        setClientName(data.clientName || 'Unknown Client');
        setPocName(data.pocName || 'Unknown POC');
        setPocSpecialization(data.pocSpecialization || 'Unknown Specialization');
        const appointmentDetails = data.appointmentDetails || [];
        setAppointments(appointmentDetails);
        setFilteredAppointments(appointmentDetails);
        setTotalPages(Math.ceil(appointmentDetails.length / appointmentsPerPage));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching appointments:', error);
        setIsLoading(false);
      });
  }, [clientId, pocId]);

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
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getAppointmentStatus = (booked, total) => {
    const ratio = booked / total;
    if (ratio >= 0.8) return "high";
    if (ratio >= 0.5) return "medium";
    return "low";
  };

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
