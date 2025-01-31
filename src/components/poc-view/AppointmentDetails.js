import React, { useState, useEffect } from "react";  
import { useLocation, useNavigate } from "react-router-dom";  
import "../styles/AppointmentDetails.css";  
import BackButtonPOC from "./BackButtonPOC";  
  
const AppointmentDetails = () => {  
    const location = useLocation();  
    const pocId = location.state.pocId;  
    const status = location.state.status;  
    const type = location.state.type;  
    const [appointments, setAppointments] = useState([]);  
    const [loading, setLoading] = useState(true);  
    const [error, setError] = useState(null);  
    const navigate = useNavigate();  
    useEffect(() => {
          // Set the background color when the component is mounted
          document.body.style.backgroundColor = " #80bdff";
      
          // Cleanup when the component is unmounted or navigation happens
          return () => {
            document.body.style.backgroundColor = "";
          };
        }, []);
    useEffect(() => {  
     const fetchAppointments = async () => {  
      try {  
        const response = await fetch("/api/poc/appointment-details", {  
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
  
  return (  
   <>  
    <BackButtonPOC onClick={handleBackButton} />  
    <div className="appointment-details-container">  
      <h1 className="appointment-details-heading">Appointment Details</h1>  
  
      {loading ? (  
       <p className="appointment-details-loading">Loading...</p>  
      ) : error ? (  
       <p className="appointment-details-error">{error}</p>  
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
           {appointments.length > 0 ? (  
            appointments.map((appt, index) => (  
              <tr key={index}>  
               <td>{index + 1}</td>  
               <td>{appt.UserName}</td>  
               <td>{appt.UserContact}</td>  
               <td>{appt.UserLocation}</td>  
               <td>{appt.POCName}</td>  
               <td>{appt.Specialization}</td>  
               <td>{appt.AppointmentType}</td>  
               <td>{appt.AppointmentDate}</td>  
               <td>{appt.AppointmentTime}</td>  
               <td className={appt.Payment_Status === 'Paid' ? 'payment-status-paid' : 'payment-status-unpaid'}>{appt.Payment_Status}</td>
              </tr>  
            ))  
           ) : (  
            <tr>  
              <td colSpan="10">No appointments found</td>  
            </tr>  
           )}  
          </tbody>  
        </table>  
       </div>  
      )}  
    </div>  
   </>  
  );  
};  
  
export default AppointmentDetails;
