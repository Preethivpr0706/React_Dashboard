import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/AppointmentDetails.css";
import authenticatedFetch from "../authenticatedFetch";
// Import useProtectedState correctly - check implementation
import { useProtectedState } from "../StatePersistence";

const AppointmentDetailsAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get initial values from location state or default
  const initialClientId = location.state?.clientId || null;
  const initialStatus = location.state?.status || null;
  
  // Use regular useState for now until we verify useProtectedState implementation
  const [clientId, setClientId] = useState(initialClientId);
  const [status, setStatus] = useState(initialStatus);
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 10;

  // Redirect if required state is missing
  useEffect(() => {
    if (!clientId || !status) {
      // Try to retrieve from sessionStorage as a fallback
      try {
        const storedClientId = sessionStorage.getItem('clientId');
        const storedStatus = sessionStorage.getItem('appointmentStatus');
        
        if (storedClientId && storedStatus) {
          setClientId(JSON.parse(storedClientId));
          setStatus(JSON.parse(storedStatus));
        } else {
          // If we can't get the required data, redirect to home
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error("Failed to retrieve state from sessionStorage:", error);
        navigate('/', { replace: true });
      }
    }
  }, [clientId, status, navigate]);

  // Save critical state to sessionStorage
  useEffect(() => {
    if (clientId && status) {
      try {
        sessionStorage.setItem('clientId', JSON.stringify(clientId));
        sessionStorage.setItem('appointmentStatus', JSON.stringify(status));
      } catch (error) {
        console.error("Failed to save data to sessionStorage:", error);
      }
    }
  }, [clientId, status]);

  // Save search term and pagination to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('appointmentSearchTerm', searchTerm);
      sessionStorage.setItem('appointmentCurrentPage', currentPage.toString());
    } catch (error) {
      console.error("Failed to save UI state to sessionStorage:", error);
    }
  }, [searchTerm, currentPage]);

  // Load search term and pagination from sessionStorage on initial render
  useEffect(() => {
    try {
      const storedSearchTerm = sessionStorage.getItem('appointmentSearchTerm');
      const storedCurrentPage = sessionStorage.getItem('appointmentCurrentPage');
      
      if (storedSearchTerm !== null) {
        setSearchTerm(storedSearchTerm);
      }
      
      if (storedCurrentPage !== null) {
        setCurrentPage(parseInt(storedCurrentPage, 10));
      }
    } catch (error) {
      console.error("Failed to load UI state from sessionStorage:", error);
    }
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!clientId || !status) return;
      
      try {
        setLoading(true);
        const response = await authenticatedFetch("/api/admin/appointment-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, status }),
        });

        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        } else {
          throw new Error("Failed to fetch appointments");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [clientId, status]);

  const filteredAppointments = appointments.filter((appt) =>
    appt.UserName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

  const nextPage = () => {
    if (indexOfLastAppointment < filteredAppointments.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset current page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="appointment-details-page">
      <div className="appointment-details-header">
        <h1 className="appointment-details-title">Appointment Details</h1>
      </div>
      
      <div className="appointment-details-container">
        <input
          type="text"
          placeholder="Search by user name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="appointment-search-box"
        />

        {loading ? (
          <div className="appointment-details-loading">
            <div className="loading-spinner"></div>
            <p>Loading appointment details...</p>
          </div>
        ) : error ? (
          <div className="appointment-details-error">
            <div className="error-icon">!</div>
            <p>Error: {error}</p>
            <button 
              onClick={() => {
                setLoading(true);
                setError(null);
                window.location.reload();
              }} 
              className="refresh-button"
            >
              Try Again
            </button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="no-appointments">
            <div className="empty-state-icon">📅</div>
            <p>No appointments found</p>
            <button 
              onClick={() => setSearchTerm("")} 
              className="refresh-button"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="appointment-details-table-container">
            <table className="appointment-details-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>User Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>POC Name</th>
                  <th>Specialization</th>
                  <th>Appointment Type</th>
                  <th>Appointment Date</th>
                  <th>Appointment Time</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {currentAppointments.map((appt, index) => (
                  <tr key={index}>
                    <td>{indexOfFirstAppointment + index + 1}</td>
                    <td>{appt.UserName}</td>
                    <td>{appt.UserContact}</td>
                    <td>{appt.UserLocation}</td>
                    <td>{appt.POCName}</td>
                    <td>{appt.Specialization}</td>
                    <td>
                      <span className="appointment-type">
                        {appt.AppointmentType}
                      </span>
                    </td>
                    <td>{appt.AppointmentDate}</td>
                    <td>{appt.AppointmentTime}</td>
                    <td>
                      <span className={
                        appt.Payment_Status === 'Paid' 
                          ? 'payment-status-paid' 
                          : 'payment-status-unpaid'
                      }>
                        {appt.Payment_Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-controls">
              <button 
                onClick={prevPage} 
                disabled={currentPage === 1} 
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {Math.ceil(filteredAppointments.length / appointmentsPerPage)}
              </span>
              <button 
                onClick={nextPage} 
                disabled={indexOfLastAppointment >= filteredAppointments.length} 
                className="pagination-button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentDetailsAdmin;