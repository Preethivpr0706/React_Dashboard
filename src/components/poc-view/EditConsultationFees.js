import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DollarSign, X, Save, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import "../styles/EditConsultationFees.css";
import authenticatedFetch from "../../authenticated Fetch";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (!pocId) {
      setError("POC ID is missing. Cannot fetch the fees.");
      return;
    }

    const fetchFees = async () => {
      setIsLoading(true);
      try {
        const response = await authenticatedFetch(FETCH_FEES_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pocId }),
        });
        const data = await response.json();
        if (data.success) {
          setCurrentFees(data.fees || null);
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
      const response = await authenticatedFetch(UPDATE_FEES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pocId, fees: formattedFees }),
      });
      const data = await response.json();
      if (data.success) {
        setCurrentFees(formattedFees);
        setIsSuccess(true);
        setError("");
        setNewFees("");
      } else {
        setError("Failed to update the fees. Please try again.");
      }
    } catch (err) {
      setError("Error updating the fees.");
    }
    setIsSaving(false);
    setShowConfirmation(false);
  };


  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="fees-manager">
      <div className="header">
        <div className="title">
          <DollarSign className="icon" size={28} />
          <h1>Manage Consultation Fees</h1>
        </div>
      </div>

      <div className="content-card">
        <div className="section">
          <h2>Current Consultation Fees</h2>
          {isLoading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={18} />
              <span>Loading current fees...</span>
            </div>
          ) : currentFees ? (
            <div className="current-fees">
              <div className="fee-display">
                <DollarSign size={24} className="fee-icon" />
                <span className="fee-amount">{formatCurrency(currentFees)}</span>
              </div>
            </div>
          ) : (
            <p className="no-fees-message">
              <AlertCircle size={16} className="alert-icon" />
              No consultation fees are currently set.
            </p>
          )}
        </div>

        <div className="section">
          <h2>Update Consultation Fees</h2>
          <div className="input-container">
            <div className="input-wrapper">
              <DollarSign size={16} className="input-icon" />
              <input
                type="number"
                id="consultationFees"
                value={newFees}
                onChange={handleInputChange}
                placeholder="Enter fee amount (e.g., 400.00)"
                step="0.01"
                min="0"
              />
              {newFees && (
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
                <span>✓ Fees updated successfully!</span>
              </div>
            )}
          </div>

          <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving || !newFees}
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
              <DollarSign size={24} className="fee-icon" />
              <p>Are you sure you want to update the consultation fees to {formatCurrency(parseFloat(newFees).toFixed(2))}?</p>
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