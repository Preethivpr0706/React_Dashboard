import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiClock, FiUser, FiCalendar, FiCheckCircle, FiXCircle, FiAlertCircle, FiMenu, FiX } from "react-icons/fi";
import "../styles/TodaysAppointments.css";
import authenticatedFetch from "../../authenticatedFetch";

const TodaysAppointments = () => {
    // Navigation and location setup
    const navigate = useNavigate();
    const location = useLocation();
    
    // Component state
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTab, setSelectedTab] = useState("all");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Protected state
    const [pocId, setPocId] = useState(null);
    const [clientId, setClientId] = useState(null);
    const [pocName, setPocName] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Page background setup
    useEffect(() => {
        document.body.className = "appointments-page-background";
        return () => {
            document.body.className = "";
        };
    }, []);

    // Load state from location or sessionStorage
    useEffect(() => {
        const loadState = () => {
            // First try to get state from location
            if (location.state && location.state.pocId) {
                setPocId(location.state.pocId);
                setClientId(location.state.clientId || null);
                setPocName(location.state.pocName || null);
                
                // Save to sessionStorage for persistence
                try {
                    sessionStorage.setItem('pocId', JSON.stringify(location.state.pocId));
                    if (location.state.clientId) {
                        sessionStorage.setItem('clientId', JSON.stringify(location.state.clientId));
                    }
                    if (location.state.pocName) {
                        sessionStorage.setItem('pocName', JSON.stringify(location.state.pocName));
                    }
                } catch (error) {
                    console.error("Failed to save state to sessionStorage:", error);
                }
                
                setIsLoading(false);
                return;
            }
            
            // If not available in location, try sessionStorage
            try {
                const storedPocId = sessionStorage.getItem('pocId');
                const storedClientId = sessionStorage.getItem('clientId');
                const storedPocName = sessionStorage.getItem('pocName');
                
                if (storedPocId) {
                    setPocId(JSON.parse(storedPocId));
                    
                    if (storedClientId) {
                        setClientId(JSON.parse(storedClientId));
                    }
                    
                    if (storedPocName) {
                        setPocName(JSON.parse(storedPocName));
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

    // Fetch clientId and POC name if not available
    useEffect(() => {
        const fetchClientId = async () => {
            try {
                const response = await authenticatedFetch('/api/getClientId', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pocId }),
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setClientId(data[0].Client_ID);
                        setPocName(data[0].POC_Name);
                        
                        // Save to sessionStorage for persistence
                        try {
                            sessionStorage.setItem('clientId', JSON.stringify(data[0].Client_ID));
                            sessionStorage.setItem('pocName', JSON.stringify(data[0].POC_Name));
                        } catch (error) {
                            console.error("Failed to save client data to sessionStorage:", error);
                        }
                    } else {
                        console.error("No clientId found");
                    }
                } else {
                    console.error("Failed to fetch clientId");
                }
            } catch (error) {
                console.error("Error fetching clientId:", error);
            }
        };
    
        if (pocId && !clientId) fetchClientId();
    }, [pocId, clientId]);

    // Fetch appointments data after state is loaded
    useEffect(() => {
        const fetchTodaysAppointments = async () => {
            if (!pocId) return;
            
            setLoading(true);
            try {
                const response = await authenticatedFetch("/api/poc/todays-appointments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pocId }),
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

        if (!isLoading) {
            fetchTodaysAppointments();
        }
    }, [pocId, isLoading]);

    const updateStatus = async (appointmentId, newStatus, previousStatus) => {
        const confirmUpdate = window.confirm(`Are you sure you want to mark this appointment as ${newStatus}?`);
        if (!confirmUpdate) return;

        try {
            const response = await authenticatedFetch("/api/poc/update-appointment-status", {
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
                        position: "bottom-right",
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
                position: "bottom-right",
                autoClose: 3000,
            });
        }
    };

    const undoUpdateStatus = async (appointmentId, previousStatus, toastId) => {
        try {
            const response = await authenticatedFetch("/api/poc/update-appointment-status", {
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
                    render: `Status reverted to ${previousStatus}`,
                    type: "info",
                    autoClose: 3000,
                });
            } else {
                throw new Error("Failed to undo status update");
            }
        } catch (error) {
            toast.error("Error reverting appointment status", {
                position: "bottom-right",
                autoClose: 3000,
            });
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case "Confirmed":
                return <FiAlertCircle className="appointments-status-icon appointments-confirmed" />;
            case "Availed":
                return <FiCheckCircle className="appointments-status-icon appointments-availed" />;
            case "Not_Availed":
                return <FiXCircle className="appointments-status-icon appointments-not-availed" />;
            default:
                return null;
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return "";
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const filteredAppointments = appointments.filter(appt => {
        if (selectedTab === "all") return true;
        if (selectedTab === "confirmed") return appt.Status === "Confirmed";
        if (selectedTab === "completed") return appt.Status === "Availed";
        if (selectedTab === "missed") return appt.Status === "Not_Availed";
        return true;
    });

    const getAppointmentCountByStatus = (status) => {
        if (status === "all") return appointments.length;
        return appointments.filter(appt => appt.Status === (status === "confirmed" ? "Confirmed" : 
                                                        status === "completed" ? "Availed" : "Not_Availed")).length;
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // Show loading if we're still waiting for state to be loaded
    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="appointments-container">
            <ToastContainer />
            
            {/* Top navigation bar */}
            <header className="appointments-header">
                <button className="appointments-menu-button" onClick={toggleSidebar}>
                    <FiMenu />
                </button>
                <h1>Today's Appointments</h1>
                <div className="appointments-date-display">
                    <FiCalendar />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Filter tabs for mobile/tablet view */}
            <div className="appointments-filter-tabs">
                <button 
                    className={`appointments-tab-button ${selectedTab === "all" ? "active" : ""}`}
                    onClick={() => setSelectedTab("all")}
                >
                    All <span className="appointments-badge">{getAppointmentCountByStatus("all")}</span>
                </button>
                <button 
                    className={`appointments-tab-button ${selectedTab === "confirmed" ? "active" : ""}`}
                    onClick={() => setSelectedTab("confirmed")}
                >
                    Confirmed <span className="appointments-badge">{getAppointmentCountByStatus("confirmed")}</span>
                </button>
                <button 
                    className={`appointments-tab-button ${selectedTab === "completed" ? "active" : ""}`}
                    onClick={() => setSelectedTab("completed")}
                >
                    Completed <span className="appointments-badge">{getAppointmentCountByStatus("completed")}</span>
                </button>
                <button 
                    className={`appointments-tab-button ${selectedTab === "missed" ? "active" : ""}`}
                    onClick={() => setSelectedTab("missed")}
                >
                    Missed <span className="appointments-badge">{getAppointmentCountByStatus("missed")}</span>
                </button>
            </div>

            {/* Sidebar for larger screens */}
            <aside className={`appointments-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="appointments-sidebar-header">
                    <h2>Appointments</h2>
                    <button className="appointments-close-sidebar" onClick={closeSidebar}>
                        <FiX />
                    </button>
                </div>
                <nav className="appointments-sidebar-nav">
                    <button 
                        className={`appointments-nav-item ${selectedTab === "all" ? "active" : ""}`}
                        onClick={() => {
                            setSelectedTab("all");
                            closeSidebar();
                        }}
                    >
                        All
                        <span className="appointments-badge">{getAppointmentCountByStatus("all")}</span>
                    </button>
                    <button 
                        className={`appointments-nav-item ${selectedTab === "confirmed" ? "active" : ""}`}
                        onClick={() => {
                            setSelectedTab("confirmed");
                            closeSidebar();
                        }}
                    >
                        Confirmed
                        <span className="appointments-badge">{getAppointmentCountByStatus("confirmed")}</span>
                    </button>
                    <button 
                        className={`appointments-nav-item ${selectedTab === "completed" ? "active" : ""}`}
                        onClick={() => {
                            setSelectedTab("completed");
                            closeSidebar();
                        }}
                    >
                        Completed
                        <span className="appointments-badge">{getAppointmentCountByStatus("completed")}</span>
                    </button>
                    <button 
                        className={`appointments-nav-item ${selectedTab === "missed" ? "active" : ""}`}
                        onClick={() => {
                            setSelectedTab("missed");
                            closeSidebar();
                        }}
                    >
                        Missed
                        <span className="appointments-badge">{getAppointmentCountByStatus("missed")}</span>
                    </button>
                </nav>
            </aside>

            {/* Overlay for sidebar on mobile */}
            {sidebarOpen && (
                <div className="appointments-sidebar-overlay" onClick={closeSidebar}></div>
            )}

            {/* Main content */}
            <main className="appointments-main">
                {loading ? (
                    <div className="appointments-loading">
                        <div className="appointments-spinner"></div>
                        <p>Loading appointments...</p>
                    </div>
                ) : error ? (
                    <div className="appointments-error">
                        <FiAlertCircle size={48} />
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()}>Try Again</button>
                    </div>
                ) : (
                    <div className="appointments-grid">
                        {filteredAppointments.length > 0 ? (
                            filteredAppointments.map((appt) => (
                                <div className="appointments-card" key={appt.AppointmentId}>
                                    <div className="appointments-card-header">
                                        <div className="appointments-time">
                                            <FiClock />
                                            <span>{formatTime(appt.AppointmentTime)}</span>
                                        </div>
                                        <div className={`appointments-status appointments-${appt.Status.toLowerCase().replace("_", "-")}`}>
                                            {getStatusIcon(appt.Status)}
                                            <span>{appt.Status.replace("_", " ")}</span>
                                        </div>
                                    </div>
                                    <div className="appointments-card-body">
                                        <h3 className="appointments-patient-name">
                                            <FiUser />
                                            {appt.PatientName}
                                        </h3>
                                        <div className="appointments-type">
                                            <span>Type:</span> {appt.AppointmentType}
                                        </div>
                                    </div>
                                    {appt.Status === "Confirmed" && appt.Is_Active === 1 && (
                                        <div className="appointments-actions">
                                            <button 
                                                className="appointments-action-button appointments-visited"
                                                onClick={() => updateStatus(appt.AppointmentId, "Availed", appt.Status)}
                                            >
                                                <FiCheckCircle /> Mark as Visited
                                            </button>
                                            <button 
                                                className="appointments-action-button appointments-not-visited"
                                                onClick={() => updateStatus(appt.AppointmentId, "Not_Availed", appt.Status)}
                                            >
                                                <FiXCircle /> Mark as Not Visited
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="appointments-empty">
                                <h3>No {selectedTab !== "all" ? selectedTab : ""} appointments found for today</h3>
                                {selectedTab !== "all" && (
                                    <button onClick={() => setSelectedTab("all")}>View all appointments</button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TodaysAppointments;