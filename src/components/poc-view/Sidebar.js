import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

const Sidebar = ({ pocId, clientId }) => { // Accept pocId as a prop
  const navigate = useNavigate(); // React Router navigation hook

  
  const handleLogout = () =>{
    navigate("/logout"); // Navigate to the logout page
  } 
  
  const handleDashboard = () => {
    navigate("/poc-dashboard",{state: {pocId}}); // Navigate to the dashboard page with the provided pocId
  }

  const handleAppointments = () => {
    navigate(`/view-appointments/`, { state: { clientId, pocId } }); // Navigate to the appointments page with the provided pocId
  }

  const handleTodaysAppointments = () => {
    navigate(`/todays-appointments`, { state: { pocId } });
  };

  const handleUserProfile = () => {
    navigate(`/poc-user-profile`, { state: { pocId } }); // Navigate to the user profile page with the provided pocId
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h4>MIOT DOCTOR</h4>
      </div>
      <ul className="sidebar-menu">
        <li>
          <button className="menu-link" onClick={handleDashboard}>
            Dashboard
          </button>
        </li>
        <li>
          <button className="menu-link" onClick={handleAppointments}>Appointments</button>
        </li>
        <li>
        <button className="menu-link" onClick={handleTodaysAppointments}>
          Today's Appointments
        </button>
        </li>
        <li>
          <button className="menu-link" onClick={handleUserProfile}>My Profile</button>
        </li>
        <li>
          <button className="menu-link" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
