import React, { useState, useEffect } from "react";  
import { useLocation, useNavigate } from "react-router-dom";  
import "../styles/AppointmentDetails.css";  
import BackButtonPOC from "./BackButtonPOC";  
import authenticatedFetch from "../../authenticated Fetch";
  
const AppointmentDetails = () => {  
  const location = useLocation();  
  const pocId = location.state?.pocId;  
  const status = location.state?.status;  
  const type = location.state?.type;  
  const [appointments, setAppointments] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState(null);  
  const navigate = useNavigate();  
  
  useEffect(() => {
    // Set the background color when the component is mounted
    document.body.style.backgroundColor = "#f5f7fa";
    
    // Cleanup when the component is unmounted or navigation happens
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {  
    const fetchAppointments = async () => {  
      try {  
        const response = await authenticatedFetch("/api/poc/appointment-details", {  
          method: "POST",  
          headers: { "Content-Type": "application/json" },  
          body: JSON.stringify({ pocId, status, type }),  
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
  }, [pocId, status, type]);
  
  const handleBackButton = () => {  
    navigate("/doctor-dashboard", { state: { pocId } });  
  };  

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getPaymentStatusClass = (status) => {
    return status.toLowerCase() === 'paid' 
      ? 'payment-status-paid' 
      : 'payment-status-unpaid';
  };
  
  return (  
    <div className="appointment-details-page">
      <div className="appointment-details-header">
        <BackButtonPOC onClick={handleBackButton} />
        <h1 className="appointment-details-title">Appointment Details</h1>
      </div>
      
      <div className="appointment-details-container">
        {loading ? (  
          <div className="appointment-details-loading">
            <div className="loading-spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : error ? (  
          <div className="appointment-details-error">
            <i className="error-icon">!</i>
            <p>{error}</p>
          </div>
        ) : (  
          <div className="appointment-details-content">
            {appointments.length > 0 ? (
              <>
                <div className="appointment-stats">
                  <div className="stat-card">
                    <h3>Total</h3>
                    <p>{appointments.length}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Paid</h3>
                    <p>{appointments.filter(a => a.Payment_Status.toLowerCase() === 'paid').length}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Unpaid</h3>
                    <p>{appointments.filter(a => a.Payment_Status.toLowerCase() !== 'paid').length}</p>
                  </div>
                </div>
                
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
                        <th>Type</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{appt.UserName}</td>
                          <td>{appt.UserContact}</td>
                          <td>{appt.UserLocation}</td>
                          <td>{appt.POCName}</td>
                          <td>{appt.Specialization}</td>
                          <td>
                            <span className="appointment-type">{appt.AppointmentType}</span>
                          </td>
                          <td>{formatDate(appt.AppointmentDate)}</td>
                          <td>{appt.AppointmentTime}</td>
                          <td>
                            <span className={getPaymentStatusClass(appt.Payment_Status)}>
                              {appt.Payment_Status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="no-appointments">
                <div className="empty-state-icon">📅</div>
                <p>No appointments found</p>
                <button 
                  className="refresh-button" 
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );  
};  
  
export default AppointmentDetails;