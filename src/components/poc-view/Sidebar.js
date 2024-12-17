import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [settingsExpanded, setSettingsExpanded] = useState(false); // Track if settings is expanded
  const navigate = useNavigate(); // React Router navigation hook

  const toggleSettings = () => {
    setSettingsExpanded(!settingsExpanded); // Toggle settings menu visibility
  };

  const handleLogout = () => {
    navigate('/logout'); // Navigate to the logout page
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header mb-4">
        <h4>MIOT DOCTOR</h4>
      </div>
      <ul className="list-unstyled">
        <li className="mb-3">
          <a href="#" className="text-white text-decoration-none">Dashboard</a>
        </li>
        <li className="mb-3">
          <a href="#" className="text-white text-decoration-none">Appointments</a>
        </li>
        <li className="mb-3">
          <a href="#" className="text-white text-decoration-none">View Patients</a>
        </li>
        <li className="mb-3">
          <a href="#" className="text-white text-decoration-none">My Profile</a>
        </li>
        <li>
          <a className="text-white text-decoration-none" onClick={handleLogout}>Logout</a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
