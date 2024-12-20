import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./TodaysAppointments.css";

const TodaysAppointments = () => {
  const location = useLocation();
  const pocId = location.state.pocId;
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodaysAppointments = async () => {
      try {
        const response = await fetch("/api/poc/todays-appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pocId }),
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

    fetchTodaysAppointments();
  }, [pocId]);

  return (
    <body className="todays-appointments">
    <div className="todays-appointments-container">
      <h1 className="todays-appointments-heading">Today's Appointments</h1>

      {loading ? (
        <p className="todays-appointments-loading">Loading...</p>
      ) : error ? (
        <p className="todays-appointments-error">{error}</p>
      ) : (
        <div className="todays-appointments-table-container">
          <table className="todays-appointments-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Appointment Time</th>
                <th>Appointment Type</th>
                <th>No. of Appointments</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((appt, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{appt.AppointmentTime}</td>
                    <td>{appt.AppointmentType}</td>
                    <td>{appt.AppointmentCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No appointments found for today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </body>
  );
};

export default TodaysAppointments;
