import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/TodaysAppointments.css";
import authenticatedFetch from "../authenticatedFetch";

const TodaysAppointmentsAdmin = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // State for data
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    
    // State for protected data with persistence
    const [clientId, setClientId] = useState(null);
    const [clientName, setClientName] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [appointmentsPerPage] = useState(5); // Number of appointments per page

    // Get current date for the header
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Modal states
    const [showFollowupChoiceModal, setShowFollowupChoiceModal] = useState(false);
    const [showFollowupDateModal, setShowFollowupDateModal] = useState(false);
    const [followupDate, setFollowupDate] = useState("");
    const [currentAppointment, setCurrentAppointment] = useState(null);

    const handleMarkAsVisited = async (appointment) => {
        setCurrentAppointment(appointment);
        setShowFollowupChoiceModal(true);
    };

    // Load state from location or sessionStorage
    useEffect(() => {
        const loadState = () => {
            // First try to get state from location
            if (location.state && location.state.clientId) {
                setClientId(location.state.clientId);
                setClientName(location.state.clientName || "");
                
                // Save to sessionStorage for persistence
                try {
                    sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
                    if (location.state.clientName) {
                        sessionStorage.setItem('clientName', JSON.stringify(location.state.clientName));
                    }
                } catch (error) {
                    console.error("Failed to save client data to sessionStorage:", error);
                }
                
                setIsLoading(false);
                return;
            }
            
            // If not available in location, try sessionStorage
            try {
                const storedClientId = sessionStorage.getItem('clientId');
                const storedClientName = sessionStorage.getItem('clientName');
                
                if (storedClientId) {
                    setClientId(JSON.parse(storedClientId));
                    if (storedClientName) {
                        setClientName(JSON.parse(storedClientName));
                    }
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error("Failed to retrieve state from sessionStorage:", error);
            }
            
            // If we get here, we couldn't get state from either source
            navigate('/', { replace: true });
        };
        
        loadState();
    }, [location, navigate]);

    useEffect(() => {
        document.body.classList.add('appointments-page-background');
        return () => {
            document.body.classList.remove('appointments-page-background');
        };
    }, []);

    useEffect(() => {
        const fetchTodaysAppointments = async () => {
            if (!clientId) return;
            
            try {
                const response = await authenticatedFetch("/api/admin/todays-appointments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ clientId }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setAppointments(data);
                } else {
                    throw new Error("Failed to fetch appointments");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTodaysAppointments();
    }, [clientId]);

    // Filter appointments
    const getFilteredAppointments = () => {
        if (activeFilter === "all") return appointments;
        return appointments.filter(app => {
            if (activeFilter === "confirmed") return app.Status === "Confirmed";
            if (activeFilter === "availed") return app.Status === "Availed";
            if (activeFilter === "not-availed") return app.Status === "Not_Availed";
            return true;
        });
    };

    const filteredAppointments = getFilteredAppointments();

    // Pagination logic
    const indexOfLastAppointment = currentPage * appointmentsPerPage;
    const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
    const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const updateStatus = async (appointmentId, newStatus, previousStatus) => {
        try {
            const response = await authenticatedFetch("/api/admin/update-appointment-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId, status: newStatus }),
            });

            if (response.ok) {
                setAppointments((prev) =>
                    prev.map((appt) =>
                        appt.AppointmentId === appointmentId
                            ? { ...appt, Status: newStatus, Is_Active: newStatus === "Confirmed" ? 1 : 0 }
                            : appt
                    )
                );

                const toastId = toast.success(
                    <div>
                        Appointment marked as <b>{newStatus}</b>.{" "}
                        <button
                            className="appointments-undo-button"
                            onClick={() => undoUpdateStatus(appointmentId, previousStatus, toastId)}
                        >
                            Undo
                        </button>
                    </div>,
                    {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                    }
                );
            } else {
                throw new Error("Failed to update status");
            }
        } catch (error) {
            toast.error("Error updating appointment status", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    };

    const undoUpdateStatus = async (appointmentId, previousStatus, toastId) => {
        try {
            const response = await authenticatedFetch("/api/admin/update-appointment-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId, status: previousStatus }),
            });

            if (response.ok) {
                setAppointments((prev) =>
                    prev.map((appt) =>
                        appt.AppointmentId === appointmentId
                            ? { ...appt, Status: previousStatus, Is_Active: previousStatus === "Confirmed" ? 1 : 0 }
                            : appt
                    )
                );

                toast.update(toastId, {
                    render: `Undo successful! Status reverted to ${previousStatus}`,
                    type: "success",
                    autoClose: 3000,
                });
            } else {
                throw new Error("Failed to undo status update");
            }
        } catch (error) {
            toast.error("Error reverting appointment status", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    };

    const handleFollowupChoice = (hasFollowup) => {
        setShowFollowupChoiceModal(false);
        if (hasFollowup) {
            setShowFollowupDateModal(true);
        } else {
            // Mark as visited without followup
            updateStatus(currentAppointment.AppointmentId, "Availed", currentAppointment.Status);
            setCurrentAppointment(null);
        }
    };

    const saveFollowup = async () => {
        try {
            const response = await authenticatedFetch("/api/set-followup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    appointmentId: currentAppointment.AppointmentId,
                    followupDate 
                }),
            });

            if (response.ok) {
                // First update the status to Availed
                await updateStatus(currentAppointment.AppointmentId, "Availed", currentAppointment.Status);
                setShowFollowupDateModal(false);
                setFollowupDate("");
                setCurrentAppointment(null);
                toast.success("Appointment marked as visited with follow-up scheduled");
            } else {
                throw new Error("Failed to set follow-up date");
            }
        } catch (error) {
            toast.error("Error setting follow-up date");
            console.error("Error:", error);
        }
    };

    const closeAllModals = () => {
        setShowFollowupChoiceModal(false);
        setShowFollowupDateModal(false);
        setFollowupDate("");
        setCurrentAppointment(null);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Get counts for filters
    const confirmedCount = appointments.filter(app => app.Status === "Confirmed").length;
    const availedCount = appointments.filter(app => app.Status === "Availed").length;
    const notAvailedCount = appointments.filter(app => app.Status === "Not_Availed").length;

    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="appointments-container">
            <ToastContainer />
            
            {/* Header */}
            <header className="appointments-header">
                <button className="appointments-menu-button" onClick={toggleSidebar}>
                    <i className="fas fa-bars"></i>
                </button>
                <h1>Today's Appointments</h1>
                <div className="appointments-date-display">
                    <i className="far fa-calendar-alt"></i>
                    <span>{currentDate}</span>
                </div>
            </header>
            
            {/* Filter Tabs (Mobile) */}
            <div className="appointments-filter-tabs">
                <button 
                    className={`appointments-tab-button ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    All <span className="appointments-badge">{appointments.length}</span>
                </button>
                <button 
                    className={`appointments-tab-button ${activeFilter === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('confirmed')}
                >
                    Confirmed <span className="appointments-badge">{confirmedCount}</span>
                </button>
                <button 
                    className={`appointments-tab-button ${activeFilter === 'availed' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('availed')}
                >
                    Visited <span className="appointments-badge">{availedCount}</span>
                </button>
                <button 
                    className={`appointments-tab-button ${activeFilter === 'not-availed' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('not-availed')}
                >
                    Not Visited <span className="appointments-badge">{notAvailedCount}</span>
                </button>
            </div>
            
            {/* Sidebar */}
            <div className={`appointments-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="appointments-sidebar-header">
                    <h2>Appointments</h2>
                    <button className="appointments-close-sidebar" onClick={toggleSidebar}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <nav className="appointments-sidebar-nav">
                    <button 
                        className={`appointments-nav-item ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFilter('all');
                            setSidebarOpen(false);
                        }}
                    >
                        All Appointments
                        <span className="appointments-badge">{appointments.length}</span>
                    </button>
                    <button 
                        className={`appointments-nav-item ${activeFilter === 'confirmed' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFilter('confirmed');
                            setSidebarOpen(false);
                        }}
                    >
                        Confirmed
                        <span className="appointments-badge">{confirmedCount}</span>
                    </button>
                    <button 
                        className={`appointments-nav-item ${activeFilter === 'availed' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFilter('availed');
                            setSidebarOpen(false);
                        }}
                    >
                        Visited
                        <span className="appointments-badge">{availedCount}</span>
                    </button>
                    <button 
                        className={`appointments-nav-item ${activeFilter === 'not-availed' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFilter('not-availed');
                            setSidebarOpen(false);
                        }}
                    >
                        Not Visited
                        <span className="appointments-badge">{notAvailedCount}</span>
                    </button>
                </nav>
            </div>
            
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div className="appointments-sidebar-overlay" onClick={toggleSidebar}></div>
            )}

            {/* Follow-up Choice Modal */}
            {showFollowupChoiceModal && (
                <div className="appointments-modal-overlay">
                    <div className="appointments-modal appointments-followup-choice-modal">
                        <div className="appointments-modal-header">
                            <div className="appointments-modal-icon">
                                <i className="fas fa-user-check"></i>
                            </div>
                            <h3>Mark as Visited</h3>
                            <button 
                                onClick={closeAllModals}
                                className="appointments-modal-close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="appointments-modal-body">
                            <div className="appointments-patient-info">
                                <strong>{currentAppointment?.PatientName}</strong>
                                <span>{currentAppointment?.AppointmentTime}</span>
                            </div>
                            <p className="appointments-modal-question">
                                Does this patient need a follow-up appointment?
                            </p>
                        </div>
                        <div className="appointments-modal-footer appointments-choice-footer">
                            <button 
                                onClick={() => handleFollowupChoice(false)}
                                className="appointments-modal-button appointments-no-followup"
                            >
                                <i className="fas fa-times-circle"></i>
                                No Follow-up
                            </button>
                            <button 
                                onClick={() => handleFollowupChoice(true)}
                                className="appointments-modal-button appointments-yes-followup"
                            >
                                <i className="fas fa-calendar-plus"></i>
                                Schedule Follow-up
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Follow-up Date Modal */}
            {showFollowupDateModal && (
                <div className="appointments-modal-overlay">
                    <div className="appointments-modal appointments-followup-date-modal">
                        <div className="appointments-modal-header">
                            <div className="appointments-modal-icon">
                                <i className="fas fa-calendar-plus"></i>
                            </div>
                            <h3>Schedule Follow-up</h3>
                            <button 
                                onClick={closeAllModals}
                                className="appointments-modal-close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="appointments-modal-body">
                            <div className="appointments-patient-info">
                                <strong>{currentAppointment?.PatientName}</strong>
                                <span>{currentAppointment?.AppointmentTime}</span>
                            </div>
                            <div className="appointments-form-group">
                                <label htmlFor="followupDate">Select Follow-up Date:</label>
                                <input
                                    type="date"
                                    id="followupDate"
                                    value={followupDate}
                                    onChange={(e) => setFollowupDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="appointments-date-input"
                                />
                            </div>
                        </div>
                        <div className="appointments-modal-footer">
                            <button 
                                onClick={() => {
                                    setShowFollowupDateModal(false);
                                    setShowFollowupChoiceModal(true);
                                }}
                                className="appointments-modal-button appointments-modal-back"
                            >
                                <i className="fas fa-arrow-left"></i>
                                Back
                            </button>
                            <button 
                                onClick={saveFollowup}
                                className="appointments-modal-button appointments-modal-confirm"
                                disabled={!followupDate}
                            >
                                <i className="fas fa-check"></i>
                                Confirm Follow-up
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Content */}
            <main className="appointments-main">
                {loading ? (
                    <div className="appointments-loading">
                        <div className="appointments-spinner"></div>
                        <p>Loading appointments...</p>
                    </div>
                ) : error ? (
                    <div className="appointments-error">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12" y2="16"></line>
                        </svg>
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()}>Try Again</button>
                    </div>
                ) : currentAppointments.length === 0 ? (
                    <div className="appointments-empty">
                        <h3>No appointments found</h3>
                        <p>There are no appointments for today that match your filter.</p>
                    </div>
                ) : (
                    <div className="appointments-grid">
                        {currentAppointments.map((appt) => (
                            <div className="appointments-card" key={appt.AppointmentId}>
                                <div className="appointments-card-header">
                                    <div className="appointments-time">
                                        <i className="far fa-clock"></i>
                                        {appt.AppointmentTime}
                                    </div>
                                    <div className={`appointments-status appointments-${appt.Status.toLowerCase().replace('_', '-')}`}>
                                        {appt.Status === "Confirmed" ? "Confirmed" : 
                                         appt.Status === "Availed" ? "Visited" : "Not Visited"}
                                    </div>
                                </div>
                                <div className="appointments-card-body">
                                    <div className="appointments-patient-name">
                                        <i className="far fa-user"></i>
                                        {appt.PatientName}
                                    </div>
                                    <div className="appointments-type">
                                        <i className="far fa-calendar-check"></i>
                                        <span>Type:</span> {appt.AppointmentType}
                                    </div>
                                </div>
                                {appt.Status === "Confirmed" && appt.Is_Active === 1 && (
                                    <div className="appointments-actions">
                                        <button
                                            className="appointments-action-button appointments-visited"
                                            onClick={() => handleMarkAsVisited(appt)}
                                        >
                                            <i className="fas fa-check"></i>
                                            Mark as Visited
                                        </button>
                                        <button
                                            className="appointments-action-button appointments-not-visited"
                                            onClick={() => updateStatus(appt.AppointmentId, "Not_Availed", appt.Status)}
                                        >
                                            <i className="fas fa-times"></i>
                                            Mark as Not Visited
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Pagination */}
                        {filteredAppointments.length > appointmentsPerPage && (
                            <div className="appointments-pagination" style={{gridColumn: "1 / -1", display: "flex", justifyContent: "center", gap: "10px", margin: "20px 0"}}>
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="appointments-action-button"
                                    style={{padding: "8px 16px", background: "var(--neutral-200)"}}
                                >
                                    Previous
                                </button>
                                <span style={{display: "flex", alignItems: "center"}}>
                                    Page {currentPage} of {Math.ceil(filteredAppointments.length / appointmentsPerPage)}
                                </span>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === Math.ceil(filteredAppointments.length / appointmentsPerPage)}
                                    className="appointments-action-button"
                                    style={{padding: "8px 16px", background: "var(--neutral-200)"}}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TodaysAppointmentsAdmin;