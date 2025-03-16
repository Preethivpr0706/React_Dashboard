import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Video, X, Save, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import "../styles/EditGMeetLink.css";
import authenticatedFetch from "../../authenticated Fetch";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (!pocId) {
      setError("POC ID is missing. Cannot fetch the link.");
      return;
    }

    const fetchLink = async () => {
      setIsLoading(true);
      try {
        const response = await authenticatedFetch(FETCH_LINK_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pocId }),
        });
        const data = await response.json();
        if (data.success) {
          setCurrentLink(data.link || null);
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
      const response = await authenticatedFetch(UPDATE_LINK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pocId, link: newLink }),
      });
      const data = await response.json();
      if (data.success) {
        setCurrentLink(newLink);
        setIsSuccess(true);
        setError("");
        setNewLink("");
      } else {
        setError("Failed to update the link. Please try again.");
      }
    } catch (err) {
      setError("Error updating the link.");
    }
    setIsSaving(false);
    setShowConfirmation(false);
  };


  return (
    <div className="gmeet-manager">
      <div className="header">
        <div className="title">
          <Video className="icon" size={28} />
          <h1>Manage Google Meet Link</h1>
        </div>
      </div>

      <div className="content-card">
        <div className="section">
          <h2>Current Meeting Link</h2>
          {isLoading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={18} />
              <span>Loading current link...</span>
            </div>
          ) : currentLink ? (
            <div className="current-link">
              <div className="link-chip">
                <Video size={16} className="meet-icon" />
                <a href={currentLink} target="_blank" rel="noopener noreferrer" title={currentLink}>
                  {currentLink}
                </a>
              </div>
            </div>
          ) : (
            <p className="no-link-message">
              <AlertCircle size={16} className="alert-icon" />
              No Google Meet link is currently set.
            </p>
          )}
        </div>

        <div className="section">
          <h2>Update Meeting Link</h2>
          <div className="input-container">
            <div className="input-wrapper">
              <Video size={16} className="input-icon" />
              <input
                type="url"
                id="meetLink"
                value={newLink}
                onChange={handleInputChange}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              {newLink && (
                <button className="clear-button" onClick={handleClear} aria-label="Clear input">
                  <X size={16} />
                </button>
              )}
            </div>
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {isSuccess && (
              <div className="success-message">
                <span>✓ Link updated successfully!</span>
              </div>
            )}
          </div>

          <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving || !newLink}
          >
            {isSaving ? (
              <>
                <Loader2 className="spinner" size={18} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>Confirm Changes</h3>
              <button
                className="close-modal"
                onClick={() => setShowConfirmation(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <AlertCircle size={24} className="alert-icon" />
              <p>Are you sure you want to update the Google Meet link?</p>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-button" 
                onClick={confirmSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="spinner" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}