import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/AppointmentDetails.css";
import authenticatedFetch from "../authenticated Fetch";
const AppointmentDetailsAdmin = () => {
  const location = useLocation();
  const clientId = location.state.clientId;
  const status = location.state.status;
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
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
              onClick={() => window.location.reload()} 
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
              <span className="pagination-info">Page {currentPage}</span>
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