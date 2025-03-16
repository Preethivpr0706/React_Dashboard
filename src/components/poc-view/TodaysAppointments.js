import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiClock, FiUser, FiCalendar, FiCheckCircle, FiXCircle, FiAlertCircle, FiMenu, FiX } from "react-icons/fi";
import "../styles/TodaysAppointments.css";
import authenticatedFetch from "../../authenticated Fetch";

const TodaysAppointments = () => {
    const location = useLocation();
    const pocId = location.state?.pocId;
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTab, setSelectedTab] = useState("all");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.body.className = "appointments-page-background";
        return () => {
            document.body.className = "";
        };
    }, []);

    useEffect(() => {
        const fetchTodaysAppointments = async () => {
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

        fetchTodaysAppointments();
    }, [pocId]);

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
