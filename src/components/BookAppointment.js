import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook
import "./BookAppointment.css";

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
  });
  const [userId, setUserId] = useState(null);
  const [appointmentType, setAppointmentType] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [pocs, setPocs] = useState([]);
  const [selectedPoc, setSelectedPoc] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");

  const navigate = useNavigate(); // Initialize useNavigate

  // Reset form and navigate to homepage
  const resetForm = () => {
    navigate("/"); // Redirect to the homepage route
  };

  // Fetch functions for dynamic data
  const fetchDepartments = async () => {
    const { data } = await axios.get("/api/departments");
    console.log("Fetched Departments:", data); // Log the fetched departments
    setDepartments(data);
  };

  const fetchPOCs = async (departmentId) => {
    const { data } = await axios.get(`/api/pocs/${departmentId}`);
    console.log("Fetched POCs:", data); // Log the fetched POCs
    setPocs(data);
  };

  const fetchAvailableDates = async (pocId) => {
    const { data } = await axios.post("/api/pocs/available-dates", { pocId });
    setAvailableDates(data);
  };

  const fetchAvailableTimes = async (pocId, date) => {
    const { data } = await axios.post("/api/pocs/available-times", { pocId, date });
    setAvailableTimes(data);
  };

  // Handle navigation between steps
  const handleNext = async () => {
    if (step === 1 && (!userData.name || !userData.phone || !userData.email || !userData.location)) {
      alert("Please fill in all the required fields.");
      return;
    }
    if (step === 2 && !appointmentType) {
      alert("Please select an appointment type.");
      return;
    }
    if (step === 3 && !selectedDepartment) {
      alert("Please select a department.");
      return;
    }
    if (step === 4 && !selectedPoc) {
      alert("Please select a POC.");
      return;
    }
    if (step === 5 && !selectedDate) {
      alert("Please select a date.");
      return;
    }
    if (step === 6 && !selectedTime) {
      alert("Please select a time.");
      return;
    }

    if (step === 1) {
      const { data } = await axios.post("/api/users", userData);
      setUserId(data.userId);
    }
    if (step === 2) await fetchDepartments();
    if (step === 3) await fetchPOCs(selectedDepartment);
    if (step === 4) await fetchAvailableDates(selectedPoc);
    if (step === 5) await fetchAvailableTimes(selectedPoc, selectedDate);
    if (step === 6) {
      await axios.post("/api/create-appointments", {
        userId,
        pocId: selectedPoc,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType,
      });
      setStep(7); // Move to confirmation step
      return;
    }

    setStep((prevStep) => prevStep + 1);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  // Check if the required data is available for confirmation
  const departmentName = departments.find(
    (d) => String(d.departmentId) === String(selectedDepartment)
  )?.Value_name || "N/A";
  const pocName = pocs.find(
    (p) => String(p.POC_ID) === String(selectedPoc)
  )?.POC_Name || "N/A";

  // Render the form for each step
  return (
    <div className="book-appointment">
      <nav className="navbar">
        <h1>MIOT Hospital</h1>
      </nav>

      <h3>Book Appointment - Step {step}</h3>

      {/* Step 1: User Details */}
      {step === 1 && (
        <div>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={userData.name}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={userData.phone}
            onChange={handleInputChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={userData.email}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={userData.location}
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* Step 2: Appointment Type */}
      {step === 2 && (
        <select onChange={(e) => setAppointmentType(e.target.value)} value={appointmentType}>
          <option value="">Select Appointment Type</option>
          <option value="Tele Consultation">Tele Consultation</option>
          <option value="Direct Consultation">Direct Consultation</option>
        </select>
      )}

      {/* Step 3: Department Selection */}
      {step === 3 && (
        <select onChange={(e) => setSelectedDepartment(e.target.value)} value={selectedDepartment}>
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.Value_name}
            </option>
          ))}
        </select>
      )}

      {/* Step 4: POC Selection */}
      {step === 4 && (
        <select onChange={(e) => setSelectedPoc(e.target.value)} value={selectedPoc}>
          <option value="">Select POC</option>
          {pocs.map((p) => (
            <option key={p.POC_ID} value={p.POC_ID}>
              {p.POC_Name}
            </option>
          ))}
        </select>
      )}

            {/* Step 5: Available Dates */}
            {step === 5 && (
        <select onChange={(e) => setSelectedDate(e.target.value)} value={selectedDate}>
          <option value="">Select Date</option>
          {availableDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      )}

      {/* Step 6: Available Time Selection */}
      {step === 6 && (
        <select onChange={(e) => setSelectedTime(e.target.value)} value={selectedTime}>
          <option value="">Select Time</option>
          {availableTimes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      )}

      {/* Step 7: Confirmation Message */}
      {step === 7 && (
        <div>
          <h3>Appointment Confirmation</h3>
          <p><strong>Appointment Type:</strong> {appointmentType}</p>
          <p><strong>Department:</strong> {departmentName}</p>
          <p><strong>POC:</strong> {pocName}</p>
          <p><strong>Date:</strong> {selectedDate}</p>
          <p><strong>Time:</strong> {selectedTime}</p>
          <button onClick={resetForm}>Back to Home</button>
        </div>
      )}

      {/* Navigation button for going to the next step */}
      {step !== 7 && (
        <button onClick={handleNext}>
          {step === 6 ? "Confirm Appointment" : "Next"}
        </button>
      )}
    </div>
  );
};

export default BookAppointment;

