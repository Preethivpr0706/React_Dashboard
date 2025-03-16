import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./styles/ViewPOC.css";
import createAuthenticatedAxios from "../createAuthenticatedAxios";

const ViewPOC = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [pocs, setPocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const clientId = location.state?.clientId;
  const clientName = location.state?.clientName || "Client";

  const axiosInstance = createAuthenticatedAxios();

  // Removed the gradient background effect
  // No need for the body background style manipulation

  // Fetch departments on component mount
  useEffect(() => {
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
  }, [clientId]);

  // Fetch POCs when the selected department changes
  useEffect(() => {
    if (selectedDepartment) {
      setLoading(true);
      setPocs([]);
      
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
    navigate(`/view-appointments/`, { state: { clientId, pocId } });
  };

  // Get department name from ID
  const getDepartmentName = (departmentId) => {
    const department = departments.find(
      (dept) => dept.departmentId.toString() === departmentId.toString()
    );
    return department ? department.Value_name : "";
  };

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