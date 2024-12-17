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
    matchLoginCredentials
} = require("../controllers/pocController");

router.get('/clients', getClients);
router.post("/users", createUser);
router.get("/departments", getDepartments);
router.get("/pocs/:departmentId", getPocsByDepartment);
router.get("/appointments/:pocId", getAppointmentDetailsForPoc);
router.post("/pocs/available-dates", getAvailableDates);
router.post("/pocs/available-times", getAvailableTimes);
router.post("/create-appointments", createAppointment);
router.post("/pocs/available-times-update", getAvailableTimesForUpdate);
router.post("/pocs/available-dates-update", getAvailableDatesForUpdate);
router.post('/pocs/update-full', updateFullAvailability);
router.post('/pocs/update-partial', updatePartialAvailability);
router.post('/verify-poc-email', verifyPOCEmail);
router.get('/verify-email/:token/:pocId', verifyEmail);
router.post('/update-password', updatePassword);
router.post('/poc-login', matchLoginCredentials);

//poc dashboard

module.exports = router;