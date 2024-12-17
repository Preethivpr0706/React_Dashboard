import React, { useState } from "react";
import { FaUserCircle, FaBell } from "react-icons/fa"; // Importing icons

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    console.log("Previous State:", showDropdown);
    setShowDropdown((prev) => !prev);
    console.log("Updated State:", !showDropdown);
  };

  return (
    <header className="header d-flex justify-content-between align-items-center p-3 bg-light shadow-sm">
      {console.log("Header Component Loaded")} {/* Debugging */}
      <div className="header-left">
        <h3>Doctor Dashboard</h3>
      </div>

      {/* Icons on the right */}
      <div className="header-right d-flex align-items-center">
        <div className="icon-container mr-4">
          <FaBell size={24} onClick={() => alert("Notification clicked!")} style={{ cursor: "pointer" }} />
        </div>
        <div className="icon-container position-relative">
          <FaUserCircle
            size={30}
            onClick={toggleDropdown}
            style={{ cursor: "pointer" }}
          />
          {/* Dropdown menu */}
          {showDropdown && (
            <ul className="dropdown-menu">
              <li onClick={() => alert("User Profile clicked!")}>User Profile</li>
              <li onClick={() => alert("Settings clicked!")}>Settings</li>
              <li onClick={() => alert("Logout clicked!")}>Logout</li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;