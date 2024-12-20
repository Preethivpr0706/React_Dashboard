import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./AddPOC.css";

const AddPOC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [pocData, setPocData] = useState({
    department: "",
    name: "",
    contact: "",
    email: "",
    meetLink: "",
  });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const clientId = location.state.clientId;
  useEffect(() => {
      // Set the background color when the component is mounted
      document.body.style.backgroundColor = " #80bdff";
  
      // Cleanup when the component is unmounted or navigation happens
      return () => {
        document.body.style.backgroundColor = "";
      };
    }, []);

  useEffect(() => {
    axios
      .post("/api/departments", { clientId })
      .then((response) => setDepartments(response.data))
      .catch((error) => console.error("Error fetching departments:", error));
  }, [clientId]);

  const validateStep = () => {
    const stepErrors = {};

    if (currentStep === 1 && !pocData.department) {
      stepErrors.department = "Department is required.";
    }

    if (currentStep === 2) {
      if (!pocData.name) stepErrors.name = "POC name is required.";
      if (!pocData.contact) stepErrors.contact = "Contact number is required.";
      if (!pocData.email) stepErrors.email = "Email is required.";
      if (!pocData.meetLink) stepErrors.meetLink = "Meet link is required.";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    if (name === "name") {
      const formattedName = pocData[name].startsWith("Dr. ") ? value : `Dr. ${value}`;
      setPocData({
        ...pocData,
        [name]: formattedName,
      });
    } else {
      setPocData({
        ...pocData,
        [name]: value,
      });
    }
  };

  const handleConfirm = () => {
    const departmentName =
      departments.find(
        (d) => d.departmentId.toString() === pocData.department.toString()
      )?.Value_name || "N/A";

    axios
      .post("/api/add-poc", {
        Client_ID: clientId,
        Department_ID: pocData.department,
        POC_Name: pocData.name,
        Specialization: departmentName,
        Contact_Number: pocData.contact,
        Email: pocData.email,
        Meet_Link: pocData.meetLink,
      })
      .then((response) => {
        setIsConfirmed(true);
      })
      .catch((error) => {
        console.error("Error adding POC:", error);
      });
  };

  const handleBackToDashboard = () => {
    navigate("/admin-dashboard", { state: { clientId } });
  };

  const departmentName =
    departments.find(
      (d) => d.departmentId.toString() === pocData.department.toString()
    )?.Value_name || "N/A";

  return (
    <div className="poc-container">
      {/* Hide the heading if the form is confirmed */}
      {!isConfirmed && <h2>Add New POC</h2>}

      {/* Show step indicators only if not confirmed */}
      {!isConfirmed && (
        <div className="step-indicator">
          <div className={`step ${currentStep === 1 ? "active" : ""}`}>
            Step 1
          </div>
          <div className={`step ${currentStep === 2 ? "active" : ""}`}>
            Step 2
          </div>
          <div className={`step ${currentStep === 3 ? "active" : ""}`}>
            Step 3
          </div>
        </div>
      )}

      {isConfirmed ? (
        <div>
          <h2>POC Successfully Created!</h2>
          <p>
            <strong>Department:</strong> {departmentName}
          </p>
          <p>
            <strong>Name:</strong> {pocData.name}
          </p>
          <p>
            <strong>Contact:</strong> {pocData.contact}
          </p>
          <p>
            <strong>Email:</strong> {pocData.email}
          </p>
          <p>
            <strong>Meet Link:</strong> {pocData.meetLink}
          </p>
          <button className="btn btn-primary" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          {currentStep === 1 && (
            <div>
              <label>Department:</label>
              <select
                name="department"
                className="form-control"
                value={pocData.department}
                onChange={handleInputChange}
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department.departmentId} value={department.departmentId}>
                    {department.Value_name}
                  </option>
                ))}
              </select>
              {errors.department && <p className="error-text">{errors.department}</p>}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <label>POC Name:</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={pocData.name}
                onChange={handleInputChange}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}

              <label>Contact Number:</label>
              <input
                type="text"
                name="contact"
                className="form-control"
                value={pocData.contact}
                onChange={handleInputChange}
              />
              {errors.contact && <p className="error-text">{errors.contact}</p>}

              <label>Email:</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={pocData.email}
                onChange={handleInputChange}
              />
              {errors.email && <p className="error-text">{errors.email}</p>}

              <label>Meet Link:</label>
              <input
                type="text"
                name="meetLink"
                className="form-control"
                value={pocData.meetLink}
                onChange={handleInputChange}
              />
              {errors.meetLink && <p className="error-text">{errors.meetLink}</p>}
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h4>Confirm Details</h4>
              <p>
                <strong>Department:</strong> {departmentName}
              </p>
              <p>
                <strong>Name:</strong> {pocData.name}
              </p>
              <p>
                <strong>Contact:</strong> {pocData.contact}
              </p>
              <p>
                <strong>Email:</strong> {pocData.email}
              </p>
              <p>
                <strong>Meet Link:</strong> {pocData.meetLink}
              </p>
              <button className="btn btn-success" onClick={handleConfirm}>
                Confirm
              </button>
            </div>
          )}
        </>
      )}

      {/* Show navigation buttons (Previous/Next) only if not confirmed */}
      {!isConfirmed && (
        <div className="navigation-buttons">
          {currentStep > 1 && currentStep <= 3 && (
            <button className="btn btn-secondary" onClick={handlePrevious}>
              Previous
            </button>
          )}
          {currentStep <= 2 && (
            <button className="btn btn-primary" onClick={handleNext}>
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AddPOC;
