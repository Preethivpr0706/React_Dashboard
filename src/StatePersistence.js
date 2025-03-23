// statePersistence.js
import { useState, useEffect } from 'react';

// Hook to safely use session state
export const useSessionState = (key, initialValue) => {
    // Initialize state with a function to avoid computations on every render
    const [state, setState] = useState(() => {
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    // Update sessionStorage when state changes
    useEffect(() => {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(error);
        }
    }, [key, state]);

    return [state, setState];
};

// Improved hook for protected component state
export const useProtectedState = (location, requiredKeys) => {
    // This state tracks whether all required keys are available
    const [isComplete, setIsComplete] = useState(false);

    // This state holds the actual data
    const [stateData, setStateData] = useState({});

    // This effect loads data from location.state or sessionStorage
    useEffect(() => {
        // If we have state from navigation, use it
        if (location.state && requiredKeys.every(key => location.state[key] !== undefined)) {
            // Save to state
            setStateData(location.state);
            setIsComplete(true);

            // Save to session storage for persistence
            try {
                requiredKeys.forEach(key => {
                    sessionStorage.setItem(key, JSON.stringify(location.state[key]));
                });
            } catch (error) {
                console.error("Failed to save state to sessionStorage:", error);
            }
            return;
        }

        // Try to get from sessionStorage
        try {
            const sessionState = {};
            let allKeysFound = true;

            requiredKeys.forEach(key => {
                const item = sessionStorage.getItem(key);
                if (item) {
                    sessionState[key] = JSON.parse(item);
                } else {
                    allKeysFound = false;
                }
            });

            if (allKeysFound) {
                setStateData(sessionState);
                setIsComplete(true);
            } else {
                setIsComplete(false);
            }
        } catch (error) {
            console.error("Failed to retrieve state from sessionStorage:", error);
            setIsComplete(false);
        }
    }, [location, requiredKeys]);

    return {
        isLoaded: isComplete,
        state: isComplete ? stateData : null,
        setState: setStateData
    };
};