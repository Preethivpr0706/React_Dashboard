import '../styles/PocView.css';
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaUserCircle, 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaCalendarAlt, 
  FaCalendarDay, 
  FaUser, 
  FaSignOutAlt, 
  FaLink, 
  FaMoneyBillWave, 
  FaHeadset, 
  FaCalendarPlus
} from "react-icons/fa";
import authenticatedFetch from '../../authenticatedFetch';
import { useProtectedState } from '../../StatePersistence';

const DoctorDashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeAppointments, setActiveAppointments] = useState(0);
  const [canceledAppointments, setCanceledAppointments] = useState(0);
  const [directAppointments, setDirectAppointments] = useState(0);
  const [teleAppointments, setTeleAppointments] = useState(0);
  const [clientName, setClientName] = useState('');


  const navigate = useNavigate();
  const location = useLocation();
  const drawerRef = useRef(null);
  const toggleButtonRef = useRef(null);
  
  // State for protected data
  const [pocId, setPocId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [pocName, setPocName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load state from location or sessionStorage
  useEffect(() => {
    const loadState = () => {
      // First try to get state from location
      if (location.state && location.state.pocId) {
        setPocId(location.state.pocId);
        
        // Save to sessionStorage for persistence
        try {
          sessionStorage.setItem('pocId', JSON.stringify(location.state.pocId));
        } catch (error) {
          console.error("Failed to save pocId to sessionStorage:", error);
        }
        
        setIsLoading(false);
        return;
      }
      
      // If not available in location, try sessionStorage
      try {
        const storedPocId = sessionStorage.getItem('pocId');
        
        if (storedPocId) {
          setPocId(JSON.parse(storedPocId));
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

      // ✅ updated condition
      if (data && data.Client_ID) {
        setClientId(data.Client_ID);
        setPocName(data.POC_Name);
        setClientName(data.Client_Name);

        try {
          sessionStorage.setItem('clientId', JSON.stringify(data.Client_ID));
          sessionStorage.setItem('pocName', JSON.stringify(data.POC_Name));
          sessionStorage.setItem('clientName', JSON.stringify(data.Client_Name));
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

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Navigation handlers
  const handleDashboard = () => navigate("/poc-dashboard", { state: { pocId, clientId, pocName } });
  const handleViewAppointments = () => navigate("/view-appointments", { state: { pocId, clientId, pocName } });
  const handleTodaysAppointments = () => navigate("/todays-appointments", { state: { pocId, clientId, pocName } });
  const handleUpdateAvailability = () => navigate("/update-availability-poc", { state: { pocId, clientId, pocName } });
  const handleUserProfile = () => navigate("/poc-user-profile", { state: { pocId, clientId, pocName } });
  const handleViewAppointmentDetails = (param, value) => navigate("/appointment-details", { state: { pocId, clientId, pocName, [param]: value } });
  const handleMeetLink = () => navigate("/meet-link", { state: { pocId, clientId, pocName } });
  const handleFees = () => navigate("/fees", { state: { pocId, clientId, pocName } });
  const handleLogout = () => navigate("/logout");
  const handleContactSupport =() =>{
    navigate("/home");
  }
  const handleUpdateSchedule =() =>{
    navigate("/update-schedule", { 
      state: { 
        pocId: pocId,
        clientId: clientId
      } 
    });
  }
  const handleFollowups = () => navigate("/followups", { state: { clientId, clientName } });


  // Fetch appointment counts
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

    const fetchAppointmentTypeCount = async (type, setState) => {
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
      fetchAppointmentCount('Confirmed', setActiveAppointments);
      fetchAppointmentCount('Cancelled', setCanceledAppointments);
      fetchAppointmentTypeCount('Direct Consultation', setDirectAppointments);
      fetchAppointmentTypeCount('Tele Consultation', setTeleAppointments);
    }
  }, [pocId]);

  // Close drawer/dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        drawerRef.current && !drawerRef.current.contains(event.target) &&
        toggleButtonRef.current && !toggleButtonRef.current.contains(event.target)
      ) {
        setDrawerOpen(false);
      }
      
      if (isDropdownOpen && !event.target.closest('.user-profile-section')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="top-navigation">
        <div className="brand-section">
          <button 
            className="menu-toggle" 
            onClick={toggleDrawer}
            ref={toggleButtonRef}
          >
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
            {isDropdownOpen && (
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
      <div 
        className={`navigation-drawer ${drawerOpen ? 'open' : ''}`}
        ref={drawerRef}
      >
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
            <button onClick={handleFollowups}>
              <FaCalendarPlus /> 
            <span >Followups</span>
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
          <h1>Welcome {pocName} 😎</h1>
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
            <div className="action-card update-schedule">
              <div className="action-icon">
                <FaCalendarAlt />
              </div>
              <h3>Schedule</h3>
              <p>Update your schedule</p>
              <button onClick={handleUpdateSchedule}>Update Schedule</button>
            </div>
            
            <div className="action-card update-availability">
              <div className="action-icon">
                <FaCalendarDay />
              </div>
              <h3>Availability</h3>
              <p>Update your slot's availability</p>
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
            <button className="support-button" onClick={handleContactSupport}>Contact Support</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;