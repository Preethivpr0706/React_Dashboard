import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useNavigate, useParams } from "react-router-dom"; // Import useNavigate
import './PocView.css';

const DoctorDashboard = () => {
  const navigate = useNavigate();

  const { pocId } = useParams();  
  
   const handleViewAppointments = () => {  
      navigate(`/view-appointments/${pocId}`);  
   };  

  const handleUpdateAvailability = () => {
    navigate("/update-availability-poc");
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="main-content flex-grow-1">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="p-4">
          <h1>Welcome, Doctor</h1>
          <p>Manage your appointments and patient care from this dashboard.</p>

          {/* Dashboard Widgets */}
          <div className="row">
            <div className="col-md-3 mb-4">
              <div className="widget p-4 bg-light rounded shadow-sm">
                <h4>Total Appointments</h4>
                <p className="h2">150</p>
              </div>
            </div>

            <div className="col-md-3 mb-4">
              <div className="widget p-4 bg-light rounded shadow-sm">
                <h4>Active Patients</h4>
                <p className="h2">10</p>
              </div>
            </div>

            <div className="col-md-3 mb-4">
              <div className="widget p-4 bg-light rounded shadow-sm">
                <h4>Pending Appointments</h4>
                <p className="h2">5</p>
              </div>
            </div>

            <div className="col-md-3 mb-4">
              <div className="widget p-4 bg-light rounded shadow-sm">
                <h4>Canceled Appointments</h4>
                <p className="h2">3</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="widget p-4 bg-primary text-white rounded shadow-sm">
                <button className="btn btn-light w-100" onClick={() => handleViewAppointments(1)}> View Appointment</button>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="widget p-4 bg-success text-white rounded shadow-sm">
                <button className="btn btn-light w-100"  onClick={handleUpdateAvailability}>Update Doctors' Availability</button>
              </div>
            </div>

            
          </div>

          {/* Contact Support Section */}
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