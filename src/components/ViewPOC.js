import React, { useState, useEffect } from "react";  
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";  
import "./styles/ViewPOC.css";  
  
const ViewPOC = () => {  
  const [departments, setDepartments] = useState([]);  
  const [selectedDepartment, setSelectedDepartment] = useState("");  
  const [pocs, setPocs] = useState([]);  
  const navigate = useNavigate();  
  const location = useLocation();  
  const clientId = location.state.clientId; 
  const clientName = location.state?.clientName || null; 
    useEffect(() => {
      // Set the background color when the component is mounted
      document.body.style.background = "linear-gradient(135deg, #6e8efb, #a777e3)";
  
      // Cleanup when the component is unmounted or navigation happens
      return () => {
        document.body.style.background = "";
      };
    }, []);
  
  // Fetch departments on component mount  
  useEffect(() => {  
   axios  
    .post("/api/departments", { clientId })  
    .then((response) => {  
      console.log("Fetched departments:", response.data);  
      setDepartments(response.data);  
    })  
    .catch((error) => console.error("Error fetching departments:", error));  
  }, []);  
  
  // Fetch POCs when the selected department changes  
  useEffect(() => {  
   if (selectedDepartment) {  
    axios  
      .post("/api/pocs", { departmentId: selectedDepartment, clientId })  
      .then((response) => {  
       console.log("Fetched POCs:", response.data);  
       setPocs(response.data);  
      })  
      .catch((error) => console.error("Error fetching POCs:", error));  
   }  
  }, [selectedDepartment]);  
  
  const handleDepartmentChange = (e) => {  
   setSelectedDepartment(e.target.value);  
  };  
  
  const handleViewAppointments = (pocId) => {  
   navigate(`/view-appointments/`, { state: { clientId,pocId } });  
  };  
  

  
  return (  
   
   <div className="departments-pocs-container">  
    <h1>View POC Details</h1>  
  
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
