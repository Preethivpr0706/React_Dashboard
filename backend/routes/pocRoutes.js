const express = require("express");
const router = express.Router();
const {
    getClients,
    verifyPOCEmail,
    verifyEmail,
    createUser,
    getDepartments,
    getPocsByDepartment,
    getAppointmentDetailsForPoc,
    getAvailableDates,
    getAvailableTimes,
    createAppointment,
    updateFullAvailability,
    updatePartialAvailability,
    getAvailableTimesForUpdate,
    getAvailableDatesForUpdate,
    updatePassword,
    matchLoginCredentials,
    requestPasswordReset,
    resetPassword,
    getClientFromPOC,
    pocAppointmentCount,
    pocTypeAppointments,
    pocTodayAppointments,
    addPOC,
    fetchPOC,
    fetchAppointmentDetails,
    getDoctorsForClient,
    adminAppointmentCount,
    fetchDepartmentDoctorCount
} = require("../controllers/pocController");


router.post('/clients', getClients);
router.post("/users", createUser);
router.post("/departments", getDepartments);
router.post("/pocs", getPocsByDepartment);
router.post("/appointments", getAppointmentDetailsForPoc);
router.post("/pocs/available-dates", getAvailableDates);
router.post("/pocs/available-times", getAvailableTimes);
router.post("/create-appointments", createAppointment);
router.post("/pocs/available-times-update", getAvailableTimesForUpdate);
router.post("/pocs/available-dates-update", getAvailableDatesForUpdate);
router.post('/pocs/update-full', updateFullAvailability);
router.post('/pocs/update-partial', updatePartialAvailability);
router.post('/verify-poc-email', verifyPOCEmail);
router.post('/verify-email', verifyEmail);
router.post('/update-password', updatePassword);
router.post('/poc-login', matchLoginCredentials);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/getClientId', getClientFromPOC);
router.post('/poc/appointment-count', pocAppointmentCount);
router.post('/poc/typeAppointment', pocTypeAppointments);
router.post("/poc/todays-appointments", pocTodayAppointments);
router.post("/add-poc", addPOC);
router.get('/doctor/:pocId', fetchPOC);
router.get('/poc/appointments/:pocId', fetchAppointmentDetails);
router.post("/poc/get-doctors", getDoctorsForClient);
router.post('/admin/appointment-count', adminAppointmentCount);
router.post('/admin/total-departments-doctors', fetchDepartmentDoctorCount);

module.exports = router;