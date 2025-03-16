// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import withAuth from './withAuth';
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
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";

const AuthenticatedAdminDashboard = withAuth(AdminDashboard);
const AuthenticatedViewPOC = withAuth(ViewPOC);
const AuthenticatedViewAppointments = withAuth(ViewAppointments);
const AuthenticatedUpdateAvailability = withAuth(UpdateAvailability);
const AuthenticatedAddNewAppointment = withAuth(AddNewAppointment);
const AuthenticatedDoctorDashboard = withAuth(DoctorDashboard);
const AuthenticatedAvailabilityManager = withAuth(AvailabilityManager);
const AuthenticatedLogoutPage = withAuth(LogoutPage);
const AuthenticatedTodaysAppointments = withAuth(TodaysAppointments);
const AuthenticatedAddPOC = withAuth(AddPOC);
const AuthenticatedUserProfile = withAuth(UserProfile);
const AuthenticatedDoctorsList = withAuth(DoctorsList);
const AuthenticatedAppointmentDetails = withAuth(AppointmentDetails);
const AuthenticatedAppointmentDetailsAdmin = withAuth(AppointmentDetailsAdmin);
const AuthenticatedDepartmentList = withAuth(DepartmentList);
const AuthenticatedUpdateSchedule = withAuth(UpdateSchedule);
const AuthenticatedEditGMeetLink = withAuth(EditGMeetLink);
const AuthenticatedEditConsultationFees = withAuth(EditConsultationFees);
const AuthenticatedViewUsers = withAuth(ViewUsers);
const AuthenticatedTodaysAppointmentsAdmin = withAuth(TodaysAppointmentsAdmin);

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email/:token/:pocId" element={<EmailVerificationPage />} />
          <Route path="/create-password" element={<CreatePasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token/:pocId" element={<ResetPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Protected routes */}
          <Route path="/admin-dashboard" element={<AuthenticatedAdminDashboard />} />
          <Route path="/view-poc" element={<AuthenticatedViewPOC />} />
          <Route path="/view-appointments" element={<AuthenticatedViewAppointments />} />
          <Route path="/update-availability" element={<AuthenticatedUpdateAvailability />} />
          <Route path="/add-new-appointment" element={<AuthenticatedAddNewAppointment />} />
          <Route path="/poc-dashboard" element={<AuthenticatedDoctorDashboard />} />
          <Route path="/update-availability-poc" element={<AuthenticatedAvailabilityManager />} />
          <Route path="/logout" element={<AuthenticatedLogoutPage />} />
          <Route path="/todays-appointments" element={<AuthenticatedTodaysAppointments />} />
          <Route path="/add-poc" element={<AuthenticatedAddPOC />} />
          <Route path="/poc-user-profile" element={<AuthenticatedUserProfile />} />
          <Route path="/doctors" element={<AuthenticatedDoctorsList />} />
          <Route path="/appointment-details" element={<AuthenticatedAppointmentDetails />} />
          <Route path="/appointment-details-admin" element={<AuthenticatedAppointmentDetailsAdmin />} />
          <Route path="/departments" element={<AuthenticatedDepartmentList />} />
          <Route path="/update-schedule" element={<AuthenticatedUpdateSchedule />} />
          <Route path="/meet-link" element={<AuthenticatedEditGMeetLink />} />
          <Route path="/fees" element={<AuthenticatedEditConsultationFees />} />
          <Route path="/users" element={<AuthenticatedViewUsers />} />
          <Route path="/admin-todays-appointments" element={<AuthenticatedTodaysAppointmentsAdmin />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
