import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserProfile.css';
import BackButtonPOC from './BackButtonPOC';

const UserProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const location = useLocation();
  const pocId = location.state.pocId;
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch doctor details
    axios.get(`api/doctor/${pocId}`)
      .then((response) => setDoctor(response.data))
      .catch((error) => console.error('Error fetching doctor details:', error));

    // Fetch appointments
    axios.get(`api/poc/appointments/${pocId}`)
    .then((response) => {
        console.log("Fetched appointments:", response.data); // Log data for debugging
        setAppointments(response.data);
    })
    .catch((error) => console.error('Error fetching appointments:', error));
  }, [pocId]);

  if (!doctor) {
    return <div>Loading...</div>; // Show loading spinner if doctor details aren't loaded
  }

  const handleBackButton = () => {  
    navigate("/back-button", { state: { pocId } });  
   }; 
  return (
    <>
      <BackButtonPOC onClick={handleBackButton}/>
    <div className="user-profile">
      <div className="user-profile__container">
        {/* Doctor Profile Section */}
        <div className="user-profile__header">
          <img src={doctor.image} alt={doctor.name} className="user-profile__image" />
          <div>
            <h1 className="user-profile__name">{doctor.name}</h1>
            <p className="user-profile__specialization">{doctor.specialization}</p>
            <p className="user-profile__qualification">{doctor.qualification}</p>
            <div>
              <p>Email: {doctor.email}</p>
              <p>Phone: {doctor.phone}</p>
              <p>Location: {doctor.location}</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="user-profile__stats">
          <div className="user-profile__stat">
            <h3 className="user-profile__stat-title">Patients</h3>
            <p className="user-profile__stat-value">1,234</p>
            <p className="user-profile__stat-description">Total Patients</p>
          </div>
          <div className="user-profile__stat">
            <h3 className="user-profile__stat-title">Experience</h3>
            <p className="user-profile__stat-value">15+</p>
            <p className="user-profile__stat-description">Years of Practice</p>
          </div>
          <div className="user-profile__stat">
            <h3 className="user-profile__stat-title">Ratings</h3>
            <p className="user-profile__stat-value">4.9</p>
            <p className="user-profile__stat-description">Out of 5.0</p>
          </div>
          <div className="user-profile__stat">
            <h3 className="user-profile__stat-title">Reviews</h3>
            <p className="user-profile__stat-value">500</p>
            <p className="user-profile__stat-description">Patient Reviews</p>
          </div>
        </div>

        {/* Appointment List Section */}
        <div className="user-profile__appointments">
          <h2 className="user-profile__appointments-title">Upcoming Appointments</h2>
          {appointments.map((appointment, index) => (
            <div key={index} className="user-profile__appointment">
              <h3 className="user-profile__appointment-name">{appointment.patientName}</h3>
              <p className="user-profile__appointment-reason">{appointment.reason}</p>
              <div>
                <span className="user-profile__appointment-time">{appointment.time}</span>
                <span className="user-profile__appointment-date">{appointment.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default UserProfile;
