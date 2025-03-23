import React, { useState } from 'react';
import './styles/LogoutPage.css';
import { useNavigate } from "react-router-dom";

const LogoutPage = () => {
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    setLogoutConfirmation(true);
  };
  
  const handleCancel = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(-1); // Go back to the previous page
    }, 300);
  };
  
  const handleConfirmLogout = async () => {
    setIsExiting(true);
    setTimeout(async () => {
        try {
            const response = await fetch('http://localhost:5000/api/logout', {
                method: 'POST',
                credentials: 'include', // Ensures cookies are sent with the request
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            if (result.success) {
                console.log('Logged out:', result.message);
            } else {
                console.error('Logout failed:', result.message);
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear local storage
        localStorage.removeItem('clientId');
        localStorage.removeItem('clientName');

        // Redirect to the login page
        navigate('/');
    }, 300);
};

  
  return (
    <div className="logout-page">
      <div className={`logout-container ${isExiting ? 'fade-out' : ''}`}>
        <div className="accent-circle"></div>
        <h1 className="logout-title">Ready to leave?</h1>
        <p className="logout-message">
          {logoutConfirmation
            ? 'This will end your current session and return you to the login screen.'
            : 'Are you sure you want to sign out of your account?'}
        </p>
        <div className="button-group">
          {logoutConfirmation ? (
            <>
              <button className="button logout-button" onClick={handleConfirmLogout}>
                Yes, Sign Out
              </button>
              <button className="button cancel-button" onClick={() => setLogoutConfirmation(false)}>
                No, Stay Here
              </button>
            </>
          ) : (
            <>
              <button className="button logout-button" onClick={handleLogout}>
                Sign Out
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