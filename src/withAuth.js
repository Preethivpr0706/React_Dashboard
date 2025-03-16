// withAuth.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const withAuth = (WrappedComponent) => {
  const AuthenticatedComponent = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
      const checkAuthentication = () => {
        const token = localStorage.getItem('token');
        console.log('Checking authentication - Token:', token);

        if (token) {
          try {
            // Optionally, validate token expiration
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const currentTime = Math.floor(Date.now() / 1000);
              
              console.log('Token payload:', payload);
              console.log('Current time:', currentTime);
              console.log('Token expiration:', payload.exp);

              if (payload.exp > currentTime) {
                setIsAuthenticated(true);
                return;
              }
            }
          } catch (error) {
            console.error('Token validation error:', error);
          }
        }
        
        // If no valid token found
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      };

      checkAuthentication();
    }, []);

    // Render nothing while checking authentication
    if (isAuthenticated === null) {
      return <div>Loading...</div>;
    }

    // Redirect to login if not authenticated
    if (isAuthenticated === false) {
      console.log('Redirecting to login page');
      return <Navigate to="/" replace />;
    }

    // Render the wrapped component if authenticated
    console.log('Rendering authenticated component');
    return <WrappedComponent />;
  };

  return AuthenticatedComponent;
};

export default withAuth;
