import React, { useState, useEffect } from "react";  
import { useNavigate, useLocation } from "react-router-dom";  
import axios from "axios";  
import './styles/AddAppointment.css'
import createAuthenticatedAxios from "../createAuthenticatedAxios";
const AddNewAppointment = () => {  
  const [currentStep, setCurrentStep] = useState(1);  
  const [appointmentData, setAppointmentData] = useState({  
   name: "",  
   phone: "",  
   email: "",  
   location: "",  
   type: "",  
   department: "",  
   doctor: "",  
   date: "",  
   time: "",  
  });  
  const [isConfirmed, setIsConfirmed] = useState(false);  
  const [departments, setDepartments] = useState([]);  
  const [pocs, setPocs] = useState([]);  
  const [availableDates, setAvailableDates] = useState([]);  
  const [availableTimes, setAvailableTimes] = useState([]);  
  const [errors, setErrors] = useState({});  
  const navigate = useNavigate();  
  const location = useLocation();  
  const clientId = location.state.clientId; 
  const clientName = location.state?.clientName || null;
  const [appointmentId, setAppointmentID] = useState(0);  

  useEffect(() => {
    // Set the background color when the component is mounted
    document.body.style.background = "linear-gradient(135deg, #f5f7fa, #c3cfe2)";

    // Cleanup when the component is unmounted or navigation happens
    return () => {
      document.body.style.background = "";
    };
  }, []);
  
  useEffect(() => {  
    const axiosInstance = createAuthenticatedAxios();
    axiosInstance   
    .post("/api/departments", { clientId })  
    .then((response) => setDepartments(response.data))  
    .catch((error) => console.error("Error fetching departments:", error));  
  }, []);  
  
  const validateStep = () => {  
   const stepErrors = {};  
  
   if (currentStep === 1) {  
    if (!appointmentData.name) stepErrors.name = "Name is required.";  
    if (!appointmentData.phone) stepErrors.phone = "Phone is required.";  
    if (!appointmentData.email) stepErrors.email = "Email is required.";  
    if (!appointmentData.location) stepErrors.location = "Location is required.";  
   }  
  
   if (currentStep === 2) {  
    if (!appointmentData.type) stepErrors.type = "Appointment type is required.";  
   }  
  
   if (currentStep === 3) {  
    if (!appointmentData.department) stepErrors.department = "Department is required.";  
    if (!appointmentData.doctor) stepErrors.doctor = "Doctor is required.";  
   }  
  
   if (currentStep === 4) {  
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
   setAppointmentData({  
    ...appointmentData,  
    [e.target.name]: e.target.value,  
   });  
  };  
  
  const handleDepartmentChange = (e) => {  
   const departmentId = e.target.value;  
   setAppointmentData({  
    ...appointmentData,  
    department: departmentId,  
    doctor: "",  
   });  
  
   const axiosInstance = createAuthenticatedAxios();
   axiosInstance   
    .post("/api/pocs", { departmentId, clientId })  
    .then((response) => setPocs(response.data))  
    .catch((error) => console.error("Error fetching POCs:", error));  
  };  
  
  const handleDoctorChange = (e) => {  
   const pocId = e.target.value;  
   setAppointmentData({  
    ...appointmentData,  
    doctor: pocId,  
   });  
  
   const axiosInstance = createAuthenticatedAxios();
   axiosInstance    
    .post("/api/pocs/available-dates", { pocId })  
    .then((response) => setAvailableDates(response.data))  
    .catch((error) => console.error("Error fetching available dates:", error));  
  };  
  
  const handleDateChange = (e) => {  
   const selectedDate = e.target.value;  
   setAppointmentData({  
    ...appointmentData,  
    date: selectedDate,  
   });  
  
   const axiosInstance = createAuthenticatedAxios();
   axiosInstance   
    .post("/api/pocs/available-times", {  
      pocId: appointmentData.doctor,  
      date: selectedDate,   
    })  
    .then((response) => setAvailableTimes(response.data))  
    .catch((error) => console.error("Error fetching available times:", error));  
  };  
  
  const handleConfirm = () => { 
    let phoneNumber = appointmentData.phone.replace(/\D/g, "");

    if (!phoneNumber.startsWith("91")) {
      if (phoneNumber.length === 10) {
        phoneNumber = "91" + phoneNumber;
      }
    }
    const axiosInstance = createAuthenticatedAxios();
    axiosInstance  
      .post("/api/users", {
        name: appointmentData.name,
        phone: phoneNumber,
        email: appointmentData.email,
        location: appointmentData.location,
        clientId: clientId,
      })  
      .then((response) => {  
        const userId = response.data.userId;  
    
        return axiosInstance.post("/api/create-appointments", {  
        userId: userId,  
        pocId: appointmentData.doctor,  
        date: appointmentData.date,  
        time: appointmentData.time,  
        type: appointmentData.type,  
        clientId,  
        });  
      })  
      .then((response) => {  
        setAppointmentID(response.data.appointmentId); 
        setIsConfirmed(true);  
      })  
      .catch((error) => console.error("Error confirming appointment:", error));  
  };  
  
  const handleBackToDashboard = () => {  
   navigate("/admin-dashboard", { state: { clientId, clientName } });  
  };  
  
 

  const departmentName =  
   departments.find(  
    (d) => String(d.departmentId) === String(appointmentData.department)  
   )?.Value_name || "N/A";  
  const pocName =  
   pocs.find((p) => String(p.POC_ID) === String(appointmentData.doctor))  
    ?.POC_Name || "N/A";  
  
  // Function to generate step titles for the indicators
  const getStepTitle = (step) => {
    switch(step) {
      case 1: return "Patient";
      case 2: return "Type";
      case 3: return "Provider";
      case 4: return "Timing";
      case 5: return "Confirm";
      default: return "";
    }
  };

  return (
    <div className="appointment-container-add">
      {!isConfirmed && (
        <>
          <h2>Schedule Appointment</h2>
          <div className="step-indicator">
            {[1, 2, 3, 4, 5].map((step) => (
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

      {currentStep === 1 && !isConfirmed && (
        <div>
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

          <label>Phone Number</label>
          <input
            type="text"
            name="phone"
            className="form-control"
            placeholder="10-digit mobile number"
            value={appointmentData.phone}
            onChange={handleInputChange}
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}

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

      {currentStep === 2 && !isConfirmed && (
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

      {currentStep === 3 && !isConfirmed && (
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

      {currentStep === 4 && !isConfirmed && (
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

      {currentStep === 5 && !isConfirmed && (
        <div>
          <div className="summary-section">
            <h3>Appointment Summary</h3>
            <p><strong>Patient:</strong> <span>{appointmentData.name}</span></p>
            <p><strong>Contact:</strong> <span>{appointmentData.phone}</span></p>
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

      {isConfirmed && (
        <div className="confirmation-screen">
          <div className="confirmation-checkmark"></div>
          <h3>Appointment Confirmed!</h3>
          <p>The appointment has been successfully scheduled.</p>
          <div className="confirmation-id">
            Appointment ID: {appointmentId}
          </div>
          <button className="btn btn-success" onClick={handleBackToDashboard}>
            Return to Dashboard
          </button>
        </div>
      )}

      {!isConfirmed && (
        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button className="btn btn-secondary" onClick={handlePrevious}>
              Back
            </button>
          )}
          {currentStep < 5 && (
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