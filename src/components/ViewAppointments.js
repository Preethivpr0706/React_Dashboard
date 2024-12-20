import React, { useState, useEffect } from "react";  
import { useParams, useLocation } from "react-router-dom";  
import axios from "axios";
import "./ViewAppointments.css";  
  
const ViewAppointments = () => {  
  const { pocId } = useParams();  
  const location = useLocation();  
  const clientId = location.state.clientId;  
  const [appointments, setAppointments] = useState([]);  
  const [clientName, setClientName] = useState("");  
  const [pocName, setPocName] = useState("");  
  const [pocSpecialization, setPocSpecialization] = useState("");  
  
  useEffect(() => {  
   axios  
    .post("/api/appointments", { pocId, clientId })  
    .then((response) => {  
      console.log("Fetched appointments:", response.data);  
  
      // Set client and POC details  
      if (response.data) {  
       setClientName(response.data.clientName || "Unknown Client");  
       setPocName(response.data.pocName || "Unknown POC");  
       setPocSpecialization(response.data.pocSpecialization || "Unknown Specialization");  
      }  
  
      // Set appointments if available  
      if (response.data && response.data.appointmentDetails && response.data.appointmentDetails.length > 0) {  
       setAppointments(response.data.appointmentDetails);  
      } else {  
       setAppointments([]); // Set empty array if no appointments are available  
      }  
    })  
    .catch((error) => console.error("Error fetching appointments:", error));  
  }, [pocId, clientId]);  
  
  return (  
   <body className="view-appointments">  
    <div className="view-appointments-page">  
      <h2>POC Appointment Details</h2>  
      <div className="poc-details">  
       <h3>Client Name: <span className="poc-value">{clientName}</span></h3>  
       <h3>POC Name: <span className="poc-value">{pocName}</span></h3>  
       <h3>POC Specialization: <span className="poc-value">{pocSpecialization}</span></h3>  
      </div>  
      <table>  
       <thead>  
        <tr>  
          <th>S.No</th>  
          <th>Date</th>  
          <th>Day</th>  
          <th>Time</th>  
          <th>No. of Appointments Booked</th>  
          <th>Total Slots</th>  
        </tr>  
       </thead>  
       <tbody>  
        {appointments.length > 0 ? (  
          appointments.map((appointment, index) => (  
           <tr key={index}>  
            <td>{appointment.sNo}</td>  
            <td>{appointment.date}</td>  
            <td>{appointment.day}</td>  
            <td>{appointment.time}</td>  
            <td>{appointment.noOfAppointments}</td>  
            <td>{appointment.totalSlots}</td>  
           </tr>  
          ))  
        ) : (  
          <tr>  
           <td colSpan="6">No appointments available</td>  
          </tr>  
        )}  
       </tbody>  
      </table>  
    </div>  
   </body>  
  );  
};  
  
export default ViewAppointments;
