import React, { useState } from "react";
import { FaUserCircle} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Header = ({pocId}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    console.log("Previous State:", showDropdown);
    setShowDropdown(!showDropdown);
    console.log("Updated State:", !showDropdown);
  };



  const handleLogout = () =>{
    navigate("/logout"); // Navigate to the logout page
  } 
  
  const handleViewProfile = () => {
    navigate(`/poc-user-profile`, { state: { pocId } }); // Navigate to the user profile page with the provided pocId
  }

  return (
    <header className="header poc-header d-flex justify-content-between align-items-center p-3 bg-light shadow-sm">
      <div className="header-left">
        <h3>Empowering Doctors, Simplifying Care</h3>
      </div>
      <div className="header-right d-flex align-items-center">
        <div className="icon-container position-relative">
          <FaUserCircle
            size={30}
            onClick={toggleDropdown}
            style={{ cursor: "pointer" }}
          />
          {showDropdown && (
            <ul className="dropdown-menu">
              <li onClick={handleViewProfile}>View Profile</li>
              <li onClick={handleLogout}>Logout</li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
