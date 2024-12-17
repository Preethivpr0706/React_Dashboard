import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewPOC.css";

const ViewPOC = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [pocs, setPocs] = useState([]);
  const navigate = useNavigate();

  // Fetch departments on component mount
  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched departments:", data);
        setDepartments(data);
      })
      .catch((error) => console.error("Error fetching departments:", error));
  }, []);

  // Fetch POCs when the selected department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetch(`/api/pocs/${selectedDepartment}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Fetched POCs:", data);
          setPocs(data);
        })
        .catch((error) => console.error("Error fetching POCs:", error));
    }
  }, [selectedDepartment]);

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleViewAppointments = (pocId) => {
    navigate(`/view-appointments/${pocId}`);
  };

  return (
    <div className="departments-pocs-container">
      <h1>Departments and POCs</h1>

      {/* Drop-down for Departments */}
      <div className="dropdown-container">
        <label htmlFor="departments">Select a Department:</label>
        <select
          id="departments"
          value={selectedDepartment}
          onChange={handleDepartmentChange}
        >
          <option value="" disabled>
            -- Select Department --
          </option>
          {departments.map((dept) => (
            <option key={dept.departmentId} value={dept.departmentId}>
              {dept.Value_name}
            </option>
          ))}
        </select>
      </div>

      {/* Table for POC Details */}
      <div className="pocs-container">
        {selectedDepartment && (
          <>
            <h2>POCs in Department</h2>
            {pocs.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>POC Name</th>
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
              <p>No POCs found in this department.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewPOC;
