import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Video, Link2, X, Save, AlertCircle, Sun, Moon, Loader2 } from "lucide-react";
import "../styles/EditGMeetLink.css";
import BackButtonPOC from "./BackButtonPOC";

const FETCH_LINK_API = "/api/poc/get-link";
const UPDATE_LINK_API = "/api/poc/update-link";

export function EditGMeetLink() {
  const location = useLocation();
  const { pocId } = location.state || {};
  const [currentLink, setCurrentLink] = useState("");
  const [newLink, setNewLink] = useState("");
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
      setError("POC ID is missing. Cannot fetch the link.");
      return;
    }

    const fetchLink = async () => {  
        setIsLoading(true);  
        try {  
         const response = await fetch(FETCH_LINK_API, {  
          method: "POST",  
          headers: { "Content-Type": "application/json" },  
          body: JSON.stringify({ pocId }),  
         });  
         const data = await response.json();  
         if (data.success) {  
          if (data.link) {  
            setCurrentLink(data.link);  
          } else {  
            setCurrentLink(null);  
          }  
         } else {  
          setError("Failed to fetch the current link.");  
         }  
        } catch (err) {  
         setError("Error fetching the current link.");  
        }  
        setIsLoading(false);  
      };      

    fetchLink();
  }, [pocId]);

  const validateGMeetLink = (link) => link.startsWith("https://meet.google.com/");

  const handleInputChange = (e) => {
    setNewLink(e.target.value);
    setError("");
    setIsSuccess(false);
  };

  const handleClear = () => {
    setNewLink("");
    setError("");
    setIsSuccess(false);
  };

  const handleSave = () => {
    if (!newLink) {
      setError("Please enter a Google Meet link.");
      return;
    }

    if (!validateGMeetLink(newLink)) {
      setError("Please enter a valid Google Meet link.");
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(UPDATE_LINK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pocId, link: newLink }),
      });
      const data = await response.json();
      if (data.success) {
        setCurrentLink(newLink);
        setIsSuccess(true);
        setError("");
      } else {
        setError("Failed to update the link. Please try again.");
      }
    } catch (err) {
      setError("Error updating the link.");
    }
    setIsSaving(false);
    setShowConfirmation(false);
  };
  const handleBackButton = () => {  
    navigate("/back-button", { state: { pocId } });  
   }; 

  return (
    <>
      <BackButtonPOC className="back-button-poc" onClick={handleBackButton}/>
    <div className={`min-vh-100 ${isDarkMode ? "dark-theme" : "bg-light text-dark"}`}>
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <Video className="me-2 text-primary" size={32} />
            <h1>Manage Google Meet Link</h1>
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
            <h2 className="card-title">Current Link</h2>
            {isLoading ? (
              <div className="d-flex align-items-center text-muted">
                <Loader2 className="me-2" size={16} />
                Loading current link...
              </div>
            ) : currentLink ? (
              <a href={currentLink} target="_blank" rel="noopener noreferrer" className="text-primary">
                {currentLink}
              </a>
            ) : (
              <p className="text-muted">No Google Meet link is currently set.</p>
            )}

            <h4 className="card-title mt-4">New Google Meet Link</h4>
            <div className="input-group">
              <input
                type="url"
                id="meetLink"
                className="form-control"
                value={newLink}
                onChange={handleInputChange}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              {newLink && (
                <button className="btn btn-outline-secondary" onClick={handleClear}>
                  <X />
                </button>
              )}
            </div>
            {error && <div className="text-danger mt-2">{error}</div>}
            {isSuccess && <div className="text-success mt-2">Link updated successfully!</div>}

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
                <p>Are you sure you want to update the Google Meet link?</p>
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
