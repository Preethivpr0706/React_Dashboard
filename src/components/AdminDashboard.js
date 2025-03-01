import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaUserCircle } from "react-icons/fa";
import "./styles/AdminDashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useLocation } from "react-router-dom";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for the dropdown
  const [activeAppointments, setActiveAppointments] = useState(0);
  const [canceledAppointments, setCanceledAppointments] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const clientId = location.state?.clientId;
  const clientName = location.state?.clientName;

  const sidebarRef = useRef(null); // Reference for the sidebar
  const toggleButtonRef = useRef(null); // Reference for the toggle button

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDashboard = () => {
    navigate("/admin-dashboard", { state: { clientId, clientName } });
  };

  const handleLogout = () => {
    navigate("/logout");
  };

  const handleAddNewAppointment = () => {
    navigate("/add-new-appointment", { state: { clientId, clientName } });
  };

  const handleViewPOC = () => {
    navigate("/view-poc", { state: { clientId, clientName } });
  };

  const handleUpdateAvailability = () => {
    navigate("/update-availability", { state: { clientId, clientName } });
  };

  const handleAddPOC = () => {
    navigate("/add-poc", { state: { clientId, clientName } });
  };

  const handleDoctorsList = () => {
    navigate("/doctors", { state: { clientId, clientName } });
  };

  const handleUsersList = () => {
    navigate("/users", { state: { clientId, clientName } });
  };

  const handleViewAppointmentDetails = (status) => {
    navigate("/appointment-details-admin", { state: { clientId, status } });
  };

  const handleViewDepartments = () => {
    navigate("/departments", { state: { clientId } });
  };

  const handleUpdateVisited = () => {
    navigate("/admin-todays-appointments", { state: { clientId, clientName } });
  };

  const handleContactSupport = () => {
    navigate("/contact-support", { state: { clientId, clientName } });
  };

  useEffect(() => {
    const fetchAppointmentCount = async (status, setState) => {
      try {
        const response = await fetch('/api/admin/appointment-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, status }),
        });
        if (response.ok) {
          const data = await response.json();
          setState(data.count || 0);
        } else {
          console.error(`Failed to fetch count for status: ${status}`);
        }
      } catch (error) {
        console.error(`Error fetching count for status: ${status}`, error);
      }
    };

    const fetchTotalDepartmentsAndDoctors = async () => {
      try {
        const response = await fetch('/api/admin/total-departments-doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        });
        if (response.ok) {
          const data = await response.json();
          setTotalDepartments(data.totalDepartments || 0);
          setTotalDoctors(data.totalDoctors || 0);
        }
      } catch (error) {
        console.error("Error fetching total departments and doctors:", error);
      }
    };

    if (clientId) {
      fetchAppointmentCount('Confirmed', setActiveAppointments);
      fetchAppointmentCount('Cancelled', setCanceledAppointments);
      fetchTotalDepartmentsAndDoctors();
    }

    // Close the sidebar if clicking outside
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current && !sidebarRef.current.contains(event.target) &&
        toggleButtonRef.current && !toggleButtonRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    // Add the event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clientId]);

  return (
    <div className="admin-dashboard">
      <div className="d-flex">
        {/* Sidebar */}
        <div
          className={`sidebar ${isSidebarOpen ? "open" : "collapsed"}`}
          ref={sidebarRef} // Attach ref to the sidebar
        >
          <div className="sidebar-header mb-4">
            <h4>{clientName} ADMIN</h4>
          </div>
          <ul className="list-unstyled">
            <li className="mb-3">
              <button className="link-button" onClick={handleDashboard}>
                Dashboard
              </button>
            </li>
            <li className="mb-3">
              <button className="link-button" onClick={handleUpdateVisited}>Today's Appointments</button>
            </li>
            <li className="mb-3">
              <button className="link-button" onClick={handleDoctorsList}>Doctors</button>
            </li>
            <li className="mb-3">
              <button className="link-button" onClick={handleUsersList}>Users</button>
            </li>
            <li>
              <button className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className={`main-content ${isSidebarOpen ? "" : "full-width"}`}>
          <header className="bg-light d-flex justify-content-between align-items-center p-3 shadow-sm">
            <button
              className="btn btn-primary"
              onClick={toggleSidebar}
              ref={toggleButtonRef} // Attach ref to the toggle button
            >
              <FaBars />
            </button>
            <div className="d-flex align-items-center">
              {/* User Icon with Dropdown */}
              <div className="position-relative">
                <FaUserCircle
                  size={50}
                  className="text-secondary"
                  onClick={toggleDropdown}
                  style={{ cursor: "pointer" }}
                />
                {isDropdownOpen && (
                  <ul className="dropdown-menu dropdown-menu-end show">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </header>

          <main className="p-4">
            <h1>Welcome, Admin</h1>
            <p>Use the navigation to manage the hospital system.</p>

            {/* Dashboard Widgets - Each in an individual row */}
            <div className="row">
              <div className="col-12 mb-3">
                <div className="widget card" onClick={() => handleViewAppointmentDetails('Confirmed')}>
                  <h4>Total Appointments</h4>
                  <p className="h3">{activeAppointments}</p>
                </div>
              </div>

              <div className="col-12 mb-3">
                <div className="widget card" onClick={handleViewDepartments}>
                  <h4>Total Departments</h4>
                  <p className="h3">{totalDepartments}</p>
                </div>
              </div>

              <div className="col-12 mb-3">
                <div className="widget card" onClick={handleDoctorsList}>
                  <h4>Total Doctors</h4>
                  <p className="h3">{totalDoctors}</p>
                </div>
              </div>

              <div className="col-12 mb-3">
                <div className="widget card" onClick={() => handleViewAppointmentDetails('Cancelled')}>
                  <h4>Cancelled Appointments</h4>
                  <p className="h3">{canceledAppointments}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="widget p-3 bg-info text-white rounded shadow-sm">
                  <button
                    className="btn btn-light w-100"
                    onClick={handleAddNewAppointment}
                  >
                    Add New Appointment
                  </button>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="widget p-3 bg-success text-white rounded shadow-sm">
                  <button
                    className="btn btn-light w-100"
                    onClick={handleAddPOC}
                  >
                    Add POC
                  </button>
                </div>
              </div>
            </div>

            {/* New Buttons */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="widget p-3 bg-warning text-white rounded shadow-sm">
                  <button
                    className="btn btn-light w-100"
                    onClick={handleViewPOC}
                  >
                    View POC
                  </button>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="widget p-3 bg-primary text-white rounded shadow-sm">
                  <button
                    className="btn btn-light w-100"
                    onClick={handleUpdateAvailability}
                  >
                    Update Availability
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Support Button */}
            <div className="text-center">
              <p>If you need assistance, feel free to reach out to our support team.</p>
              <button
                className="btn btn-danger w-50"
                onClick={handleContactSupport}
              >
                Contact Support
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
