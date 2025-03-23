import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./styles/AddPOC.css";
import createAuthenticatedAxios from "../createAuthenticatedAxios";

export default function AddPOC() {
  const [currentStep, setCurrentStep] = useState(1);
  const [doctorDetails, setDoctorDetails] = useState({
    department: "",
    name: "",
    contactNumber: "",
    email: "",
    googleMeetLink: "",
    consultationFees: "",
    externalPOCId: "",
  });
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [pocId, setPocId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize with the value from location or null
  const [clientId, setClientId] = useState(() => {
    if (location.state && location.state.clientId) {
      return location.state.clientId;
    }
    
    // Try to get from sessionStorage
    try {
      const storedClientId = sessionStorage.getItem('clientId');
      return storedClientId ? JSON.parse(storedClientId) : null;
    } catch (error) {
      console.error("Failed to retrieve clientId from sessionStorage:", error);
      return null;
    }
  });
  
  const axiosInstance = createAuthenticatedAxios();

  // Redirect if clientId isn't available
  useEffect(() => {
    if (!clientId) {
      navigate('/', { replace: true });
    }
  }, [clientId, navigate]);

  useEffect(() => {
    // Fetch departments only when clientId is available and departments aren't loaded yet
    if (clientId && departments.length === 0) {
      setIsLoading(true);
      axiosInstance
        .post("/api/departments", { clientId })
        .then((response) => {
          setDepartments(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching departments:", error);
          setIsLoading(false);
        });
    }
  }, [clientId, departments.length, axiosInstance]);

  // Save clientId to sessionStorage when it changes
  useEffect(() => {
    if (clientId) {
      try {
        sessionStorage.setItem('clientId', JSON.stringify(clientId));
      } catch (error) {
        console.error("Failed to save clientId to sessionStorage:", error);
      }
    }
  }, [clientId]);

  const validate = () => {
    const newErrors = {};
    if (!doctorDetails.department) newErrors.department = "Department is required.";
    if (!doctorDetails.name) newErrors.name = "Name is required.";
    if (!/^\91\d{10}$/.test(doctorDetails.contactNumber))
      newErrors.contactNumber = "Contact number must start with 91 and have 10 digits.";
    if (!/\S+@\S+\.\S+/.test(doctorDetails.email))
      newErrors.email = "Email is invalid.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSave = () => {
    setIsLoading(true);
    // Call the API to save POC data
    const departmentName =
      departments.find(
        (d) => d.departmentId.toString() === doctorDetails.department.toString()
      )?.Value_name || "N/A";

    const consultationFees = parseFloat(doctorDetails.consultationFees);
    axiosInstance
      .post("/api/add-poc", {
        Client_ID: clientId,
        Department_ID: doctorDetails.department,
        POC_Name: doctorDetails.name,
        Specialization: departmentName,
        Contact_Number: doctorDetails.contactNumber,
        Email: doctorDetails.email,
        Meet_Link: doctorDetails.googleMeetLink || null,
        Consultation_Fees: isNaN(consultationFees) ? 0.0 : consultationFees.toFixed(2),
        External_POC_ID: doctorDetails.externalPOCId || null,
      })
      .then((response) => {
        const newPocId = response.data.pocId;
        setPocId(newPocId);
        
        // Save to sessionStorage for persistence
        try {
          sessionStorage.setItem('pocId', JSON.stringify(newPocId));
        } catch (error) {
          console.error("Failed to save pocId to sessionStorage:", error);
        }
        
        setIsLoading(false);
        setCurrentStep(3);
      })
      .catch((error) => {
        console.error("Error saving POC data:", error);
        alert("Failed to save POC data. Please try again.");
        setIsLoading(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      // Automatically prepend "Dr." if not already present
      setDoctorDetails({
        ...doctorDetails,
        name: value.startsWith("Dr. ") ? value : `Dr. ${value}`,
      });
    } else if (name === "contactNumber") {
      // Automatically prepend "91" if not already present
      setDoctorDetails({
        ...doctorDetails,
        contactNumber: value.startsWith("91") ? value : `91${value}`,
      });
    } else {
      setDoctorDetails({ ...doctorDetails, [name]: value });
    }
  };

  return (
    <div className="doctor-form-container">
      <header className="header bg-purple text-white">
        <div className="container d-flex justify-content-between">
          <h1>Doctor Management</h1>
        </div>
      </header>

      <main className="container my-4">
        <div className="step-indicator">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`step-circle ${
                currentStep >= step ? "bg-purple" : ""
              }`}
            >
              {step}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {currentStep === 1 && (
              <div className="form-section">
                <h2>Doctor Details</h2>
                <form>
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <select
                      name="department"
                      value={doctorDetails.department}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept.departmentId} value={dept.departmentId}>
                          {dept.Value_name}
                        </option>
                      ))}
                    </select>
                    {errors.department && <p className="text-danger">{errors.department}</p>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Doctor Name</label>
                    <input
                      type="text"
                      name="name"
                      value={doctorDetails.name}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Enter doctor's name"
                    />
                    {errors.name && <p className="text-danger">{errors.name}</p>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Contact Number</label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={doctorDetails.contactNumber}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="91XXXXXXXXXX"
                    />
                    {errors.contactNumber && (
                      <p className="text-danger">{errors.contactNumber}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={doctorDetails.email}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="doctor@example.com"
                    />
                    {errors.email && <p className="text-danger">{errors.email}</p>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Google Meet Link (Optional)</label>
                    <input
                      type="url"
                      name="googleMeetLink"
                      value={doctorDetails.googleMeetLink}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Consultation Fees (Optional)</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        name="consultationFees"
                        value={doctorDetails.consultationFees}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">External POC ID (Optional)</label>
                    <input
                      type="text"
                      name="externalPOCId"
                      value={doctorDetails.externalPOCId}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Enter external ID"
                    />
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button type="button" className="btn btn-next" onClick={handleNext}>
                      Next
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentStep === 2 && (
              <div className="confirmation-section">
                <h2>Confirm Details</h2>
                <div className="card">
                  <p>
                    <strong>Department:</strong>
                    <span>
                      {
                        departments.find(
                          (d) => d.departmentId.toString() === doctorDetails.department.toString()
                        )?.Value_name || "N/A"
                      }
                    </span>
                  </p>
                  <p>
                    <strong>Doctor Name:</strong>
                    <span>{doctorDetails.name}</span>
                  </p>
                  <p>
                    <strong>Contact Number:</strong>
                    <span>{doctorDetails.contactNumber}</span>
                  </p>
                  <p>
                    <strong>Email Address:</strong>
                    <span>{doctorDetails.email}</span>
                  </p>
                  <p>
                    <strong>Google Meet Link:</strong>
                    <span>{doctorDetails.googleMeetLink || "Not Provided"}</span>
                  </p>
                  <p>
                    <strong>Consultation Fees:</strong>
                    <span>
                      {doctorDetails.consultationFees
                        ? `₹${doctorDetails.consultationFees}`
                        : "Not Provided"}
                    </span>
                  </p>
                  <p>
                    <strong>External POC ID:</strong>
                    <span>{doctorDetails.externalPOCId || "Not Provided"}</span>
                  </p>
                </div>
                <div className="d-flex justify-content-between mt-4">
                  <button className="btn btn-secondary" onClick={handlePrevious}>
                    Previous
                  </button>
                  <button className="btn btn-success" onClick={handleSave}>
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="success-section">
                <div className="success-icon">✓</div>
                <h2 className="text-success">Doctor Added Successfully!</h2>
                <h5>Click the below button to update the POC's Schedule</h5>
                <div className="text-center">
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => {
                      // Pass both pocId and clientId to maintain state persistence
                      navigate("/update-schedule", { 
                        state: { 
                          pocId: pocId,
                          clientId: clientId
                        } 
                      });
                    }}
                  >
                    Update Schedule
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}