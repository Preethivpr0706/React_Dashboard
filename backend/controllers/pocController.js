const pool = require("../models/db");
const moment = require("moment-timezone");
const crypto = require('crypto');
const nodemailer = require('nodemailer');


async function getClients(req, res) {
    try {
        // Fetch clients from the database
        const [clients] = await pool.execute('SELECT Client_ID, Client_Name FROM client');
        res.json(clients); // Send the list of clients to the frontend
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}


async function verifyPOCEmail(req, res) {
    const { clientId, email } = req.body;

    try {
        const [rows] = await pool.execute('SELECT * FROM poc WHERE Client_ID = ? AND Email = ?', [clientId, email]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Mail ID doesn't exist in the POC table. Please check the mail ID." });
        }

        const pocId = rows[0].POC_ID;

        // Check if a password already exists for the given email  
        if (rows[0].Password !== null) {
            return res.status(400).json({ success: false, message: 'Email already registered. Please login to continue.' });
        }

        // Generate a token    
        const token = crypto.randomBytes(32).toString('hex');

        // Store the token temporarily    
        await pool.execute('INSERT INTO verification_tokens (email, token) VALUES (?, ?)', [email, token]);

        // Send email using nodemailer    
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'preethivpr0706@gmail.com',
                pass: 'wtkxtzdfgyltercn', // App password    
            },
        });

        const verificationLink = `http://localhost:3000/verify-email/${token}/${pocId}`;

        await transporter.sendMail({
            to: email,
            subject: 'Email Verification',
            html: `<p>Please click <a href="${verificationLink}">here</a> to verify your email. </p> <p>Link will be expired after a hour.</p>`,
        });

        res.json({ success: true, message: 'Verification email sent successfully. Please check your email.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}



async function verifyEmail(req, res) {
    const { token, pocId } = req.body; // Use req.body to receive data
    console.log('Received token:', token);
    console.log('Received pocId:', pocId);

    try {
        // Check for token in the database
        const [rows] = await pool.execute('SELECT * FROM verification_tokens WHERE token = ?', [token]);

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Email has already been verified or token is expired.' });
        }

        const email = rows[0].email;

        // Check if the token has already been used
        if (rows[0].used_at !== null) {
            // Delete the token
            await pool.execute('DELETE FROM verification_tokens WHERE token = ?', [token]);

            return res.json({ success: true, message: 'Email has already been verified.', email });
        }

        // Mark the token as used
        await pool.execute('UPDATE verification_tokens SET used_at = NOW() WHERE token = ?', [token]);

        // Delete the token
        await pool.execute('DELETE FROM verification_tokens WHERE token = ?', [token]);

        res.json({ success: true, message: 'Email verified successfully!', email, pocId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}


// Update password  
const bcrypt = require('bcrypt');

async function updatePassword(req, res) {
    const { email, password, pocId } = req.body;
    console.log(pocId);

    try {
        // Hash the password   
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.execute('UPDATE poc SET Password = ? WHERE Email = ? AND POC_ID = ?', [hashedPassword, email, pocId]);
        res.json({ success: true, message: 'Password updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update password.' });
    }
};


async function matchLoginCredentials(req, res) {
    const { email, password, role, clientId } = req.body;

    try {
        if (role === 'admin') {
            // Check admin credentials
            const [admin] = await pool.execute(
                "SELECT * FROM client WHERE Admin_Email = ? AND Admin_Password = ? AND Client_ID = ?", [email, password, clientId]
            );

            if (admin.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

            return res.json({ success: true, message: 'Login successful!', clientId });
        }

        // Check POC credentials
        const [rows] = await pool.execute('SELECT POC_ID, Password FROM poc WHERE Email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const pocId = rows[0].POC_ID;
        const hashedPassword = rows[0].Password;

        // Compare the provided password with the hashed password
        const isValidPassword = await bcrypt.compare(password, hashedPassword);

        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        return res.json({ success: true, message: 'Login successful!', pocId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to login.' });
    }
}

async function requestPasswordReset(req, res) {
    const { email } = req.body;
    try {
        // Check if the email exists
        const [rows] = await pool.execute('SELECT POC_ID FROM poc WHERE Email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Email not found." });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const pocId = rows[0].POC_ID;

        // Store the token
        await pool.execute('INSERT INTO verification_tokens (email, token) VALUES (?, ?)', [email, token]);

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'preethivpr0706@gmail.com',
                pass: 'wtkxtzdfgyltercn',
            },
        });

        const resetLink = `http://localhost:3000/reset-password/${token}/${pocId}`;

        await transporter.sendMail({
            to: email,
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        });

        res.json({ success: true, message: 'Password reset email sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}

async function resetPassword(req, res) {
    const { token, pocId, newPassword } = req.body;

    try {
        // Validate token
        const [rows] = await pool.execute('SELECT * FROM verification_tokens WHERE token = ? AND email = (SELECT Email FROM poc WHERE POC_ID = ?)', [token, pocId]);
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
        }

        const email = rows[0].email;

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE poc SET Password = ? WHERE Email = ? AND POC_ID = ?', [hashedPassword, email, pocId]);

        // Delete the token
        await pool.execute('DELETE FROM verification_tokens WHERE token = ?', [token]);

        res.json({ success: true, message: 'Password reset successful.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}

// Fetch departments from the List table  
async function getDepartments(req, res) {
    const clientId = req.body.clientId;
    try {
        const [departments] = await pool.execute(
            `SELECT Key_name, Value_name, Item_ID as departmentId FROM list WHERE Client_ID = ? AND Key_name = 'DEPARTMENT' ORDER BY Display_Order`, [clientId]
        );
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error.message);
        res.status(500).json({ message: 'Error fetching departments' });
    }
}

// Fetch POCs by department  
async function getPocsByDepartment(req, res) {
    const { departmentId } = req.body;
    const clientId = req.body.clientId;
    try {
        const [pocs] = await pool.execute(
            `SELECT * FROM poc WHERE Client_ID = ? AND Department_ID = ?`, [clientId, departmentId]
        );
        res.json(pocs);
    } catch (error) {
        console.error('Error fetching POCs:', error.message);
        res.status(500).json({ message: 'Error fetching POCs' });
    }
}
// Function to fetch POC details and their appointments  
const getAppointmentDetailsForPoc = async(req, res) => {
    try {
        console.log(req.body);
        const pocId = req.body.pocId;
        const clientId = req.body.clientId;
        console.log(clientId);
        const query1 = `SELECT * FROM poc_available_slots WHERE POC_ID = ? AND (Schedule_Date > CURDATE() OR (Schedule_Date = CURDATE() AND Start_Time >= CURTIME())) ORDER BY Schedule_Date, Start_Time`;
        const query2 = `SELECT * FROM poc_schedules WHERE POC_ID = ?`;
        const query3 = `SELECT Client_Name FROM client WHERE Client_ID = ?`;
        const query4 = `SELECT POC_Name, Specialization FROM poc WHERE POC_ID = ? AND Client_ID=?`;

        const [availableSlots] = await pool.execute(query1, [pocId]);
        const [schedules] = await pool.execute(query2, [pocId]);
        const [client] = await pool.execute(query3, [clientId]);
        const [poc] = await pool.execute(query4, [pocId, clientId]);

        const appointmentDetails = [];
        let sNo = 1;
        availableSlots.forEach((slot) => {
            const schedule = schedules.find(
                (schedule) =>
                schedule.Day_of_Week === getDayOfWeek(slot.Schedule_Date) &&
                schedule.Start_Time <= slot.Start_Time &&
                schedule.End_Time >= slot.End_Time
            );
            if (schedule) {
                const appointmentsCount = schedule.appointments_per_slot - slot.appointments_per_slot;
                const date = moment(slot.Schedule_Date);
                const time = moment(slot.Start_Time, "HH:mm:ss");

                if (appointmentsCount > 0) {
                    appointmentDetails.push({
                        sNo: sNo++,
                        date: date.format("YYYY-MM-DD"),
                        day: date.format("dddd"),
                        time: time.format("HH:mm:ss"),
                        noOfAppointments: appointmentsCount,
                        totalSlots: schedule.appointments_per_slot,
                    });
                }
            }
        });

        res.json({
            appointmentDetails,
            clientName: client[0].Client_Name,
            pocName: poc[0].POC_Name,
            pocSpecialization: poc[0].Specialization,
        });
    } catch (err) {
        console.error("Error fetching appointment details:", err.message);
        res.status(500).json({ error: "Error fetching appointment details" });
    }
};

// Helper function to get the day of the week from a date
function getDayOfWeek(date) {
    const dayOfWeek = new Date(date).getDay();
    switch (dayOfWeek) {
        case 0:
            return "Sunday";
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thursday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
    }
}

// Create or update user details
const createUser = async(req, res) => {
    const { name, phone, email, location } = req.body;

    try {
        console.log("Request body:", req.body); // Log incoming request data
        const [user] = await pool.execute(
            "SELECT User_ID FROM Users WHERE User_Contact = ?", [phone]
        );

        console.log("Existing user query result:", user); // Log query result

        if (user.length > 0) {
            console.log("User already exists with ID:", user[0].User_ID);
            return res.json({ userId: user[0].User_ID });
        }

        const [result] = await pool.execute(
            "INSERT INTO Users (User_Name, User_Contact, User_Email, User_Location) VALUES (?, ?, ?, ?)", [name, phone, email, location]
        );

        console.log("User created with ID:", result.insertId);
        res.json({ userId: result.insertId });
    } catch (error) {
        console.error("Error in createUser function:", error.message); // Log the exact error
        res.status(500).json({ error: error.message });
    }
};


// Fetch available dates for a POC
const getAvailableDates = async(req, res) => {
    const { pocId } = req.body;
    console.log(pocId);

    if (!pocId) {
        return res.status(400).json({ error: "POC ID is required" });
    }

    try {
        const [dates] = await pool.execute(
            `SELECT DISTINCT
  DATE_FORMAT(Schedule_Date, '%Y-%m-%d') AS Schedule_Date
FROM poc_available_slots
WHERE POC_ID = ?
  AND Schedule_Date >= CURDATE()
  AND appointments_per_slot > 0
  AND Active_Status = 'unblocked'
  AND EXISTS (
    SELECT 1
    FROM poc_available_slots AS slots
    WHERE slots.POC_ID = poc_available_slots.POC_ID
      AND slots.Schedule_Date = poc_available_slots.Schedule_Date
      AND (slots.Schedule_Date > CURDATE() OR (slots.Schedule_Date = CURDATE() AND slots.Start_Time >= CURTIME()))
  )
ORDER BY Schedule_Date
LIMIT 10`, [pocId]
        );
        console.log(dates);
        res.json(dates.map((row) => row.Schedule_Date));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Fetch available times for a POC on a selected date
const getAvailableTimes = async(req, res) => {
    const { pocId, date } = req.body;

    try {
        const [times] = await pool.execute(
            `SELECT DISTINCT   
        Start_Time AS appointment_time   
        FROM poc_available_slots   
        WHERE POC_ID = ?   
        AND Schedule_Date = STR_TO_DATE(?, '%Y-%m-%d')   
        AND appointments_per_slot > 0   
        AND Active_Status = 'unblocked'
        AND (Schedule_Date > CURDATE() OR (Schedule_Date = CURDATE() AND Start_Time >= CURTIME()))   
        ORDER BY Start_Time`, [pocId, date]
        );
        res.json(times.map((t) => t.appointment_time));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


//Create appointment  
const createAppointment = async(req, res) => {
    const { userId, pocId, date, time, type } = req.body;
    const clientId = req.body.clientId;
    console.log(req.body);

    try {
        // Insert the new appointment  
        const [result] = await pool.execute(
            "INSERT INTO Appointments (Client_ID, User_ID, POC_ID, Appointment_Date, Appointment_Time, Appointment_Type, Status, Is_Active) VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', true)", [clientId, userId, pocId, date, time, type]
        );

        console.log("Appointment created with ID:", result.insertId);

        // Update available slots
        const updateQuery = `
     UPDATE POC_Available_Slots
     SET appointments_per_slot = appointments_per_slot - 1
     WHERE POC_ID = ? AND Schedule_Date = ? AND Start_Time = ? AND appointments_per_slot > 0;
  `;
        const [updateResult] = await pool.execute(updateQuery, [pocId, date, time]);

        if (updateResult.affectedRows === 0) {
            console.warn("No available slots to update for the given POC ID, date, and time.");
            // Optionally handle this scenario by reverting the insert operation, if necessary.  
        }

        res.json({ appointmentId: result.insertId });
    } catch (error) {
        console.error("Error in createAppointment function:", error.message); // Log the exact error  
        res.status(500).json({ error: error.message });
    }
};
const updateFullAvailability = async(req, res) => {
    const { pocId, date } = req.body;
    console.log(req.body);
    try {
        await pool.execute(
            `UPDATE poc_available_slots SET Active_Status ='blocked' WHERE POC_ID = ? AND Schedule_Date = ?`, [pocId, date]
        );
        res.status(200).json({ message: 'Full availability updated successfully.' });
    } catch (error) {
        console.error('Error updating full availability:', error.message);
        res.status(500).json({ message: 'Error updating full availability.' });
    }
};



const updatePartialAvailability = async(req, res) => {
    const { pocId, date, timings } = req.body;
    console.log(req.body);
    try {
        if (!timings || timings.length === 0) {
            return res.status(400).json({ message: 'No timings selected.' });
        }

        const escapedTimings = timings.map(timing => pool.escape(timing));
        const query = `UPDATE poc_available_slots SET Active_Status ='blocked' WHERE POC_ID = ? AND Schedule_Date = ? AND Start_Time IN (${escapedTimings.join(', ')})`;
        const params = [pocId, date];

        await pool.execute(query, params);
        res.status(200).json({ message: 'Partial availability updated successfully.' });
    } catch (error) {
        console.error('Error updating partial availability:', error.message);
        res.status(500).json({ message: 'Error updating partial availability.' });
    }
};


//Fetch available times for a POC on a selected date for updating availability
const getAvailableTimesForUpdate = async(req, res) => {
    const { pocId, date } = req.body;
    console.log(req.body);

    try {
        const [times] = await pool.execute(
            `SELECT DISTINCT   
        Start_Time AS appointment_time,
        Active_Status AS active_status  
        FROM poc_available_slots   
        WHERE POC_ID = ?   
        AND Schedule_Date = STR_TO_DATE(?, '%Y-%m-%d')   
        AND (Schedule_Date > CURDATE() OR (Schedule_Date = CURDATE() AND Start_Time >= CURTIME()))   
        ORDER BY Start_Time`, [pocId, date]
        );
        console.log(times);
        res.json(times);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch available dates for a POC for updating availability
const getAvailableDatesForUpdate = async(req, res) => {
    const { pocId } = req.body;
    console.log(req.body);
    if (!pocId) {
        return res.status(400).json({ error: "POC ID is required" });
    }

    try {
        const [dates] = await pool.execute(
            `SELECT DISTINCT  
  DATE_FORMAT(Schedule_Date, '%Y-%m-%d') AS Schedule_Date,  
  CASE  
   WHEN EXISTS (  
    SELECT 1  
    FROM poc_available_slots AS slots  
    WHERE slots.POC_ID = poc_available_slots.POC_ID  
      AND slots.Schedule_Date = poc_available_slots.Schedule_Date  
      AND slots.Active_Status = 'blocked'  
   ) AND NOT EXISTS (  
    SELECT 1  
    FROM poc_available_slots AS slots  
    WHERE slots.POC_ID = poc_available_slots.POC_ID  
      AND slots.Schedule_Date = poc_available_slots.Schedule_Date  
      AND slots.Active_Status = 'unblocked'  
   ) THEN 'blocked'  
   WHEN EXISTS (  
    SELECT 1  
    FROM poc_available_slots AS slots  
    WHERE slots.POC_ID = poc_available_slots.POC_ID  
      AND slots.Schedule_Date = poc_available_slots.Schedule_Date  
      AND slots.Active_Status = 'unblocked'  
   ) AND NOT EXISTS (  
    SELECT 1  
    FROM poc_available_slots AS slots  
    WHERE slots.POC_ID = poc_available_slots.POC_ID  
      AND slots.Schedule_Date = poc_available_slots.Schedule_Date  
      AND slots.Active_Status = 'blocked'  
   ) THEN 'available'  
   ELSE 'partial'  
  END AS active_status  
FROM poc_available_slots  
WHERE POC_ID = ?  
  AND Schedule_Date >= CURDATE()  
ORDER BY Schedule_Date;
;
`, [pocId]
        );
        console.log(dates);
        res.json(dates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getClientFromPOC = async(req, res) => {
    const { pocId } = req.body;
    try {
        const [pocs] = await pool.execute(
            `SELECT * FROM poc WHERE POC_ID=?`, [pocId]
        );
        res.json(pocs);
    } catch (error) {
        console.error('Error fetching POCs:', error.message);
        res.status(500).json({ message: 'Error fetching POCs' });
    }
}

const pocAppointmentCount = async(req, res) => {
    const { pocId, status } = req.body;
    try {
        const [rows] = await pool.execute(
            "SELECT COUNT(*) as count FROM Appointments WHERE POC_ID=? AND Status=? AND (Appointment_Date > CURDATE() OR (Appointment_Date = CURDATE() AND Appointment_Time >= CURTIME()))", [pocId, status]
        );

        const appointmentCount = rows[0].count; // Extract the count value
        res.json({ count: appointmentCount }); // Respond with the count
    } catch (error) {
        console.error("Error fetching appointment count:", error.message);
        res.status(500).json({ message: "Error fetching appointment count" });
    }
};

const pocTypeAppointments = async(req, res) => {
    const { pocId, type } = req.body;
    try {
        const [rows] = await pool.execute(
            "SELECT COUNT(*) AS count FROM Appointments WHERE POC_ID=? AND Status='Confirmed' AND Appointment_Type=? AND (Appointment_Date > CURDATE() OR (Appointment_Date = CURDATE() AND Appointment_Time >= CURTIME()))", [pocId, type]
        );
        const appointmentCount = rows[0].count;
        res.json({ count: appointmentCount });

    } catch (error) {
        console.error("Error fetching appointment count:", error.message);
        res.status(500).json({ message: "Error fetching appointment count" });
    }
};

const pocTodayAppointments = async(req, res) => {
    const { pocId } = req.body;

    try {
        const [appointments] = await pool.execute(
            `SELECT 
          Appointment_Time as AppointmentTime, 
          Appointment_Type AS AppointmentType, 
          COUNT(*) AS AppointmentCount
        FROM Appointments
        WHERE POC_ID = ? 
          AND Appointment_Date = CURDATE()
        GROUP BY AppointmentTime, AppointmentType
        ORDER BY AppointmentTime`, [pocId]
        );

        res.json(appointments);
    } catch (error) {
        console.error("Error fetching today's appointments:", error.message);
        res.status(500).json({ message: "Error fetching today's appointments" });
    }
};

const addPOC = async(req, res) => {
    const {
        Client_ID,
        Department_ID,
        POC_Name,
        Specialization,
        Contact_Number,
        Email,
        Meet_Link,
    } = req.body;

    // Validate input  
    if (!Client_ID ||
        !Department_ID ||
        !POC_Name ||
        !Specialization ||
        !Contact_Number ||
        !Email ||
        !Meet_Link
    ) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Insert new POC into database  
    const sql = `  
     INSERT INTO poc (Client_ID, Department_ID, POC_Name, Specialization, Contact_Number, Email, Meet_Link)  
     VALUES (?, ?, ?, ?, ?, ?, ?)  
    `;
    const values = [
        Client_ID,
        Department_ID,
        POC_Name,
        Specialization,
        Contact_Number,
        Email,
        Meet_Link,
    ];

    try {
        const [result] = await pool.execute(sql, values);
        return res.status(200).json({ pocId: result.insertId });
    } catch (err) {
        console.error("Error inserting data into database:", err);
        return res
            .status(500)
            .json({ error: "Failed to add POC. Please try again later." });
    }
};

// Fetch doctor (POC) details
const fetchPOC = async(req, res) => {
    const pocId = req.params.pocId;
    const imageLink = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300';
    const query = `
      SELECT 
        POC_Name AS name, 
        Specialization AS specialization, 
        'MD, FACC' AS qualification, 
        Contact_Number AS phone, 
        Email AS email, 
        'Medical Center, New York' AS location, 
        ? AS image
      FROM POC 
      WHERE POC_ID = ?;
    `;

    try {
        const [result] = await pool.query(query, [imageLink, pocId]);
        res.json(result[0]);
    } catch (err) {
        console.error("Error fetching POC details:", err);
        res.status(500).send('Server error');
    }
};


const fetchAppointmentDetails = async(req, res) => {
    const pocId = req.params.pocId;
    console.log("Fetching appointments for POC ID:", pocId);

    const query = `
        SELECT 
            u.User_Name AS patientName, 
            a.Appointment_Type AS reason,
            TIME_FORMAT(a.Appointment_Time, '%h:%i %p') AS time,
            CASE 
                WHEN a.Appointment_Date = CURDATE() THEN 'Today' 
                ELSE DATE_FORMAT(a.Appointment_Date, '%d-%b-%Y') 
            END AS date
        FROM Appointments a
        JOIN Users u ON a.User_ID = u.User_ID
        WHERE 
            a.POC_ID = ? 
            AND a.Status = 'Confirmed' 
            AND a.Is_Active = TRUE
            AND (a.Appointment_Date > CURDATE() OR (a.Appointment_Date = CURDATE() AND a.Appointment_Time >= CURTIME()));
    `;

    try {
        const [appointments] = await pool.query(query, [pocId]);
        console.log("Fetched appointments:", appointments);
        res.json(appointments);
    } catch (err) {
        console.error("Error fetching appointments:", err);
        res.status(500).send("Server error");
    }
};

const getDoctorsForClient = async(req, res) => {
    const { clientId } = req.body;

    if (!clientId) {
        return res.status(400).json({ error: "Client ID is required." });
    }

    try {
        const query = `
        SELECT 
          poc.POC_ID AS pocId, 
          poc.Specialization AS departmentName, 
          poc.POC_Name AS pocName, 
          poc.Contact_Number AS contactNumber, 
          poc.Email AS email 
        FROM poc 
        WHERE poc.Client_ID = ?
        ORDER BY poc.Specialization, poc.POC_Name
      `;

        const [rows] = await pool.query(query, [clientId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ error: "Failed to fetch doctors." });
    }
};


const adminAppointmentCount = async(req, res) => {
    const { clientId, status } = req.body;
    try {
        const [rows] = await pool.execute(
            "SELECT COUNT(*) as count FROM Appointments WHERE Client_ID=? AND Status=? AND (Appointment_Date > CURDATE() OR (Appointment_Date = CURDATE() AND Appointment_Time >= CURTIME()))", [clientId, status]
        );

        const appointmentCount = rows[0].count; // Extract the count value
        res.json({ count: appointmentCount }); // Respond with the count
    } catch (error) {
        console.error("Error fetching appointment count:", error.message);
        res.status(500).json({ message: "Error fetching appointment count" });
    }
};

const fetchDepartmentDoctorCount = async(req, res) => {
    const { clientId } = req.body;

    try {
        // Fetch total departments  
        const departmentQuery = `  
       SELECT COUNT(DISTINCT Value_name) AS totalDepartments  
       FROM List  
       WHERE Client_ID = ? AND Key_name = 'DEPARTMENT'  
     `;
        const [departments] = await pool.execute(departmentQuery, [clientId]);

        // Fetch total doctors  
        const doctorQuery = `  
       SELECT COUNT(*) AS totalDoctors  
       FROM POC p  
       JOIN List l ON p.Department_ID = l.Item_ID  
       WHERE p.Client_ID = ? AND l.Key_name = 'DEPARTMENT'  
     `;
        const [doctorCount] = await pool.execute(doctorQuery, [clientId]);

        // Return both counts in a single response  
        res.json({
            totalDepartments: departments[0].totalDepartments,
            totalDoctors: doctorCount[0].totalDoctors,
        });

    } catch (err) {
        console.error("Error fetching department and doctor counts:", err);
        res.status(500).json({ message: "Error fetching department and doctor counts" });
    }
};



module.exports = {
    getClients,
    verifyPOCEmail,
    verifyEmail,
    updatePassword,
    getDepartments,
    getPocsByDepartment,
    getAppointmentDetailsForPoc,
    createAppointment,
    getAvailableDates,
    getAvailableTimes,
    createUser,
    updateFullAvailability,
    updatePartialAvailability,
    getAvailableTimesForUpdate,
    getAvailableDatesForUpdate,
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
};