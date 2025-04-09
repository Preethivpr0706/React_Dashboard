import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import './styles/AddAppointment.css';
import createAuthenticatedAxios from "../createAuthenticatedAxios";
import { useProtectedState } from "../StatePersistence";

const AddNewAppointment = () => {
  // Use protected state management for navigation data
  const { isLoaded, state } = useProtectedState(useLocation(), ['clientId', 'clientName']);
  const navigate = useNavigate();
  
  // Destructure state values once loaded
  const clientId = isLoaded ? state.clientId : null;
  const clientName = isLoaded ? state.clientName : null;
  
  // Regular component state
  const [currentStep, setCurrentStep] = useState(1);
  const [userExists, setUserExists] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    name: "",
    countryCode: "91", // Default country code for India
    phone: "",
    email: "",
    location: "",
    type: "",
    department: "",
    doctor: "",
    date: "",
    time: "",
    paymentStatus: "",
    userId: null, // Store user ID if found
  });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [pocs, setPocs] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [errors, setErrors] = useState({});
  const [appointmentId, setAppointmentID] = useState(0);
  const [isPaid, setIsPaid] = useState(false); // Track if payment was made
  const [isVerifying, setIsVerifying] = useState(false); // Loading state for verification

  // List of common country codes
  const countryCodes = [
    { code: "1", country: "United States/Canada" },
    { code: "44", country: "United Kingdom" },
    { code: "61", country: "Australia" },
    { code: "91", country: "India" },
    { code: "86", country: "China" },
    { code: "49", country: "Germany" },
    { code: "33", country: "France" },
    { code: "81", country: "Japan" },
    { code: "65", country: "Singapore" },
    { code: "971", country: "UAE" },
    { code: "92", country: "Pakistan" },
    { code: "880", country: "Bangladesh" },
    { code: "94", country: "Sri Lanka" },
    { code: "977", country: "Nepal" },
  ];

  // Check if state is loaded, if not, redirect to home
  useEffect(() => {
    if (!isLoaded) {
      // Wait to ensure state isn't still loading
      const timer = setTimeout(() => {
        if (!isLoaded) {
          navigate('/', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, navigate]);

  // Set background style
  useEffect(() => {
    document.body.style.background = "linear-gradient(135deg, #f5f7fa, #c3cfe2)";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  // Fetch departments when clientId is available
  useEffect(() => {
    if (!clientId) return;
    
    const fetchDepartments = async () => {
      try {
        const axiosInstance = createAuthenticatedAxios();
        const response = await axiosInstance.post("/api/departments", { clientId });
        setDepartments(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, [clientId]);

  // Verify phone number against database
  const verifyPhoneNumber = async () => {
    // Validate phone number before verification
    if (!appointmentData.phone) {
      setErrors({
        ...errors,
        phone: "Phone number is required."
      });
      return;
    } else if (!/^\d+$/.test(appointmentData.phone)) {
      setErrors({
        ...errors,
        phone: "Phone number should contain only digits."
      });
      return;
    } else if (appointmentData.phone.length !== 10) {
      setErrors({
        ...errors,
        phone: "Phone number must be 10 digits."
      });
      return;
    }

    setIsVerifying(true);
    try {
      const axiosInstance = createAuthenticatedAxios();
      const formattedPhone = appointmentData.countryCode + appointmentData.phone;
      
      const response = await axiosInstance.post("/api/verify-user", { 
        phone: formattedPhone,
        clientId: clientId 
      });
      
      if (response.data.exists) {
        // User exists, pre-populate their data
        setUserExists(true);
        setAppointmentData({
          ...appointmentData,
          userId: response.data.userId,
          name: response.data.name || "",
          email: response.data.email || "",
          location: response.data.location || ""
        });
      } else {
        // New user
        setUserExists(false);
      }
      
      setPhoneVerified(true);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error verifying phone number:", error);
      setErrors({
        ...errors,
        phone: "Could not verify phone number. Please try again."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const validateStep = () => {
    const stepErrors = {};

    // Phone verification is done separately
    
    // User information step
    if (currentStep === 2 && !userExists) {
      if (!appointmentData.name) stepErrors.name = "Name is required.";
      if (!appointmentData.email) {
        stepErrors.email = "Email is required.";
      } else if (!/\S+@\S+\.\S+/.test(appointmentData.email)) {
        stepErrors.email = "Please enter a valid email address.";
      }
      if (!appointmentData.location) stepErrors.location = "Location is required.";
    }

    // Appointment type step
    if (currentStep === 3) {
      if (!appointmentData.type) stepErrors.type = "Appointment type is required.";
    }

    // Department and doctor step
    if (currentStep === 4) {
      if (!appointmentData.department) stepErrors.department = "Department is required.";
      if (!appointmentData.doctor) stepErrors.doctor = "Doctor is required.";
    }

    // Date and time step
    if (currentStep === 5) {
      if (!appointmentData.date) stepErrors.date = "Date is required.";
      if (!appointmentData.time) stepErrors.time = "Time is required.";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Real-time validation for phone field
    if (name === 'phone') {
      // Only allow digits
      const onlyDigits = value.replace(/\D/g, "");
      
      setAppointmentData({
        ...appointmentData,
        [name]: onlyDigits,
      });
      
      // Clear error when typing
      if (errors.phone) {
        setErrors({
          ...errors,
          phone: ""
        });
      }
    } else {
      setAppointmentData({
        ...appointmentData,
        [name]: value,
      });
      
      // Clear error when typing for other fields
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: ""
        });
      }
    }
  };

  const handleDepartmentChange = async (e) => {
    const departmentId = e.target.value;
    setAppointmentData({
      ...appointmentData,
      department: departmentId,
      doctor: "",
    });

    try {
      const axiosInstance = createAuthenticatedAxios();
      const response = await axiosInstance.post("/api/pocs", { departmentId, clientId });
      setPocs(response.data);
    } catch (error) {
      console.error("Error fetching POCs:", error);
    }
  };

  const handleDoctorChange = async (e) => {
    const pocId = e.target.value;
    setAppointmentData({
      ...appointmentData,
      doctor: pocId,
    });

    try {
      const axiosInstance = createAuthenticatedAxios();
      const response = await axiosInstance.post("/api/pocs/available-dates", { pocId });
      setAvailableDates(response.data);
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setAppointmentData({
      ...appointmentData,
      date: selectedDate,
    });

    try {
      const axiosInstance = createAuthenticatedAxios();
      const response = await axiosInstance.post("/api/pocs/available-times", {
        pocId: appointmentData.doctor,
        date: selectedDate,
      });
      setAvailableTimes(response.data);
    } catch (error) {
      console.error("Error fetching available times:", error);
    }
  };

  // Handle payment status selection
  const handlePayment = (status) => {
    setAppointmentData({
      ...appointmentData,
      paymentStatus: status
    });
    
    // Create appointment with payment status
    createAppointmentWithPayment(status);
  };

  // Create appointment with payment status
  const createAppointmentWithPayment = async (paymentStatus) => {
    let phoneNumber = appointmentData.phone.replace(/\D/g, "");
    const countryCode = appointmentData.countryCode;
    
    // Format phone number with country code
    const formattedPhone = countryCode + phoneNumber;

    // Validate phone number
    if (!phoneNumber || phoneNumber.length !== 10) {
      console.error("Invalid phone number");
      setErrors({
        ...errors,
        phone: "Phone number must be 10 digits"
      });
      setCurrentStep(1);
      return;
    }
    
    try {
      const axiosInstance = createAuthenticatedAxios();
      
      let userId = appointmentData.userId;
      
      // If no userId exists yet, create/update user
      if (!userId) {
        const userResponse = await axiosInstance.post("/api/users", {
          name: appointmentData.name,
          phone: formattedPhone,
          email: appointmentData.email,
          location: appointmentData.location,
          clientId: clientId,
        });
        
        userId = userResponse.data.userId;
      }
      
      // Create appointment
      const appointmentResponse = await axiosInstance.post("/api/create-appointments", {
        userId: userId,
        pocId: appointmentData.doctor,
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type,
        paymentStatus: paymentStatus,
        clientId,
      });
      
      setAppointmentID(appointmentResponse.data.appointmentId);
      setIsPaid(paymentStatus === "Paid");
      setIsConfirmed(true);
    } catch (error) {
      console.error("Error confirming appointment:", error);
      alert("There was an error creating the appointment. Please try again.");
    }
  };

  const handleConfirm = () => {
    // For returning users, revalidate name, email and location
    if (userExists && (!appointmentData.name || !appointmentData.email || !appointmentData.location)) {
      const userErrors = {};
      if (!appointmentData.name) userErrors.name = "Name is required.";
      if (!appointmentData.email) userErrors.email = "Email is required.";
      if (!appointmentData.location) userErrors.location = "Location is required.";
      
      if (Object.keys(userErrors).length > 0) {
        setErrors(userErrors);
        setCurrentStep(2);
        return;
      }
    }
    
    // Validate appointment steps
    let isValid = true;
    
    if (!appointmentData.type) isValid = false;
    if (!appointmentData.department || !appointmentData.doctor) isValid = false;
    if (!appointmentData.date || !appointmentData.time) isValid = false;
    
    // If errors, alert the user
    if (!isValid) {
      alert("Please complete all required fields before confirming.");
      return;
    }
    
    // If all valid, proceed to payment
    setCurrentStep(7);
  };

  const handleBackToDashboard = () => {
    navigate("/admin-dashboard", { state: { clientId, clientName } });
  };

  // Derived values
  const departmentName = departments.find(
    (d) => String(d.departmentId) === String(appointmentData.department)
  )?.Value_name || "N/A";
  
  const pocName = pocs.find(
    (p) => String(p.POC_ID) === String(appointmentData.doctor)
  )?.POC_Name || "N/A";

  // Function to generate step titles for the indicators
  const getStepTitle = (step) => {
    switch(step) {
      case 1: return "Phone";
      case 2: return "Details";
      case 3: return "Type";
      case 4: return "Provider";
      case 5: return "Timing";
      case 6: return "Confirm";
      case 7: return "Payment";
      default: return "";
    }
  };

  // Calculate the total number of steps based on user exists status
  const totalSteps = 7;

  // Show loading state while state is loading
  if (!isLoaded) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="appointment-container-add">
      {!isConfirmed && (
        <>
          <h2>Schedule Appointment</h2>
          <div className="step-indicator">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div 
                key={step} 
                className={`step ${currentStep >= step ? "active" : ""}`}
                data-title={getStepTitle(step)}
              >
                {step}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Step 1: Phone Verification */}
      {currentStep === 1 && !isConfirmed && (
        <div>
          <h3>Enter Patient's Phone Number</h3>
          <p>Please enter the patient's phone number to check if they already exist in our system.</p>
          
          <div className="phone-input-container">
            <select
              name="countryCode"
              className="country-code-select"
              value={appointmentData.countryCode}
              onChange={handleInputChange}
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  +{country.code} ({country.country})
                </option>
              ))}
            </select>
            <input
              type="text"
              name="phone"
              className="phone-input"
              placeholder="10-digit mobile number"
              value={appointmentData.phone}
              onChange={handleInputChange}
              maxLength={10}
            />
          </div>
          {errors.phone && <span className="error-text">{errors.phone}</span>}
          
          <button 
            className="btn btn-primary" 
            onClick={verifyPhoneNumber}
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying..." : "Verify Phone Number"}
          </button>
        </div>
      )}

      {/* Step 2: User Details (for new users or returning users to confirm/edit) */}
      {currentStep === 2 && !isConfirmed && (
        <div>
          {userExists ? (
            <div className="existing-user-banner">
              <div className="icon-check"></div>
              <p>Welcome back! We found your details. Please verify or update them.</p>
            </div>
          ) : (
            <h3>Enter Patient Details</h3>
          )}
          
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Enter patient's full name"
            value={appointmentData.name}
            onChange={handleInputChange}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}

          <label>Email Address</label>
          <input
            type="email"
            name="email"
            className="form-control"
            placeholder="email@example.com"
            value={appointmentData.email}
            onChange={handleInputChange}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}

          <label>Location</label>
          <input
            type="text"
            name="location"
            className="form-control"
            placeholder="City, State"
            value={appointmentData.location}
            onChange={handleInputChange}
          />
          {errors.location && <span className="error-text">{errors.location}</span>}
        </div>
      )}

      {/* Step 3: Appointment Type */}
      {currentStep === 3 && !isConfirmed && (
        <div>
          <label>Appointment Type</label>
          <select
            name="type"
            className="form-control"
            value={appointmentData.type}
            onChange={handleInputChange}
          >
            <option value="">Select appointment type</option>
            <option value="Direct Consultation">Direct Consultation</option>
            <option value="Tele Consultation">Tele Consultation</option>
          </select>
          {errors.type && <span className="error-text">{errors.type}</span>}
        </div>
      )}

      {/* Step 4: Department and Doctor Selection */}
      {currentStep === 4 && !isConfirmed && (
        <div>
          <label>Department</label>
          <select
            name="department"
            className="form-control"
            value={appointmentData.department}
            onChange={handleDepartmentChange}
          >
            <option value="">Select medical department</option>
            {departments.map((department) => (
              <option key={department.departmentId} value={department.departmentId}>
                {department.Value_name}
              </option>
            ))}
          </select>
          {errors.department && <span className="error-text">{errors.department}</span>}

          <label>Doctor</label>
          <select
            name="doctor"
            className="form-control"
            value={appointmentData.doctor}
            onChange={handleDoctorChange}
            disabled={!appointmentData.department}
          >
            <option value="">Select doctor</option>
            {pocs.map((poc) => (
              <option key={poc.POC_ID} value={poc.POC_ID}>
                {poc.POC_Name}
              </option>
            ))}
          </select>
          {errors.doctor && <span className="error-text">{errors.doctor}</span>}
        </div>
      )}

      {/* Step 5: Date and Time Selection */}
      {currentStep === 5 && !isConfirmed && (
        <div>
          <label>Appointment Date</label>
          <select
            name="date"
            className="form-control"
            value={appointmentData.date}
            onChange={handleDateChange}
          >
            <option value="">Select available date</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          {errors.date && <span className="error-text">{errors.date}</span>}

          <label>Appointment Time</label>
          <select
            name="time"
            className="form-control"
            value={appointmentData.time}
            onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
            disabled={!appointmentData.date}
          >
            <option value="">Select available time</option>
            {availableTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {errors.time && <span className="error-text">{errors.time}</span>}
        </div>
      )}

      {/* Step 6: Confirmation */}
      {currentStep === 6 && !isConfirmed && (
        <div>
          <div className="summary-section">
            <h3>Appointment Summary</h3>
            <p><strong>Patient:</strong> <span>{appointmentData.name}</span></p>
            <p><strong>Contact:</strong> <span>+{appointmentData.countryCode} {appointmentData.phone}</span></p>
            <p><strong>Email:</strong> <span>{appointmentData.email}</span></p>
            <p><strong>Location:</strong> <span>{appointmentData.location}</span></p>
            <p><strong>Appointment Type:</strong> <span>{appointmentData.type}</span></p>
            <p><strong>Department:</strong> <span>{departmentName}</span></p>
            <p><strong>Doctor:</strong> <span>{pocName}</span></p>
            <p><strong>Date:</strong> <span>{appointmentData.date}</span></p>
            <p><strong>Time:</strong> <span>{appointmentData.time}</span></p>
          </div>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirm Appointment
          </button>
        </div>
      )}

      {/* Step 7: Payment Options */}
      {currentStep === 7 && !isConfirmed && (
        <div className="payment-options">
          <h3>Payment Options</h3>
          <p>Please select a payment option to complete the appointment booking:</p>
          
          <div className="payment-buttons">
            <button className="btn btn-success" onClick={() => handlePayment("Paid")}>
              Pay Now
            </button>
            <button className="btn btn-secondary" onClick={() => handlePayment("Pay_later")}>
              Pay Later
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Screen */}
      {isConfirmed && (
        <div className="confirmation-screen">
          <div className="confirmation-checkmark"></div>
          <h3>Appointment Confirmed!</h3>
          <p>The appointment has been successfully scheduled.</p>
          <div className="confirmation-id">
            Appointment ID: {appointmentId}
          </div>
          <div className="payment-status">
            Payment Status: <span className={isPaid ? "paid-status" : "pay-later-status"}>
              {isPaid ? "Paid" : "Pay Later"}
            </span>
          </div>
          <button className="btn btn-success" onClick={handleBackToDashboard}>
            Return to Dashboard
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      {!isConfirmed && currentStep !== 1 && (
        <div className="navigation-buttons">
          {currentStep > 1 && currentStep !== 7 && (
            <button className="btn btn-secondary" onClick={handlePrevious}>
              Back
            </button>
          )}
          {currentStep < 6 && (
            <button className="btn btn-primary" onClick={handleNext}>
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AddNewAppointment;