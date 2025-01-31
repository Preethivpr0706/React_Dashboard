import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/PocView.css';

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

  // Fetch clientId and POC name
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const response = await fetch('/api/getClientId', {
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
        const response = await fetch('/api/poc/appointment-count', {
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
    const fetchAppointmentCount = async (type,setState) => {
      try {
        const response = await fetch('/api/poc/typeAppointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pocId, type}),
        });
        if (response.ok) {
          const data = await response.json();
          setState(data.count || 0);
        } else {
          console.error(`Failed to fetch count for type: ${type}`);
        }
      } catch (error) {
        console.error(`Error fetching appointment countcount for type ${type}: `, error);
      }
    };

    if (pocId) {
      fetchAppointmentCount('Direct Consultation',setDirectAppointments);
      fetchAppointmentCount('Tele Consultation', setTeleAppointments);
    }
  }, [pocId]);


  

  const handleViewAppointments = () => {
    if (clientId) {
      navigate(`/view-appointments`, { state: { clientId, pocId } });
    } else {
      console.error("clientId is not available yet.");
    }
  };

  const handleUpdateAvailability = () => {
    navigate("/update-availability-poc", { state: { pocId} });
  };

  const handleViewAppointmentDetails = (param, value) => {  
    navigate("/appointment-details", { state: { pocId, [param]: value } });  
  };

  const handleMeetLink = (param, value) => {  
    navigate("/meet-link", { state: { pocId} });  
  };

  const handleFees = (param, value) => {
    navigate("/fees", { state: { pocId} });  
  };
  

  return (
    <div className="d-flex">
      <Sidebar pocId={pocId} clientId={clientId} />

      <div className="main-content flex-grow-1">
        <Header pocId={pocId}/>
        <main className="p-4">
          <h1>Welcome, {pocName}</h1>
          <p>Manage your appointments and availability from this dashboard.</p>

          <div className="row">
            <div className="col-md-3 mb-4">
              <div className="widget card p-4 rounded shadow-sm" onClick={() => handleViewAppointmentDetails('status', 'Confirmed')}>  
                <h4>Total Appointments</h4>  
                <p className="h2">{activeAppointments}</p>  
              </div> 
            </div>
            <div className="col-md-3 mb-4">
              <div className="widget card p-4 rounded shadow-sm" onClick={() => handleViewAppointmentDetails('status', 'Cancelled')}>  
                <h4>Cancelled Appointments</h4>  
                <p className="h2">{canceledAppointments}</p>  
              </div> 
            </div>
            <div className="col-md-3 mb-4">
              <div className="widget card p-4 rounded shadow-sm" onClick={() => handleViewAppointmentDetails('type', 'Direct Consultation')}>  
                <h4>Direct Appointments</h4>  
                <p className="h2">{directAppointments}</p>  
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="widget card p-4 rounded shadow-sm" onClick={() => handleViewAppointmentDetails('type', 'Tele Consultation')}>  
                 <h4>Tele Appointments</h4>  
                 <p className="h2">{teleAppointments}</p>  
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="widget p-4 bg-primary text-white rounded shadow-sm">
                <button className="btn btn-light w-100" onClick={handleViewAppointments}>
                  View Appointments
                </button>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="widget p-4 bg-success text-white rounded shadow-sm">
                <button className="btn btn-light w-100" onClick={handleUpdateAvailability}>
                  Update Doctors' Availability
                </button>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="widget p-4 bg-secondary text-white rounded shadow-sm">
                <button className="btn btn-light w-100" onClick={handleMeetLink} >
                  Add / Edit MeetLink
                </button>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="widget p-4 bg-info text-white rounded shadow-sm">
                <button className="btn btn-light w-100" onClick={handleFees}>
                  Add / Edit Fees
                </button>
              </div>
            </div>
          </div>

          <div className="contact-support mt-5">
            <h4>Contact Support</h4>
            <p>If you need assistance, feel free to reach out to our support team.</p>
            <button className="btn btn-danger w-100">Contact Support</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
