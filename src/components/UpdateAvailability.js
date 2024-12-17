import React, { useState, useEffect } from 'react';  
import './UpdateAvailability.css';  
  
const UpdateAvailability = () => {  
  const [departments, setDepartments] = useState([]);  
  const [doctors, setDoctors] = useState([]);  
  const [selectedDepartment, setSelectedDepartment] = useState('');  
  const [selectedDoctor, setSelectedDoctor] = useState(null);  
  const [selectedDate, setSelectedDate] = useState('');  
  const [availability, setAvailability] = useState('full');  
  const [timings, setTimings] = useState([]);  
  const [selectedTimings, setSelectedTimings] = useState([]);  
  const [availableDates, setAvailableDates] = useState([]);  
  const [message, setMessage] = useState('');  
  
  useEffect(() => {  
   // Fetch departments  
   fetch('api/departments')  
    .then((response) => response.json())  
    .then(setDepartments)  
    .catch((error) => console.error('Error fetching departments:', error));  
  }, []);  
  
  useEffect(() => {  
   if (selectedDoctor) {  
    fetch('api/pocs/available-dates-update', {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ pocId: selectedDoctor.POC_ID }),  
    })  
      .then((response) => response.json())  
      .then((data) => {  
       setAvailableDates(data.map((date) => ({ Schedule_Date: date.Schedule_Date, active_status: date.active_status })));  
      })  
      .catch((error) => console.error('Error fetching available dates:', error));  
   }  
  }, [selectedDoctor]);  
  
  const handleDepartmentChange = (e) => {  
   const departmentId = e.target.value;  
   setSelectedDepartment(departmentId);  
   setSelectedDoctor(null);  
   setSelectedDate('');  
   setTimings([]);  
   setSelectedTimings([]);  
  
   // Fetch doctors for the selected department  
   fetch(`api/pocs/${departmentId}`)  
    .then((response) => response.json())  
    .then(setDoctors)  
    .catch((error) => console.error('Error fetching doctors:', error));  
  };  
  
  const handleDoctorChange = (e) => {  
   const doctorId = e.target.value;  
   const doctor = doctors.find((doc) => doc.POC_ID === parseInt(doctorId));  
   setSelectedDoctor(doctor);  
   setSelectedDate('');  
   setTimings([]);  
   setSelectedTimings([]);  
  };  
  
  const handleAvailabilityChange = (e) => {  
   setAvailability(e.target.value);  
   if (e.target.value === 'partial') {  
    setSelectedTimings([]); // Reset selected timings when switching to partial  
   }  
  };  
  
  const handleDateTileClick = (dateObj) => {  
    setSelectedDate(dateObj.Schedule_Date);  
    
    // Fetch available timings for the selected doctor and date  
    fetch('api/pocs/available-times-update', {  
     method: 'POST',  
     headers: { 'Content-Type': 'application/json' },  
     body: JSON.stringify({ pocId: selectedDoctor.POC_ID, date: dateObj.Schedule_Date }),  
    })  
     .then((response) => response.json())  
     .then(setTimings)  
     .catch((error) => console.error('Error fetching timings:', error));  
  };
   
  
  const handleTimingClick = (timing) => {  
   setSelectedTimings((prev) => {  
    return prev.includes(timing)  
      ? prev.filter((t) => t !== timing)  
      : [...prev, timing];  
   });  
  };  
  
  const handleUpdateAvailability = () => {  
    const endpoint = availability === 'full' ? 'api/pocs/update-full' : 'api/pocs/update-partial';  
    const body = {  
     pocId: selectedDoctor.POC_ID,  
     date: selectedDate,  
     timings: availability === 'partial' ? selectedTimings : [],  
    };  
    
    fetch(endpoint, {  
     method: 'POST',  
     headers: { 'Content-Type': 'application/json' },  
     body: JSON.stringify(body),  
    })  
     .then((response) => {  
      if (response.ok) {  
        setMessage("Doctor's availability has been updated successfully.");  
      } else {  
        setMessage('Error updating availability.');  
      }  
     })  
     .catch((error) => {  
      console.error('Error updating availability:', error);  
      setMessage('Error updating availability.');  
     });  
  };
  
  
  return (  
   <div className="admin-page">  
    <h1 className="heading">Update Doctor's Availability</h1>  
    <hr className="horizontal-line" />  
    <form className="form">  
      <div className="form-group">  
       <label className="label">Department:</label>  
       <select value={selectedDepartment} onChange={handleDepartmentChange} className="select">  
        <option value="">Select Department</option>  
        {departments.map((d) => (  
          <option key={d.departmentId} value={d.departmentId}>{d.Value_name}</option>  
        ))}  
       </select>  
      </div>  
      <div className="form-group">  
       <label className="label">Doctor:</label>  
       <select value={selectedDoctor?.POC_ID || ''} onChange={handleDoctorChange} className="select">  
        <option value="">Select Doctor</option>  
        {doctors.map((doc) => (  
          <option key={doc.POC_ID} value={doc.POC_ID}>{doc.POC_Name}</option>  
        ))}  
       </select>  
      </div>  
      <div className="form-group">  
  <label className="label">Available Dates:</label>  
  <div className="available-dates">  
   {availableDates.map((dateObj) => (  
    <div  
      key={dateObj.Schedule_Date}  
      className={`date-tile ${selectedDate === dateObj.Schedule_Date ? 'selected' : ''} ${dateObj.active_status === 'blocked' ? 'blocked' : dateObj.active_status === 'partial' ? 'partial' : 'available'}`}  
      onClick={() => dateObj.active_status !== 'blocked' && handleDateTileClick(dateObj)}  
      title={  
       dateObj.active_status === 'blocked'  
        ? 'Full day is blocked'  
        : dateObj.active_status === 'partial'  
          ? 'Partial slots are blocked'  
          : 'No slots are blocked'  
      }  
    >  
      {dateObj.Schedule_Date}  
    </div>  
   ))}  
  </div>  
</div>


 
      <div className="form-group">  
       <label className="label">Availability:</label>  
       <div className="availability">  
        <input  
          type="radio"  
          value="full"  
          checked={availability === 'full'}  
          onChange={handleAvailabilityChange}  
        /> Full  
        <input  
          type="radio"  
          value="partial"  
          checked={availability === 'partial'}  
          onChange={handleAvailabilityChange}  
        /> Partial  
       </div>  
      </div>  
  
      {availability === 'partial' && (  
       <div className="form-group">
       <label className="label">Timings:</label>
       <div className="timings">
         {timings.map((timing) => (
           <div
             key={timing.appointment_time}
             className={`timing ${timing.active_status === 'blocked' ? 'blocked' : ''} ${
               selectedTimings.includes(timing.appointment_time) ? 'selected' : ''
             }`}
             onClick={() =>
               timing.active_status !== 'blocked' && handleTimingClick(timing.appointment_time)
             }
             title={  
              timing.active_status === 'blocked'  
               ? 'Slot is blocked'  
               :'Slot is unblocked'}
           >
             {timing.appointment_time}
           </div>
         ))}
       </div>
     </div>
     
      )}  
  
      <button  
       type="button"  
       onClick={handleUpdateAvailability}  
       className="update-button"  
      >  
       Update Availability  
      </button>  
  
      {message && <div className="message">{message}</div>}  
    </form>  
   </div>  
  );  
};  
  
export default UpdateAvailability;
