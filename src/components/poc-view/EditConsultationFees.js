import React, { useState, useEffect } from "react";  
import { useLocation, useNavigate } from "react-router-dom";  
import { DollarSign, Link2, X, Save, AlertCircle, Sun, Moon, Loader2 } from "lucide-react";  
import "../styles/EditConsultationFees.css";  
import BackButtonPOC from "./BackButtonPOC";  
  
const FETCH_FEES_API = "/api/poc/get-consultation-fees";  
const UPDATE_FEES_API = "/api/poc/update-consultation-fees";  
  
export function EditConsultationFees() {  
  const location = useLocation();  
  const { pocId } = location.state || {};  
  const [currentFees, setCurrentFees] = useState("");  
  const [newFees, setNewFees] = useState("");  
  const [error, setError] = useState("");  
  const [isSuccess, setIsSuccess] = useState(false);  
  const [showConfirmation, setShowConfirmation] = useState(false);  
  const [isLoading, setIsLoading] = useState(false);  
  const [isSaving, setIsSaving] = useState(false);  
  const [isDarkMode, setIsDarkMode] = useState(() => {  
   const saved = localStorage.getItem("theme");  
   return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;  
  });  
  const navigate = useNavigate();  
  
  useEffect(() => {  
   document.documentElement.classList.toggle("dark-mode", isDarkMode);  
   localStorage.setItem("theme", isDarkMode ? "dark" : "light");  
   return () => document.documentElement.classList.remove("dark-mode");
  }, [isDarkMode]);  
  
  useEffect(() => {  
   if (!pocId) {  
    setError("POC ID is missing. Cannot fetch the fees.");  
    return;  
   }  
  
   const fetchFees = async () => {  
    setIsLoading(true);  
    try {  
     const response = await fetch(FETCH_FEES_API, {  
      method: "POST",  
      headers: { "Content-Type": "application/json" },  
      body: JSON.stringify({ pocId }),  
     });  
     const data = await response.json();  
     if (data.success) {  
      if (data.fees) {  
        setCurrentFees(data.fees);  
      } else {  
        setCurrentFees(null);  
      }  
     } else {  
      setError("Failed to fetch the current fees.");  
     }  
    } catch (err) {  
     setError("Error fetching the current fees.");  
    }  
    setIsLoading(false);  
  };
  
  
   fetchFees();  
  }, [pocId]);  
  
  const validateFees = (fees) => !isNaN(parseFloat(fees)) && parseFloat(fees) >= 0;  
  
  const handleInputChange = (e) => {  
   setNewFees(e.target.value);  
   setError("");  
   setIsSuccess(false);  
  };  
  
  const handleClear = () => {  
   setNewFees("");  
   setError("");  
   setIsSuccess(false);  
  };  
  
  const handleSave = () => {  
   if (!newFees) {  
    setError("Please enter the consultation fees.");  
    return;  
   }  
  
   if (!validateFees(newFees)) {  
    setError("Please enter a valid fee amount.");  
    return;  
   }  
  
   setShowConfirmation(true);  
  };  
  
  const confirmSave = async () => {  
    setIsSaving(true);  
    try {  
     const formattedFees = parseFloat(newFees).toFixed(2);  
     const response = await fetch(UPDATE_FEES_API, {  
      method: "POST",  
      headers: { "Content-Type": "application/json" },  
      body: JSON.stringify({ pocId, fees: formattedFees }),  
     });  
     const data = await response.json();  
     if (data.success) {  
      setCurrentFees(formattedFees);  
      setIsSuccess(true);  
      setError("");  
     } else {  
      setError("Failed to update the fees. Please try again.");  
     }  
    } catch (err) {  
     setError("Error updating the fees.");  
    }  
    setIsSaving(false);  
    setShowConfirmation(false);  
  };  
  
  const handleBackButton = () => {  
   navigate("/back-button", { state: { pocId } });  
  };  
  
  return (  
   <>  
    <BackButtonPOC onClick={handleBackButton} className={`back-button-poc ${isDarkMode ? "dark-mode":""}`} />  
    <div className={`consultation-fees-wrapper min-vh-100 ${isDarkMode ? "dark-theme" : "bg-light text-dark"}`}>  
      <div className="container py-5">  
       <div className="d-flex justify-content-between align-items-center mb-4">  
        <div className="d-flex align-items-center">  
          <DollarSign className="me-2 text-primary" size={32} />  
          <h1>Manage Consultation Fees</h1>  
        </div>  
        <button  
          onClick={() => setIsDarkMode(!isDarkMode)}  
          className="btn btn-outline-secondary"  
          aria-label="Toggle theme"  
        >  
          {isDarkMode ? <Sun className="text-warning" /> : <Moon />}  
        </button>  
       </div>  
  
       <div className="card shadow-sm mb-4">  
        <div className="card-body">  
          <h2 className="card-title">Current Fees</h2>  
          {isLoading ? (  
           <div className="d-flex align-items-center text-muted">  
            <Loader2 className="me-2" size={16} />  
            Loading current fees...  
           </div>  
          ) : currentFees ? (  
           <p className="text-primary">{currentFees}</p>  
          ) : (  
           <p className="text-muted">No consultation fees are currently set.</p>  
          )}  
  
          <h4 className="card-title mt-4">New Consultation Fees</h4>  
          <div className="input-group">  
           <input  
            type="number"  
            id="consultationFees"  
            className="form-control"  
            value={newFees}  
            onChange={handleInputChange}  
            placeholder="Enter consultation fees(eg: 400.00)"  
           />  
           {newFees && (  
            <button className="btn btn-outline-secondary" onClick={handleClear}>  
              <X />  
            </button>  
           )}  
          </div>  
          {error && <div className="text-danger mt-2">{error}</div>}  
          {isSuccess && <div className="text-success mt-2">Fees updated successfully!</div>}  
  
          <button  
           className="btn btn-primary mt-3 w-100"  
           onClick={handleSave}  
           disabled={isSaving}  
          >  
           {isSaving ? (  
            <Loader2 className="me-2 animate-spin" />  
           ) : (  
            <Save className="me-2" />  
           )}  
           {isSaving ? "Saving..." : "Save Changes"}  
          </button>  
        </div>  
       </div>  
      </div>  
  
      {showConfirmation && (  
       <div className="modal show d-block" tabIndex="-1" role="dialog">  
        <div className="modal-dialog modal-dialog-centered" role="document">  
          <div className="modal-content">  
           <div className="modal-header">  
            <h5 className="modal-title">Confirm Changes</h5>  
            <button  
              type="button"  
              className="btn-close"  
              onClick={() => setShowConfirmation(false)}  
              aria-label="Close"  
            ></button>  
           </div>  
           <div className="modal-body">  
            <p>Are you sure you want to update the consultation fees?</p>  
           </div>  
           <div className="modal-footer">  
            <button  
              type="button"  
              className="btn btn-secondary"  
              onClick={() => setShowConfirmation(false)}  
            >  
              Cancel  
            </button>  
            <button type="button" className="btn btn-primary" onClick={confirmSave}>  
              Confirm  
            </button>  
           </div>  
          </div>  
        </div>  
       </div>  
      )}  
    </div>  
   </>  
  );  
}
