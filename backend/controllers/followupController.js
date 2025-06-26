const pool = require("../models/db");
const setFollowup = async(req, res) => {
    const { appointmentId, followupDate } = req.body;

    try {
        // Start a transaction
        await pool.query('START TRANSACTION');

        // Update the appointment table
        await pool.execute(
            `UPDATE Appointments 
       SET Is_Followup = 1 
       WHERE Appointment_ID = ?`, [appointmentId]
        );

        // Insert into followups table
        await pool.execute(
            `INSERT INTO Followups 
       (Appointment_ID, Followup_Date, Status, Created_At)
       VALUES (?, ?, 'Scheduled', NOW())`, [appointmentId, followupDate]
        );

        // Commit the transaction
        await pool.query('COMMIT');

        res.json({ success: true });
    } catch (error) {
        // Rollback if any error occurs
        await pool.query('ROLLBACK');
        console.error("Error setting followup:", error);
        res.status(500).json({ message: "Error setting followup" });
    }
};

const getFollowups = async(req, res) => {
    const { clientId } = req.body;

    try {
        const [results] = await pool.execute(`
      SELECT 
        f.Followup_ID AS FollowupId,
        f.Followup_Date,
        f.Status,
        u.User_Name AS PatientName,
        DATE_FORMAT(a.Appointment_Date, '%Y-%m-%d') AS OriginalDate,
        a.Appointment_Time AS OriginalTime
      FROM Followups f
      JOIN Appointments a ON f.Appointment_ID = a.Appointment_ID
      JOIN Users u ON a.User_ID = u.User_ID
      WHERE a.Client_ID = ? AND f.Followup_Date >= CURDATE()
      ORDER BY f.Followup_Date ASC
    `, [clientId]);

        res.json(results);
    } catch (error) {
        console.error("Error fetching followups:", error);
        res.status(500).json({ message: "Error fetching followups" });
    }
};



module.exports = { setFollowup, getFollowups };