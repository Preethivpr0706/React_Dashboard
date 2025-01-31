import React, { useState } from 'react';
import './styles/LogoutPage.css';
import { useNavigate } from "react-router-dom";

const LogoutPage = () => {
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);

  const navigate = useNavigate(); // Import the useNavigate hook

  const handleLogout = () => {
    setLogoutConfirmation(true);
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleConfirmLogout = () => {
    // Add logout logic here
    navigate('/'); // Redirect to the home page or login page
    console.log('Logged out');
  };

  return (
    <div className="logout-page">
      <div className="logout-container">
        <h1 className="logout-title">Logout</h1>
        <p className="logout-message">
          {logoutConfirmation
            ? 'Please confirm that you want to logout.'
            : 'Are you sure you want to logout?'}
        </p>
        <div className="button-group">
          {logoutConfirmation ? (
            <>
              <button className="button logout-button" onClick={handleConfirmLogout}>
                Confirm Logout
              </button>
              <button className="button cancel-button" onClick={handleCancel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="button logout-button" onClick={handleLogout}>
                Logout
              </button>
              <button className="button cancel-button" onClick={handleCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
