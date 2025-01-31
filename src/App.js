import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ViewPOC from "./components/ViewPOC";
import ViewAppointments from "./components/ViewAppointments";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import UpdateAvailability from "./components/UpdateAvailability";
import DoctorDashboard from "./components/poc-view/DoctorDashboard";
import AddNewAppointment from "./components/AddNewAppointment";
import LogoutPage from "./components/LogoutPage";
import AvailabilityManager from "./components/poc-view/AvailabilityManager";
import SignupPage from "./components/SignupPage";
import EmailVerificationPage from "./components/EmailVerificationPage";
import CreatePasswordPage from "./components/CreatePasswordPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import TodaysAppointments from "./components/poc-view/TodaysAppointments";
import AddPOC from "./components/AddPOC";
import UserProfile from "./components/poc-view/UserProfile";
import DoctorsList from "./components/DoctorsList";
import AppointmentDetails from "./components/poc-view/AppointmentDetails";
import AppointmentDetailsAdmin from "./components/AppointmentDetailsAdmin";
import DepartmentList from "./components/DepartmentList";
import UpdateSchedule from "./components/UpdateSchedule";
import { EditGMeetLink } from "./components/poc-view/EditGMeetLink";
import { EditConsultationFees } from "./components/poc-view/EditConsultationFees";
import ViewUsers from "./components/ViewUsers";
import TodaysAppointmentsAdmin from "./components/TodaysAppointmentsAdmin";
const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          {/* LoginPage */}
          <Route path="/" element={<LoginPage />} />

          {/*Admin Dashboard */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          {/* VIEW POC: POCs for a Department */}
          <Route path="/view-poc" element={<ViewPOC />} />
          
          {/* VIEW POC: Appointments for a POC */}
          <Route path="/view-appointments" element={<ViewAppointments />} /> 

          {/* Update availability */}
          <Route path="/update-availability" element={<UpdateAvailability />} />

          {/* Add new appointment */}
          <Route path="/add-new-appointment" element={<AddNewAppointment />} />

          {/* poc dashboard*/}
          <Route path="/poc-dashboard" element={<DoctorDashboard />} />  

          <Route path='/update-availability-poc' element={<AvailabilityManager />} />

          {/*Logout page */}
          <Route path="/logout" element={<LogoutPage />} />

          {/* Signup page */}
          <Route path="/signup" element={<SignupPage />} />

          <Route path="/verify-email/:token/:pocId" element={<EmailVerificationPage />} />

          <Route path="/create-password" element={<CreatePasswordPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/reset-password/:token/:pocId" element={<ResetPasswordPage />} />

          <Route path="/todays-appointments" element={<TodaysAppointments />} />;

          <Route path="/add-poc" element={<AddPOC />} />

          <Route path="/update-schedule" element={<UpdateSchedule />} />

          <Route path="/poc-user-profile" element={<UserProfile />} />

          <Route path="/doctors" element={<DoctorsList/>} />

          <Route path="/appointment-details" element = {<AppointmentDetails />} />

          <Route path="/appointment-details-admin" element={<AppointmentDetailsAdmin />} />  

          <Route path="/departments" element={<DepartmentList />} />  

          <Route path="/meet-link" element={<EditGMeetLink />} /> 

          <Route path="/fees" element={<EditConsultationFees />} /> 

          <Route path="/users" element={<ViewUsers />} /> 

          <Route path="/admin-todays-appointments" element={<TodaysAppointmentsAdmin />} />;

        </Routes>
      </div>
    </Router>
  );
};

export default App;
