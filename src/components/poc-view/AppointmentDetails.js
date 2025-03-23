import React, { useState, useEffect } from "react";  
import { useLocation, useNavigate } from "react-router-dom";  
import "../styles/AppointmentDetails.css";  
import BackButtonPOC from "./BackButtonPOC";  
import authenticatedFetch from "../../authenticatedFetch";
  
const AppointmentDetails = () => {  
  const [appointments, setAppointments] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState(null);  
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for protected data
  const [pocId, setPocId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [pocName, setPocName] = useState(null);
  const [status, setStatus] = useState(null);
  const [type, setType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Set the background color when the component is mounted
    document.body.style.backgroundColor = "#f5f7fa";
    
    // Cleanup when the component is unmounted or navigation happens
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Load state from location or sessionStorage
  useEffect(() => {
    const loadState = () => {
      // First try to get state from location
      if (location.state) {
        if (location.state.pocId) {
          setPocId(location.state.pocId);
          // Save to sessionStorage for persistence
          try {
            sessionStorage.setItem('pocId', JSON.stringify(location.state.pocId));
          } catch (error) {
            console.error("Failed to save pocId to sessionStorage:", error);
          }
        }
        
        if (location.state.clientId) {
          setClientId(location.state.clientId);
          try {
            sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
          } catch (error) {
            console.error("Failed to save clientId to sessionStorage:", error);
          }
        }
        
        if (location.state.pocName) {
          setPocName(location.state.pocName);
          try {
            sessionStorage.setItem('pocName', JSON.stringify(location.state.pocName));
          } catch (error) {
            console.error("Failed to save pocName to sessionStorage:", error);
          }
        }
        
        if (location.state.status) {
          setStatus(location.state.status);
          try {
            sessionStorage.setItem('appointmentStatus', JSON.stringify(location.state.status));
          } catch (error) {
            console.error("Failed to save status to sessionStorage:", error);
          }
        }
        
        if (location.state.type) {
          setType(location.state.type);
          try {
            sessionStorage.setItem('appointmentType', JSON.stringify(location.state.type));
          } catch (error) {
            console.error("Failed to save type to sessionStorage:", error);
          }
        }
        
        setIsLoading(false);
        return;
      }
      
      // If not available in location, try sessionStorage
      try {
        const storedPocId = sessionStorage.getItem('pocId');
        const storedClientId = sessionStorage.getItem('clientId');
        const storedPocName = sessionStorage.getItem('pocName');
        const storedStatus = sessionStorage.getItem('appointmentStatus');
        const storedType = sessionStorage.getItem('appointmentType');
        
        if (storedPocId) setPocId(JSON.parse(storedPocId));
        if (storedClientId) setClientId(JSON.parse(storedClientId));
        if (storedPocName) setPocName(JSON.parse(storedPocName));
        if (storedStatus) setStatus(JSON.parse(storedStatus));
        if (storedType) setType(JSON.parse(storedType));
        
        if (storedPocId && (storedStatus || storedType)) {
          setIsLoading(false);
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

  // Fetch appointment data
  useEffect(() => {  
    const fetchAppointments = async () => {
      // Only fetch if the required data is available
      if (!pocId || (!status && !type)) return;
      
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
    
    if (!isLoading) {
      fetchAppointments();
    }
  }, [pocId, status, type, isLoading]);
  
  const handleBackButton = () => {  
    navigate("/doctor-dashboard", { state: { pocId, clientId, pocName } });  
  };  

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Fixed function that was causing the error
  const getPaymentStatusClass = (status) => {
    // Check if status is null or undefined before calling toLowerCase()
    if (!status) return 'payment-status-unknown';
    
    return status.toLowerCase() === 'paid' 
      ? 'payment-status-paid' 
      : 'payment-status-unpaid';
  };
  
  // Another fixed function to safely filter appointments
  const countPaidAppointments = () => {
    return appointments.filter(a => a.Payment_Status && a.Payment_Status.toLowerCase() === 'paid').length;
  };
  
  // Safe function to count unpaid appointments
  const countUnpaidAppointments = () => {
    return appointments.filter(a => a.Payment_Status && a.Payment_Status.toLowerCase() !== 'paid').length;
  };
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
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
                    <p>{countPaidAppointments()}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Unpaid</h3>
                    <p>{countUnpaidAppointments()}</p>
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
                          <td>{appt.UserName || 'N/A'}</td>
                          <td>{appt.UserContact || 'N/A'}</td>
                          <td>{appt.UserLocation || 'N/A'}</td>
                          <td>{appt.POCName || 'N/A'}</td>
                          <td>{appt.Specialization || 'N/A'}</td>
                          <td>
                            <span className="appointment-type">{appt.AppointmentType || 'N/A'}</span>
                          </td>
                          <td>{appt.AppointmentDate ? formatDate(appt.AppointmentDate) : 'N/A'}</td>
                          <td>{appt.AppointmentTime || 'N/A'}</td>
                          <td>
                            <span className={getPaymentStatusClass(appt.Payment_Status)}>
                              {appt.Payment_Status || 'Unknown'}
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