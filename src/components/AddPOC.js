import React, { useState, useEffect } from "react";  
import axios from "axios";  
import { useNavigate, useLocation } from "react-router-dom";  
import "./styles/AddPOC.css";  
  
export default function AddPOC() {  
  const [currentStep, setCurrentStep] = useState(1);  
  const [doctorDetails, setDoctorDetails] = useState({  
   department: "",  
   name: "",  
   contactNumber: "",  
   email: "",  
   googleMeetLink: "",  
   consultationFees: "",  
   externalPOCId: "", // New field  
  });  
  const [departments, setDepartments] = useState([]);  
  const [errors, setErrors] = useState({});  
  const [pocId, setPocId] = useState(null); // Store POC ID after saving to DB  
  const navigate = useNavigate();  
  const location = useLocation();  
  const clientId = location.state?.clientId || null;  
  
  useEffect(() => {  
   // Fetch departments dynamically  
   axios  
    .post("/api/departments", { clientId })  
    .then((response) => setDepartments(response.data))  
    .catch((error) => console.error("Error fetching departments:", error));  
  }, [clientId]);  
  
  const validate = () => {  
   const newErrors = {};  
   if (!doctorDetails.department) newErrors.department = "Department is required.";  
   if (!doctorDetails.name) newErrors.name = "Name is required.";  
   if (!/^\91\d{10}$/.test(doctorDetails.contactNumber))  
    newErrors.contactNumber = "Contact number must start with +91 and have 10 digits.";  
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
   // Call the API to save POC data  
   const departmentName =  
    departments.find(  
      (d) => d.departmentId.toString() === doctorDetails.department.toString()  
    )?.Value_name || "N/A";  
  
    const consultationFees = parseFloat(doctorDetails.consultationFees);
   axios  
    .post("/api/add-poc", {  
      Client_ID: clientId,  
      Department_ID: doctorDetails.department,  
      POC_Name: doctorDetails.name,  
      Specialization: departmentName,  
      Contact_Number: doctorDetails.contactNumber,  
      Email: doctorDetails.email,  
      Meet_Link: doctorDetails.googleMeetLink || null, // Optional  
      Consultation_Fees: isNaN(consultationFees) ? 0.00 : consultationFees.toFixed(2), //optional
      External_POC_ID: doctorDetails.externalPOCId || null, // New field  
    })  
    .then((response) => {  
      setPocId(response.data.pocId); // Save POC ID from the response  
      setCurrentStep(3);  
    })  
    .catch((error) => {  
      console.error("Error saving POC data:", error);  
      alert("Failed to save POC data. Please try again.");  
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
   <div className={`doctor-form-container`}>  
    <header className="header bg-purple text-white p-3">  
      <div className="container d-flex justify-content-between">  
       <h1>Doctor Management</h1>    
      </div>  
    </header>  
  
    <main className="container my-4">   
      <div className="step-indicator d-flex justify-content-center mb-4">  
       {[1, 2, 3].map((step) => (  
        <div  
          key={step}  
          className={`step-circle ${  
           currentStep >= step ? "bg-purple text-white" : "bg-light"  
          }`}  
        >  
          {step}  
        </div>  
       ))}  
            </div>  
        

      {currentStep === 1 && (  
       <div>  
        <h2 className="mb-3">Doctor Details</h2>  
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
           />  
          </div>  
  
          <div className="mb-3">  
           <label className="form-label">Consultation Fees (Optional)</label>  
           <input  
            type="number"  
            name="consultationFees"  
            value={doctorDetails.consultationFees}  
            onChange={handleInputChange}  
            className="form-control"  
           />  
          </div>  
  
          <div className="mb-3">  
           <label className="form-label">External POC ID (Optional)</label>  
           <input  
            type="text"  
            name="externalPOCId"  
            value={doctorDetails.externalPOCId}  
            onChange={handleInputChange}  
            className="form-control"  
           />  
          </div>  
  
          <button type="button" className="btn btn-next" onClick={handleNext}>  
           Next  
          </button>  
        </form>  
       </div>  
      )}  
  
      {currentStep === 2 && (  
       <div>  
        <h2 className="mb-3">Confirm Details</h2>  
        <div className="card p-3">  
          <p>  
           <strong>Department:</strong>{" "}  
           {  
            departments.find(  
              (d) =>  
               d.departmentId.toString() === doctorDetails.department.toString()  
            )?.Value_name || "N/A"  
           }  
          </p>  
          <p>  
           <strong>Doctor Name:</strong> {doctorDetails.name}  
          </p>  
          <p>  
           <strong>Contact Number:</strong> {doctorDetails.contactNumber}  
          </p>  
          <p>  
           <strong>Email Address:</strong> {doctorDetails.email}  
          </p>  
          <p>  
           <strong>Google Meet Link:</strong>{" "}  
           {doctorDetails.googleMeetLink || "Not Provided"}  
          </p>  
          <p>  
           <strong>Consultation Fees:</strong>{" "}  
           {doctorDetails.consultationFees  
            ? `₹${doctorDetails.consultationFees}`  
            : "Not Provided"}  
          </p>  
          <p>  
           <strong>External POC ID:</strong>{" "}  
           {doctorDetails.externalPOCId || "Not Provided"}  
          </p>  
        </div>  
        <div className="d-flex justify-content-between mt-3">  
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
       <div>  
        <h2 className="text-success">Doctor Added Successfully!</h2>
        <h5>Click the below button to update the POC's Schedule</h5>  
        <button  
          className="btn btn-primary mt-3"  
          onClick={() =>  
           navigate("/update-schedule", { state: { pocId: pocId } })  
          }  
        >  
          Update Schedule  
        </button>  
       </div>  
      )}  
    </main>  
  
    
   </div>  
  );  
}
