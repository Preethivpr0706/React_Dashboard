import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./styles/ViewPOC.css";
import createAuthenticatedAxios from "../createAuthenticatedAxios";

const ViewPOC = () => {
  // State definitions
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [pocs, setPocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Client state with persistence
  const [clientId, setClientId] = useState(null);
  const [clientName, setClientName] = useState("Client");
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const axiosInstance = createAuthenticatedAxios();
  const initialLoadRef = useRef(true);

  // Load state from location or sessionStorage
  useEffect(() => {
    const loadState = () => {
      // First try to get state from location
      if (location.state && location.state.clientId) {
        setClientId(location.state.clientId);
        setClientName(location.state.clientName || "Client");
        
        // Save to sessionStorage for persistence
        try {
          sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
          if (location.state.clientName) {
            sessionStorage.setItem('clientName', JSON.stringify(location.state.clientName));
          }
        } catch (error) {
          console.error("Failed to save client data to sessionStorage:", error);
        }
        
        setIsLoading(false);
        return;
      }
      
      // If not available in location, try sessionStorage
      try {
        const storedClientId = sessionStorage.getItem('clientId');
        const storedClientName = sessionStorage.getItem('clientName');
        
        if (storedClientId) {
          setClientId(JSON.parse(storedClientId));
          if (storedClientName) {
            setClientName(JSON.parse(storedClientName));
          }
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to retrieve state from sessionStorage:", error);
      }
      
      // If we get here, we couldn't get state from either source
      navigate('/', { replace: true });
    };
    
    loadState();
  }, [location, navigate]);

  // Load selected department from sessionStorage if available
  useEffect(() => {
    if (initialLoadRef.current && !isLoading) {
      try {
        const storedDepartment = sessionStorage.getItem('selectedDepartment');
        if (storedDepartment) {
          setSelectedDepartment(JSON.parse(storedDepartment));
        }
        initialLoadRef.current = false;
      } catch (error) {
        console.error("Failed to retrieve selected department from sessionStorage:", error);
      }
    }
  }, [isLoading]);

  // Fetch departments on component mount
  useEffect(() => {
    if (clientId) {
      setDepartmentsLoading(true);
      axiosInstance
        .post("/api/departments", { clientId })
        .then((response) => {
          console.log("Fetched departments:", response.data);
          setDepartments(response.data);
          setDepartmentsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching departments:", error);
          setError("Failed to load departments. Please try again later.");
          setDepartmentsLoading(false);
        });
    }
  }, [clientId]);

  // Fetch POCs when the selected department changes
  useEffect(() => {
    if (selectedDepartment && clientId) {
      setLoading(true);
      setPocs([]);
      
      // Save selected department to sessionStorage
      try {
        sessionStorage.setItem('selectedDepartment', JSON.stringify(selectedDepartment));
      } catch (error) {
        console.error("Failed to save selected department to sessionStorage:", error);
      }
      
      axiosInstance
        .post("/api/pocs", { departmentId: selectedDepartment, clientId })
        .then((response) => {
          console.log("Fetched POCs:", response.data);
          setPocs(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching POCs:", error);
          setError("Failed to load POCs. Please try again later.");
          setLoading(false);
        });
    }
  }, [selectedDepartment, clientId]);

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleViewAppointments = (pocId) => {
    // Pass all necessary state in navigation
    navigate(`/view-appointments/`, { 
      state: { 
        clientId, 
        pocId,
        clientName,
        // Include any other state you might need
      } 
    });
  };

  // Get department name from ID
  const getDepartmentName = (departmentId) => {
    const department = departments.find(
      (dept) => dept.departmentId.toString() === departmentId.toString()
    );
    return department ? department.Value_name : "";
  };

  if (isLoading) {
    return <div className="loading-state">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>;
  }

  return (
    <div className="departments-pocs-container">
      <h1>Doctor Directory</h1>

      {/* Department Selection */}
      <div className="dropdown-container">
        <label htmlFor="departments">
          {departmentsLoading ? "Loading departments..." : "Select Department:"}
        </label>
        <select
          id="departments"
          value={selectedDepartment}
          onChange={handleDepartmentChange}
          disabled={departmentsLoading}
        >
          <option value="" disabled>
            {departmentsLoading ? "Loading..." : "-- Select Department --"}
          </option>
          {departments.map((dept) => (
            <option key={dept.departmentId} value={dept.departmentId}>
              {dept.Value_name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* POC Details Table */}
      <div className="pocs-container">
        {selectedDepartment && (
          <>
            <h2>{getDepartmentName(selectedDepartment)} Specialists</h2>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading doctors...</p>
              </div>
            ) : pocs.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pocs.map((poc) => (
                    <tr key={poc.POC_ID}>
                      <td>{poc.POC_Name}</td>
                      <td>{poc.Specialization}</td>
                      <td>{poc.Contact_Number}</td>
                      <td>{poc.Email}</td>
                      <td>
                        <button
                          onClick={() => handleViewAppointments(poc.POC_ID)}
                          className="view-appointments"
                        >
                          View Appointments
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <i className="doctor-icon">👨‍⚕️</i>
                <p>No doctors found in this department.</p>
                <p className="secondary-text">Please try selecting a different department.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewPOC;