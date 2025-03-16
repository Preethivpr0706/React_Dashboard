import React, { useState, useEffect, useRef } from "react";
import { 
  FaBars, 
  FaUserCircle, 
  FaCalendarCheck, 
  FaBuilding, 
  FaUserMd, 
  FaTimesCircle, 
  FaPlus, 
  FaEye, 
  FaClock, 
  FaHeadset 
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/AdminDashboard.css";

// Utility function for authenticated API requests
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token, // Token already includes Bearer prefix
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/'; // Force redirect to login
      throw new Error('Unauthorized - Session expired');
    }
    throw new Error(`Request failed with status: ${response.status}`);
  }
  
  return response;
};

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeAppointments, setActiveAppointments] = useState(0);
  const [canceledAppointments, setCanceledAppointments] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const clientId = location.state?.clientId;
  const clientName = location.state?.clientName;

  const sidebarRef = useRef(null);
  const toggleButtonRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Navigation handlers
  const handleDashboard = () => navigate("/admin-dashboard", { state: { clientId, clientName } });
  const handleLogout = () => {
    navigate("/logout");
  };

  const handleAddNewAppointment = () => navigate("/add-new-appointment", { state: { clientId, clientName } });
  const handleViewPOC = () => navigate("/view-poc", { state: { clientId, clientName } });
  const handleUpdateAvailability = () => navigate("/update-availability", { state: { clientId, clientName } });
  const handleAddPOC = () => navigate("/add-poc", { state: { clientId, clientName } });
  const handleDoctorsList = () => navigate("/doctors", { state: { clientId, clientName } });
  const handleUsersList = () => navigate("/users", { state: { clientId, clientName } });
  const handleViewAppointmentDetails = (status) => navigate("/appointment-details-admin", { state: { clientId, status } });
  const handleViewDepartments = () => navigate("/departments", { state: { clientId } });
  const handleUpdateVisited = () => navigate("/admin-todays-appointments", { state: { clientId, clientName } });
  const handleContactSupport = () => navigate("/contact-support", { state: { clientId, clientName } });

  useEffect(() => {
    const fetchAppointmentCount = async (status, setState) => {
      try {
        const response = await authenticatedFetch('/api/admin/appointment-count', {
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
        const response = await authenticatedFetch('/api/admin/total-departments-doctors', {
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

    // Close sidebar when clicking outside
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current && !sidebarRef.current.contains(event.target) &&
        toggleButtonRef.current && !toggleButtonRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clientId]);

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div
        className={`admin-dashboard__sidebar ${isSidebarOpen ? "admin-dashboard__sidebar--open" : "admin-dashboard__sidebar--collapsed"}`}
        ref={sidebarRef}
      >
        <div className="admin-dashboard__sidebar-header">
          <h4 className="admin-dashboard__sidebar-title">{clientName}</h4>
          <p className="admin-dashboard__sidebar-subtitle">Admin Portal</p>
        </div>
        <div className="admin-dashboard__sidebar-menu">
          <button className="admin-dashboard__sidebar-item admin-dashboard__sidebar-item--active" onClick={handleDashboard}>
            <span className="admin-dashboard__sidebar-icon"><i className="fas fa-th-large"></i></span>
            <span className="admin-dashboard__sidebar-text">Dashboard</span>
          </button>
          <button className="admin-dashboard__sidebar-item" onClick={handleUpdateVisited}>
            <span className="admin-dashboard__sidebar-icon"><i className="fas fa-calendar-day"></i></span>
            <span className="admin-dashboard__sidebar-text">Today's Appointments</span>
          </button>
          <button className="admin-dashboard__sidebar-item" onClick={handleDoctorsList}>
            <span className="admin-dashboard__sidebar-icon"><i className="fas fa-user-md"></i></span>
            <span className="admin-dashboard__sidebar-text">Doctors</span>
          </button>
          <button className="admin-dashboard__sidebar-item" onClick={handleUsersList}>
            <span className="admin-dashboard__sidebar-icon"><i className="fas fa-users"></i></span>
            <span className="admin-dashboard__sidebar-text">Users</span>
          </button>
          <button className="admin-dashboard__sidebar-item" onClick={handleViewDepartments}>
            <span className="admin-dashboard__sidebar-icon"><i className="fas fa-building"></i></span>
            <span className="admin-dashboard__sidebar-text">Departments</span>
          </button>
          <button className="admin-dashboard__sidebar-item" onClick={handleViewPOC}>
            <span className="admin-dashboard__sidebar-icon"><i className="fas fa-address-card"></i></span>
            <span className="admin-dashboard__sidebar-text">View POC</span>
          </button>
          <button className="admin-dashboard__sidebar-item" onClick={handleAddPOC}>
            <span className="admin-dashboard__sidebar-icon"><i className="fas fa-user-plus"></i></span>
            <span className="admin-dashboard__sidebar-text">Add POC</span>
          </button>
          <button className="admin-dashboard__sidebar-item" onClick={handleLogout}>
            <span className="admin-dashboard__sidebar-icon"><i className="fas fa-sign-out-alt"></i></span>
            <span className="admin-dashboard__sidebar-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`admin-dashboard__main-content ${isSidebarOpen ? "" : "admin-dashboard__main-content--expanded"}`}>
        {/* Header */}
        <header className="admin-dashboard__header">
          <div className="admin-dashboard__header-left">
            <button
              className="admin-dashboard__toggle-btn"
              onClick={toggleSidebar}
              ref={toggleButtonRef}
            >
              <FaBars />
            </button>
            <h1 className="admin-dashboard__header-title">Admin Dashboard</h1>
          </div>
          <div className="admin-dashboard__header-right">
            <div className="admin-dashboard__dropdown-container">
              <div className="admin-dashboard__user-profile" onClick={toggleDropdown}>
                <FaUserCircle className="admin-dashboard__user-icon" />
                <span className="admin-dashboard__username">{clientName} Admin</span>
              </div>
              {isDropdownOpen && (
                <div className="admin-dashboard__dropdown-menu">
                  <button className="admin-dashboard__dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="admin-dashboard__content">
          <div className="admin-dashboard__welcome-section">
            <h2 className="admin-dashboard__welcome-title">Welcome to your Dashboard</h2>
            <p className="admin-dashboard__welcome-subtitle">Manage your hospital's operations efficiently</p>
          </div>

          {/* Stats Cards */}
          <div className="admin-dashboard__stats-container">
            <div className="admin-dashboard__stats-card" onClick={() => handleViewAppointmentDetails('Confirmed')}>
              <div className="admin-dashboard__stats-icon admin-dashboard__stats-icon--appointments">
                <FaCalendarCheck />
              </div>
              <div className="admin-dashboard__stats-info">
                <h3 className="admin-dashboard__stats-value">{activeAppointments}</h3>
                <p className="admin-dashboard__stats-label">Total Appointments</p>
              </div>
            </div>
            
            <div className="admin-dashboard__stats-card" onClick={handleViewDepartments}>
              <div className="admin-dashboard__stats-icon admin-dashboard__stats-icon--departments">
                <FaBuilding />
              </div>
              <div className="admin-dashboard__stats-info">
                <h3 className="admin-dashboard__stats-value">{totalDepartments}</h3>
                <p className="admin-dashboard__stats-label">Total Departments</p>
              </div>
            </div>
            
            <div className="admin-dashboard__stats-card" onClick={handleDoctorsList}>
              <div className="admin-dashboard__stats-icon admin-dashboard__stats-icon--doctors">
                <FaUserMd />
              </div>
              <div className="admin-dashboard__stats-info">
                <h3 className="admin-dashboard__stats-value">{totalDoctors}</h3>
                <p className="admin-dashboard__stats-label">Total Doctors</p>
              </div>
            </div>
            
            <div className="admin-dashboard__stats-card" onClick={() => handleViewAppointmentDetails('Cancelled')}>
              <div className="admin-dashboard__stats-icon admin-dashboard__stats-icon--cancelled">
                <FaTimesCircle />
              </div>
              <div className="admin-dashboard__stats-info">
                <h3 className="admin-dashboard__stats-value">{canceledAppointments}</h3>
                <p className="admin-dashboard__stats-label">Cancelled Appointments</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="admin-dashboard__actions-section">
            <h3 className="admin-dashboard__section-title">Quick Actions</h3>
            <div className="admin-dashboard__action-cards">
              <div className="admin-dashboard__action-card" onClick={handleAddNewAppointment}>
                <div className="admin-dashboard__action-icon admin-dashboard__action-icon--appointments">
                  <FaPlus />
                </div>
                <div className="admin-dashboard__action-text">
                  <h4 className="admin-dashboard__action-title">Add New Appointment</h4>
                  <p className="admin-dashboard__action-description">Schedule a new appointment for a patient</p>
                </div>
              </div>
              
              <div className="admin-dashboard__action-card" onClick={handleAddPOC}>
                <div className="admin-dashboard__action-icon admin-dashboard__action-icon--poc">
                  <FaPlus />
                </div>
                <div className="admin-dashboard__action-text">
                  <h4 className="admin-dashboard__action-title">Add POC</h4>
                  <p className="admin-dashboard__action-description">Register a new point of contact</p>
                </div>
              </div>
              
              <div className="admin-dashboard__action-card" onClick={handleViewPOC}>
                <div className="admin-dashboard__action-icon admin-dashboard__action-icon--view">
                  <FaEye />
                </div>
                <div className="admin-dashboard__action-text">
                  <h4 className="admin-dashboard__action-title">View POC</h4>
                  <p className="admin-dashboard__action-description">View all points of contact</p>
                </div>
              </div>
              
              <div className="admin-dashboard__action-card" onClick={handleUpdateAvailability}>
                <div className="admin-dashboard__action-icon admin-dashboard__action-icon--schedule">
                  <FaClock />
                </div>
                <div className="admin-dashboard__action-text">
                  <h4 className="admin-dashboard__action-title">Update Availability</h4>
                  <p className="admin-dashboard__action-description">Manage doctor schedules and availability</p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="admin-dashboard__support-section">
            <div className="admin-dashboard__support-card" onClick={handleContactSupport}>
              <div className="admin-dashboard__support-icon">
                <FaHeadset />
              </div>
              <div className="admin-dashboard__support-text">
                <h4 className="admin-dashboard__support-title">Need Help?</h4>
                <p className="admin-dashboard__support-description">Our support team is here to assist you</p>
                <button className="admin-dashboard__support-btn">Contact Support</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;