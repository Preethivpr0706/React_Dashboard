import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./ViewAppointments.css";

const ViewAppointments = () => {
  const { pocId } = useParams();
  const [appointments, setAppointments] = useState([]);
  const [clientName, setClientName] = useState("");
  const [pocName, setPocName] = useState("");
  const [pocSpecialization, setPocSpecialization] = useState("");

  useEffect(() => {
    fetch(`/api/appointments/${pocId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched appointments:", data);

        // Set client and POC details
        if (data) {
          setClientName(data.clientName || "Unknown Client");
          setPocName(data.pocName || "Unknown POC");
          setPocSpecialization(data.pocSpecialization || "Unknown Specialization");
        }

        // Set appointments if available
        if (data && data.appointmentDetails && data.appointmentDetails.length > 0) {
          setAppointments(data.appointmentDetails);
        } else {
          setAppointments([]); // Set empty array if no appointments are available
        }
      })
      .catch((error) => console.error("Error fetching appointments:", error));
  }, [pocId]);

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
