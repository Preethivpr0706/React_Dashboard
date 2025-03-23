// withRoleAuth.js
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authenticatedFetch from './authenticatedFetch';

const withAuth = (WrappedComponent, requiredRole, requiredStateKeys = []) => {
  const AuthenticatedComponent = (props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const location = useLocation();
    
    // State for required data
    const [stateData, setStateData] = useState({});
    const [hasRequiredState, setHasRequiredState] = useState(requiredStateKeys.length === 0);
    const [isLoadingState, setIsLoadingState] = useState(requiredStateKeys.length > 0);
    
    // First effect: Check authentication
    useEffect(() => {
      const checkAuthentication = async () => {
        try {
          console.log('Sending authentication validation request...');
          const response = await authenticatedFetch('/api/auth/validate');
          
          if (response.status === 200) {
            const data = await response.json();
            setUserRole(data.user.role);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Authentication validation error:', error);
          setIsAuthenticated(false);
        } finally {
          setIsLoadingAuth(false);
        }
      };
    
      checkAuthentication();
    }, []);

    // Second effect: Load required state data
    useEffect(() => {
      if (requiredStateKeys.length === 0) {
        setIsLoadingState(false);
        return;
      }
      
      // First check location state
      if (location.state && requiredStateKeys.every(key => location.state[key] !== undefined)) {
        setStateData(location.state);
        setHasRequiredState(true);
        setIsLoadingState(false);
        
        // Save to session storage for persistence
        try {
          requiredStateKeys.forEach(key => {
            sessionStorage.setItem(key, JSON.stringify(location.state[key]));
          });
        } catch (error) {
          console.error("Failed to save state to sessionStorage:", error);
        }
        return;
      }
      
      // If not in location state, try sessionStorage
      try {
        const sessionState = {};
        let allKeysFound = true;
        
        requiredStateKeys.forEach(key => {
          const item = sessionStorage.getItem(key);
          if (item) {
            sessionState[key] = JSON.parse(item);
          } else {
            allKeysFound = false;
          }
        });
        
        if (allKeysFound) {
          setStateData(sessionState);
          setHasRequiredState(true);
        } else {
          setHasRequiredState(false);
        }
      } catch (error) {
        console.error("Failed to retrieve state from sessionStorage:", error);
        setHasRequiredState(false);
      } finally {
        setIsLoadingState(false);
      }
    }, [location, requiredStateKeys]);

    // Show loading while we're determining auth and state
    if (isLoadingAuth || isLoadingState) {
      return <div>Loading...</div>;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    // Not authorized for this role - redirect to appropriate dashboard
    if (requiredRole && userRole !== requiredRole) {
      const redirectPath = userRole === 'admin' ? '/admin-dashboard' : '/poc-dashboard';
      return <Navigate to={redirectPath} replace />;
    }

    // Missing required state - redirect to appropriate dashboard
    if (!hasRequiredState) {
      const redirectPath = userRole === 'admin' ? '/admin-dashboard' : '/poc-dashboard';
      return <Navigate to={redirectPath} replace />;
    }

    // All checks passed - render the component with combined props
    return <WrappedComponent {...props} {...stateData} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;