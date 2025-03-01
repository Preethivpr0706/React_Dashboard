import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/TodaysAppointments.css";


const TodaysAppointmentsAdmin = () => {
    const location = useLocation();
    const clientId = location.state.clientId;
    const clientName = location.state.clientName;
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [appointmentsPerPage] = useState(5); // Number of appointments per page

    useEffect(() => {
        document.body.style.backgroundColor = "#80bdff";
        return () => {
            document.body.style.backgroundColor = "";
        };
    }, []);

    useEffect(() => {
        const fetchTodaysAppointments = async () => {
            try {
                const response = await fetch("/api/admin/todays-appointments", {
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

    // Pagination logic
    const indexOfLastAppointment = currentPage * appointmentsPerPage;
    const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
    const currentAppointments = appointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const updateStatus = async (appointmentId, newStatus, previousStatus) => {
        const confirmUpdate = window.confirm(`Are you sure you want to mark this appointment as ${newStatus}?`);
        if (!confirmUpdate) return;

        try {
            const response = await fetch("/api/admin/update-appointment-status", {
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
                            style={{ background: "transparent", border: "none", color: "#007bff", cursor: "pointer" }}
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
            const response = await fetch("/api/admin/update-appointment-status", {
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

    return (
        <>
            <ToastContainer />
            {/* <BackButton onClick={() => navigate("/back-button", { state: { clientId, clientName } })} /> */}
            <div className="todays-appointments-container">
                <h1 className="todays-appointments-heading">Today's Appointments</h1>

                {loading ? (
                    <p className="todays-appointments-loading">Loading...</p>
                ) : error ? (
                    <p className="todays-appointments-error">{error}</p>
                ) : (
                    <>
                        <div className="todays-appointments-table-container">
                            <table className="todays-appointments-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Appointment Time</th>
                                        <th>Appointment Type</th>
                                        <th>Patient Name</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentAppointments.length > 0 ? (
                                        currentAppointments.map((appt, index) => (
                                            <tr key={appt.AppointmentId}>
                                                <td>{indexOfFirstAppointment + index + 1}</td>
                                                <td>{appt.AppointmentTime}</td>
                                                <td>{appt.AppointmentType}</td>
                                                <td>{appt.PatientName}</td>
                                                <td>
                                                    {appt.Status === "Confirmed" && appt.Is_Active === 1 ? (
                                                        <>
                                                            <button
                                                                className="status-button visited"
                                                                onClick={() => updateStatus(appt.AppointmentId, "Availed", appt.Status)}
                                                            >
                                                                Mark as Visited
                                                            </button>
                                                            <button
                                                                className="status-button not-visited"
                                                                onClick={() => updateStatus(appt.AppointmentId, "Not_Availed", appt.Status)}
                                                            >
                                                                Mark as Not Visited
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className={`status-text ${appt.Status.toLowerCase().replace("_", "-")}`}>
                                                            {appt.Status}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5">No appointments found for today</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="pagination-controls">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="pagination-button"
                            >
                                Previous
                            </button>
                            <span className="pagination-page-info">
                                Page {currentPage} of {Math.ceil(appointments.length / appointmentsPerPage)}
                            </span>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === Math.ceil(appointments.length / appointmentsPerPage)}
                                className="pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default TodaysAppointmentsAdmin;