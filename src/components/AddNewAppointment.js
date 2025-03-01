import React, { useState, useEffect } from "react";  
import { useNavigate, useLocation } from "react-router-dom";  
import axios from "axios";  
import "./styles/AddAppointment.css";  
  
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
    document.body.style.background = "linear-gradient(135deg, #6e8efb, #a777e3)";

    // Cleanup when the component is unmounted or navigation happens
    return () => {
      document.body.style.background = "";
    };
  }, []);

  
  useEffect(() => {  
   axios  
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
  
   axios  
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
  
   axios  
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
  
   axios  
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

  axios
    .post("/api/users", {
      name: appointmentData.name,
      phone: phoneNumber,
      email: appointmentData.email,
      location: appointmentData.location,
      clientId: clientId,
    })  
    .then((response) => {  
      const userId = response.data.userId;  
  
      return axios.post("/api/create-appointments", {  
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
   navigate("/admin-dashboard", { state: { clientId,clientName } });  
  };  
  
  const handleBackButton = () => {  
    navigate("/back-button", { state: { clientId, clientName } });  
   }; 
  const departmentName =  
   departments.find(  
    (d) => String(d.departmentId) === String(appointmentData.department)  
   )?.Value_name || "N/A";  
  const pocName =  
   pocs.find((p) => String(p.POC_ID) === String(appointmentData.doctor))  
    ?.POC_Name || "N/A";  
  
    return (
      <>
      {/* <BackButton onClick={handleBackButton}/> */}
        <div className="appointment-container">
          {/* Only show heading and step indicators if the appointment is not confirmed */}
          {!isConfirmed && (
            <>
              <h2>Add New Appointment</h2>
              <div className="step-indicator">
                <div className={`step ${currentStep >= 1 ? "active" : ""}`}>Step 1</div>
                <div className={`step ${currentStep >= 2 ? "active" : ""}`}>Step 2</div>
                <div className={`step ${currentStep >= 3 ? "active" : ""}`}>Step 3</div>
                <div className={`step ${currentStep >= 4 ? "active" : ""}`}>Step 4</div>
                <div className={`step ${currentStep >= 5 ? "active" : ""}`}>Step 5</div>
              </div>
            </>
          )}
    
          {/* Appointment form steps */}
          {currentStep === 1 && !isConfirmed && (
            <div>
              {/* Step 1: Collecting personal info */}
              <label>Name:</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Enter Name"
                value={appointmentData.name}
                onChange={handleInputChange}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
    
              <label>Phone:</label>
              <input
                type="text"
                name="phone"
                className="form-control"
                placeholder="Enter Contact number (without country code, e.g., 976742101)"
                value={appointmentData.phone}
                onChange={handleInputChange}
              />
              {errors.phone && <p className="error-text">{errors.phone}</p>}
    
              <label>Email:</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter Email-ID"
                value={appointmentData.email}
                onChange={handleInputChange}
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
    
              <label>Location:</label>
              <input
                type="text"
                name="location"
                className="form-control"
                placeholder="Enter Location"
                value={appointmentData.location}
                onChange={handleInputChange}
              />
              {errors.location && <p className="error-text">{errors.location}</p>}
            </div>
          )}
    
          {currentStep === 2 && !isConfirmed && (
            <div>
              <label>Appointment Type:</label>
              <select
                name="type"
                className="form-control"
                value={appointmentData.type}
                onChange={handleInputChange}
              >
                <option value="">Select Type</option>
                <option value="Direct Consultation">Direct Consultation</option>
                <option value="Tele Consultation">Tele Consultation</option>
              </select>
              {errors.type && <p className="error-text">{errors.type}</p>}
            </div>
          )}
    
          {currentStep === 3 && !isConfirmed && (
            <div>
              <label>Department:</label>
              <select
                name="department"
                className="form-control"
                value={appointmentData.department}
                onChange={handleDepartmentChange}
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department.departmentId} value={department.departmentId}>
                    {department.Value_name}
                  </option>
                ))}
              </select>
              {errors.department && <p className="error-text">{errors.department}</p>}
    
              <label>Doctor:</label>
              <select
                name="doctor"
                className="form-control"
                value={appointmentData.doctor}
                onChange={handleDoctorChange}
              >
                <option value="">Select Doctor</option>
                {pocs.map((poc) => (
                  <option key={poc.POC_ID} value={poc.POC_ID}>
                    {poc.POC_Name}
                  </option>
                ))}
              </select>
              {errors.doctor && <p className="error-text">{errors.doctor}</p>}
            </div>
          )}
    
          {currentStep === 4 && !isConfirmed && (
            <div>
              <label>Date:</label>
              <select
                name="date"
                className="form-control"
                value={appointmentData.date}
                onChange={handleDateChange}
              >
                <option value="">Select Date</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
              {errors.date && <p className="error-text">{errors.date}</p>}
    
              <label>Time:</label>
              <select
                name="time"
                className="form-control"
                value={appointmentData.time}
                onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
              >
                <option value="">Select Time</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.time && <p className="error-text">{errors.time}</p>}
            </div>
          )}
    
          {currentStep === 5 && !isConfirmed && (
            <div>
              <h3>Confirm Appointment Details</h3>
              <p>
                <strong>Name:</strong> {appointmentData.name}
              </p>
              <p>
                <strong>Phone:</strong> {appointmentData.phone}
              </p>
              <p>
                <strong>Email:</strong> {appointmentData.email}
              </p>
              <p>
                <strong>Location:</strong> {appointmentData.location}
              </p>
              <p>
                <strong>Appointment Type:</strong> {appointmentData.type}
              </p>
              <p>
                <strong>Department:</strong> {departmentName}
              </p>
              <p>
                <strong>Doctor:</strong> {pocName}
              </p>
              <p>
                <strong>Date:</strong> {appointmentData.date}
              </p>
              <p>
                <strong>Time:</strong> {appointmentData.time}
              </p>
              <button className="btn btn-primary" onClick={handleConfirm}>
                Confirm Appointment
              </button>
            </div>
          )}
    
          {isConfirmed && (
            <div>
              <h3>Appointment Confirmed!</h3>
              <p>Appointment has been successfully scheduled by Admin.</p>
              <p>Patient's Appointment ID is <strong>{appointmentId}</strong></p>
              <button className="btn btn-success" onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
            </div>
          )}
    
          <div className="navigation-buttons">
            {currentStep > 1 && currentStep <= 5 && !isConfirmed && (
              <button className="btn btn-secondary" onClick={handlePrevious}>
                Previous
              </button>
            )}
            {currentStep < 5 && !isConfirmed && (
              <button className="btn btn-primary" onClick={handleNext}>
                Next
              </button>
            )}
          </div>
        </div>
        </>
    );
    
};  
  
export default AddNewAppointment;
