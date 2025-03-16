import '../styles/PocView.css';
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaBars, FaTimes, FaHome, FaCalendarAlt, FaCalendarDay, FaUser, FaSignOutAlt, FaLink, FaMoneyBillWave, FaHeadset } from "react-icons/fa";
import authenticatedFetch from '../../authenticated Fetch';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const pocId = location.state?.pocId;  
  const [clientId, setClientId] = useState(null);
  const [pocName, setPocName] = useState(null);
  const [activeAppointments, setActiveAppointments] = useState(0);
  const [canceledAppointments, setCanceledAppointments] = useState(0);
  const [directAppointments, setDirectAppointments] = useState(0);
  const [teleAppointments, setTeleAppointments] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch clientId and POC name
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
  
    if (pocId) fetchClientId();
  }, [pocId]);

  // Fetch total and cancelled appointment counts
  useEffect(() => {
    const fetchAppointmentCount = async (status, setState) => {
      try {
        const response = await authenticatedFetch('/api/poc/appointment-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pocId, status }),
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

    if (pocId) {
      fetchAppointmentCount('Confirmed', setActiveAppointments);
      fetchAppointmentCount('Cancelled', setCanceledAppointments);
    }
  }, [pocId]);

  // Fetch tele and direct appointment count
  useEffect(() => {
    const fetchAppointmentCount = async (type, setState) => {
      try {
        const response = await authenticatedFetch('/api/poc/typeAppointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pocId, type }),
        });
        if (response.ok) {
          const data = await response.json();
          setState(data.count || 0);
        } else {
          console.error(`Failed to fetch count for type: ${type}`);
        }
      } catch (error) {
        console.error(`Error fetching appointment count for type ${type}: `, error);
      }
    };

    if (pocId) {
      fetchAppointmentCount('Direct Consultation', setDirectAppointments);
      fetchAppointmentCount('Tele Consultation', setTeleAppointments);
    }
  }, [pocId]);

  // Navigation handlers
  const handleViewAppointments = () => {
    if (clientId) {
      navigate(`/view-appointments`, { state: { clientId, pocId } });
    } else {
      console.error("clientId is not available yet.");
    }
  };

  const handleUpdateAvailability = () => {
    navigate("/update-availability-poc", { state: { pocId } });
  };

  const handleViewAppointmentDetails = (param, value) => {  
    navigate("/appointment-details", { state: { pocId, [param]: value } });  
  };

  const handleMeetLink = () => {  
    navigate("/meet-link", { state: { pocId } });  
  };

  const handleFees = () => {
    navigate("/fees", { state: { pocId } });  
  };

  const handleLogout = () => {
    navigate("/logout");
  };
  
  const handleDashboard = () => {
    navigate("/poc-dashboard", { state: { pocId } });
    setDrawerOpen(false);
  };

  const handleTodaysAppointments = () => {
    navigate(`/todays-appointments`, { state: { pocId } });
    setDrawerOpen(false);
  };

  const handleUserProfile = () => {
    navigate(`/poc-user-profile`, { state: { pocId } });
    setDrawerOpen(false);
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-profile-section')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  
  // Close drawer when clicking outside on mobile
  useEffect(() => {
    const handleClickOutsideDrawer = (event) => {
      if (drawerOpen && 
          !event.target.closest('.navigation-drawer') && 
          !event.target.closest('.menu-toggle')) {
        setDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideDrawer);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDrawer);
    };
  }, [drawerOpen]);

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="top-navigation">
        <div className="brand-section">
          <button className="menu-toggle" onClick={toggleDrawer}>
            <FaBars />
          </button>
          <h2 className="brand-name">MIOT DOCTOR</h2>
        </div>
        
        <div className="nav-center">
          <h3>Empowering Doctors, Simplifying Care</h3>
        </div>
        
        <div className="user-profile-section">
          <div className="user-info">
            <span className="user-name">{pocName}</span>
            <FaUserCircle 
              size={28} 
              onClick={toggleDropdown} 
              className="user-avatar"
            />
            {showDropdown && (
              <ul className="user-dropdown">
                <li onClick={handleUserProfile}>
                  <FaUser /> <span>View Profile</span>
                </li>
                <li onClick={handleLogout}>
                  <FaSignOutAlt /> <span>Logout</span>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      {/* Navigation Drawer */}
      <div className={`navigation-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Menu</h3>
          <button className="close-drawer" onClick={toggleDrawer}>
            <FaTimes />
          </button>
        </div>
        <ul className="drawer-menu">
          <li>
            <button onClick={handleDashboard}>
              <FaHome /> <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button onClick={handleViewAppointments}>
              <FaCalendarAlt /> <span>Appointments</span>
            </button>
          </li>
          <li>
            <button onClick={handleTodaysAppointments}>
              <FaCalendarDay /> <span>Today's Appointments</span>
            </button>
          </li>
          <li>
            <button onClick={handleUserProfile}>
              <FaUser /> <span>My Profile</span>
            </button>
          </li>
          <li>
            <button onClick={handleLogout}>
              <FaSignOutAlt /> <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <main className="dashboard-content">
        <section className="welcome-section">
          <h1>Welcome  {pocName}😎</h1>
          <p>Manage your appointments and availability with ease</p>
        </section>

        <section className="stats-overview">
          <div className="stat-card" onClick={() => handleViewAppointmentDetails('status', 'Confirmed')}>
            <div className="stat-icon confirmed">
              <FaCalendarAlt />
            </div>
            <div className="stat-details">
              <h3>Active Appointments</h3>
              <p className="stat-number">{activeAppointments}</p>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => handleViewAppointmentDetails('status', 'Cancelled')}>
            <div className="stat-icon cancelled">
              <FaCalendarAlt />
            </div>
            <div className="stat-details">
              <h3>Cancelled Appointments</h3>
              <p className="stat-number">{canceledAppointments}</p>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => handleViewAppointmentDetails('type', 'Direct Consultation')}>
            <div className="stat-icon direct">
              <FaCalendarAlt />
            </div>
            <div className="stat-details">
              <h3>Direct Appointments</h3>
              <p className="stat-number">{directAppointments}</p>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => handleViewAppointmentDetails('type', 'Tele Consultation')}>
            <div className="stat-icon tele">
              <FaCalendarAlt />
            </div>
            <div className="stat-details">
              <h3>Tele Appointments</h3>
              <p className="stat-number">{teleAppointments}</p>
            </div>
          </div>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-cards">
            <div className="action-card view-appointments">
              <div className="action-icon">
                <FaCalendarAlt />
              </div>
              <h3>Appointments</h3>
              <p>View all your scheduled appointments</p>
              <button onClick={handleViewAppointments}>View All</button>
            </div>
            
            <div className="action-card update-availability">
              <div className="action-icon">
                <FaCalendarDay />
              </div>
              <h3>Availability</h3>
              <p>Update your availability schedule</p>
              <button onClick={handleUpdateAvailability}>Update</button>
            </div>
            
            <div className="action-card meet-link">
              <div className="action-icon">
                <FaLink />
              </div>
              <h3>Meet Link</h3>
              <p>Add or edit your meeting link</p>
              <button onClick={handleMeetLink}>Manage</button>
            </div>
            
            <div className="action-card fees">
              <div className="action-icon">
                <FaMoneyBillWave />
              </div>
              <h3>Fees</h3>
              <p>Add or edit your consultation fees</p>
              <button onClick={handleFees}>Update</button>
            </div>
          </div>
        </section>

        <section className="support-section">
          <div className="support-icon">
            <FaHeadset />
          </div>
          <div className="support-content">
            <h3>Need Help?</h3>
            <p>Our support team is always ready to assist you with any questions or issues.</p>
            <button className="support-button">Contact Support</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;