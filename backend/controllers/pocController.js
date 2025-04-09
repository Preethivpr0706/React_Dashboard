const pool = require("../models/db");
const moment = require("moment-timezone");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly set the path to the .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Login Function
async function matchLoginCredentials(req, res) {
    const { email, password, role, clientId } = req.body;

    try {
        if (role === 'admin') {
            // Fetch admin details from the database
            const [admin] = await pool.execute(
                "SELECT Admin_Password, Client_Name FROM client WHERE Admin_Email = ? AND Client_ID = ?", [email, clientId]
            );

            if (admin.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

            const storedPassword = admin[0].Admin_Password;

            // **Directly compare the passwords since admin passwords are not hashed**
            if (password !== storedPassword) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

            const token = jwt.sign({ clientId, role }, process.env.SECRET_KEY, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax'
            });

            return res.json({ success: true, message: 'Login successful!', clientId, clientName: admin[0].Client_Name });
        }

        // Check POC credentials (with hashed password comparison)
        const [rows] = await pool.execute('SELECT POC_ID, Password FROM poc WHERE Email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const pocId = rows[0].POC_ID;
        const hashedPassword = rows[0].Password;

        // Compare entered password with the hashed password for POC users
        const isValidPassword = await bcrypt.compare(password, hashedPassword);

        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign({ pocId, role }, process.env.SECRET_KEY, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        });

        return res.json({ success: true, message: 'Login successful!', pocId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to login.' });
    }
}

// Logout Function
function logout(req, res) {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Logged out successfully!' });
}


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

async function contactMails(req, res) {
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Replace with your SMTP host
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: 'preethivpr0706@gmail.com',
            pass: 'rgtpjumiiztkbktn', // App password    
        }
    });

    const { name, email, message } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: 'harishradhakrishnan2001@gmail.com', // Recipient address
        subject: `New Contact Form Submission from ${name}`,
        html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    try {
        // Send email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send message' });
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
                pass: 'rgtpjumiiztkbktn', // App password    
            },
        });

        const verificationLink = `http://localhost:3000/verify-email/${token}/${pocId}`;

        await transporter.sendMail({
            to: email,
            subject: 'Verify your email',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Hello,</p>
            <p>Please verify your email address by clicking the button below:</p>
            <p style="margin: 25px 0;">
                <a href="${verificationLink}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px;">
                    Verify Email Address
                </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${verificationLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr>
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
    `,
            text: `Please verify your email by visiting this link: ${verificationLink}\n\nThis link will expire in 1 hour.`
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
                pass: 'rgtpjumiiztkbktn',
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
        //console.log(clientId);
        const query1 = `SELECT * FROM poc_available_slots WHERE POC_ID = ? AND (Schedule_Date > CURDATE() OR (Schedule_Date = CURDATE() AND Start_Time >= CURTIME())) ORDER BY Schedule_Date, Start_Time`;
        const query2 = `SELECT * FROM poc_schedules WHERE POC_ID = ?`;
        const query3 = `SELECT Client_Name FROM client WHERE Client_ID = ?`;
        const query4 = `SELECT POC_Name, Specialization FROM poc WHERE POC_ID = ? AND Client_ID=?`;

        const [availableSlots] = await pool.execute(query1, [pocId]);
        const [schedules] = await pool.execute(query2, [pocId]);
        const [client] = await pool.execute(query3, [clientId]);
        const [poc] = await pool.execute(query4, [pocId, clientId]);
        //console.log(availableSlots);

        //console.log(schedules);
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


    // console.log(appointmentDetails);
    // console.log(poc);
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
    const { name, phone, email, location, clientId } = req.body;

    try {
        console.log("Request body:", req.body); // Log incoming request data
        const [user] = await pool.execute(
            "SELECT User_ID FROM Users WHERE User_Contact = ? and Client_ID= ?", [phone, clientId]
        );

        console.log("Existing user query result:", user); // Log query result

        if (user.length > 0) {
            console.log("User already exists with ID:", user[0].User_ID);
            return res.json({ userId: user[0].User_ID });
        }

        const [result] = await pool.execute(
            "INSERT INTO Users (User_Name, User_Contact, User_Email, User_Location, Client_ID) VALUES (?, ?, ?, ?, ?)", [name, phone, email, location, clientId]
        );

        console.log("User created with ID:", result.insertId);
        res.json({ userId: result.insertId });
    } catch (error) {
        console.error("Error in createUser function:", error.message); // Log the exact error
        res.status(500).json({ error: error.message });
    }
};

// Verify if user exists by phone number
const verifyUser = async(req, res) => {
    const { phone, clientId } = req.body;

    try {
        const [user] = await pool.execute(
            "SELECT User_ID, User_Name, User_Email, User_Location FROM Users WHERE User_Contact = ? AND Client_ID = ?", [phone, clientId]
        );

        if (user.length > 0) {
            // User found
            res.json({
                exists: true,
                userId: user[0].User_ID,
                name: user[0].User_Name,
                email: user[0].User_Email,
                location: user[0].User_Location
            });
        } else {
            // User not found
            res.json({
                exists: false
            });
        }
    } catch (error) {
        console.error("Error verifying user:", error);
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
// Modified createAppointment function to include payment status
const createAppointment = async(req, res) => {
    const { userId, pocId, date, time, type, paymentStatus } = req.body;
    const clientId = req.body.clientId;
    console.log(req.body);

    try {
        // Insert the new appointment with payment status  
        const [result] = await pool.execute(
            "INSERT INTO Appointments (Client_ID, User_ID, POC_ID, Appointment_Date, Appointment_Time, Appointment_Type, Status, Is_Active, Payment_Status) VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', true, ?)", [clientId, userId, pocId, date, time, type, paymentStatus || 'Pay_later']
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

// Update full availability with reason
const updateFullAvailability = async(req, res) => {
    const { pocId, date, reason } = req.body;
    try {
        await pool.execute(
            `UPDATE poc_available_slots 
             SET Active_Status = 'blocked', 
                 reason = ?
             WHERE POC_ID = ? AND Schedule_Date = ?`, [reason, pocId, date]
        );
        res.status(200).json({ message: 'Full availability updated successfully.' });
    } catch (error) {
        console.error('Error updating full availability:', error.message);
        res.status(500).json({ message: 'Error updating full availability.' });
    }
};

// Update partial availability with reason
const updatePartialAvailability = async(req, res) => {
    const { pocId, date, timings, reason } = req.body;
    try {
        if (!timings || timings.length === 0) {
            return res.status(400).json({ message: 'No timings selected.' });
        }

        const escapedTimings = timings.map(timing => pool.escape(timing));
        const query = `UPDATE poc_available_slots 
                      SET Active_Status = 'blocked', 
                          reason = ?
                      WHERE POC_ID = ? AND Schedule_Date = ? AND Start_Time IN (${escapedTimings.join(', ')})`;

        await pool.execute(query, [reason, pocId, date]);
        res.status(200).json({ message: 'Partial availability updated successfully.' });
    } catch (error) {
        console.error('Error updating partial availability:', error.message);
        res.status(500).json({ message: 'Error updating partial availability.' });
    }
};

// Get blocked slots for a doctor
const getBlockedSlots = async(req, res) => {
    const { pocId } = req.body;

    if (!pocId) {
        return res.status(400).json({ message: 'POC ID is required' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT 
            slot_id,
            DATE_FORMAT(Schedule_Date, '%Y-%m-%d') AS schedule_date,
            Start_Time AS start_time,
            Active_Status,
            reason
         FROM poc_available_slots
         WHERE POC_ID = ?
           AND (Schedule_Date > CURDATE() 
                OR (Schedule_Date = CURDATE() AND Start_Time >= CURTIME()))
         ORDER BY Schedule_Date, Start_Time`, [pocId]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error fetching slots:', error.message);
        res.status(500).json({ message: 'Error fetching slots.' });
    }
};

// Unblock slot by ID
const unblockSlotById = async(req, res) => {
    const { slotId } = req.body;
    console.log("by id");
    console.log(req.body);

    if (!slotId) {
        return res.status(400).json({ message: 'Slot ID is required' });
    }

    try {
        await pool.execute(
            `UPDATE poc_available_slots 
             SET Active_Status = 'unblocked',
                 reason = NULL
             WHERE slot_id = ?`, [slotId]
        );
        res.status(200).json({ message: 'Slot unblocked successfully.' });
    } catch (error) {
        console.error('Error unblocking slot:', error.message);
        res.status(500).json({ message: 'Error unblocking slot.' });
    }
};

// Unblock slot by date/time
const unblockSlot = async(req, res) => {
    const { pocId, date, time } = req.body;
    console.log(req.body);
    console.log("in date")

    if (!pocId || !date) {
        return res.status(400).json({ message: 'POC ID and date are required' });
    }

    try {
        if (time) {
            // Unblock specific time slot
            await pool.execute(
                `UPDATE poc_available_slots 
                 SET Active_Status = 'unblocked',
                     reason = NULL
                 WHERE POC_ID = ? AND Schedule_Date = ? AND Start_Time = ?`, [pocId, date, time]
            );
        } else {
            // Unblock entire date
            await pool.execute(
                `UPDATE poc_available_slots 
                 SET Active_Status = 'unblocked',
                     reason = NULL
                 WHERE POC_ID = ? AND Schedule_Date = ?`, [pocId, date]
            );
        }
        res.status(200).json({ message: 'Slot unblocked successfully.' });
    } catch (error) {
        console.error('Error unblocking slot:', error.message);
        res.status(500).json({ message: 'Error unblocking slot.' });
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

// poc dashboard - total and cancelled
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

// poc dashboard - appointments by type
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

// poc dashboard - appointments details
const appointmentDetails = async(req, res) => {
    const { pocId, status, type } = req.body;
    try {
        let query;
        let params;

        if (status) {
            query = "SELECT a.Payment_Status, a.Appointment_ID, u.User_Name, u.User_Contact, u.User_Location, p.POC_Name, p.Specialization, a.Appointment_Type, DATE_FORMAT(a.Appointment_Date, '%d-%b-%Y') as Appointment_Date, a.Appointment_Time FROM Appointments a JOIN Users u ON a.User_ID = u.User_ID JOIN POC p ON a.POC_ID = p.POC_ID WHERE a.POC_ID = ? AND a.Status = ? AND (a.Appointment_Date > CURDATE() OR (a.Appointment_Date = CURDATE() AND a.Appointment_Time >= CURTIME()))";
            params = [pocId, status];
        } else if (type) {
            query = "SELECT a.Payment_Status, a.Appointment_ID, u.User_Name, u.User_Contact, u.User_Location, p.POC_Name, p.Specialization, a.Appointment_Type, DATE_FORMAT(a.Appointment_Date, '%d-%b-%Y') as Appointment_Date, a.Appointment_Time FROM Appointments a JOIN Users u ON a.User_ID = u.User_ID JOIN POC p ON a.POC_ID = p.POC_ID WHERE a.POC_ID = ? AND a.Appointment_Type = ? AND a.Status = 'Confirmed' AND (a.Appointment_Date > CURDATE() OR (a.Appointment_Date = CURDATE() AND a.Appointment_Time >= CURTIME()))";
            params = [pocId, type];
        } else {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        const [rows] = await pool.execute(query, params);

        const appointments = rows.map((row) => ({
            AppointmentID: row.Appointment_ID,
            UserName: row.User_Name,
            UserContact: row.User_Contact,
            UserLocation: row.User_Location,
            POCName: row.POC_Name,
            Specialization: row.Specialization,
            AppointmentType: row.Appointment_Type,
            AppointmentDate: row.Appointment_Date,
            AppointmentTime: row.Appointment_Time,
            Payment_Status: row.Payment_Status,
        }));

        res.json(appointments);
    } catch (error) {
        console.error("Error fetching appointment details:", error.message);
        res.status(500).json({ message: "Error fetching appointment details" });
    }
};


const pocTodayAppointments = async(req, res) => {
    const { pocId } = req.body;

    try {
        const [appointments] = await pool.execute(
            `SELECT 
                a.Appointment_ID AS AppointmentId,
                a.Appointment_Time AS AppointmentTime,
                a.Appointment_Type AS AppointmentType,
                u.User_Name AS PatientName,
                a.Status,
                a.Is_Active 
            FROM Appointments a
            JOIN Users u ON a.User_ID = u.User_ID
            WHERE a.POC_ID = ? 
              AND a.Appointment_Date = CURDATE()
            ORDER BY a.Appointment_Time`, [pocId]
        );

        res.json(appointments);
    } catch (error) {
        console.error("Error fetching today's appointments:", error.message);
        res.status(500).json({ message: "Error fetching today's appointments" });
    }
};

// API to update appointment status
const updateAppointmentStatus = async(req, res) => {
    const { appointmentId, status } = req.body;

    try {
        const isActive = status === "Confirmed" ? 1 : 0; // Revert isActive to 1 if status is Confirmed

        await pool.execute(
            `UPDATE Appointments 
             SET Status = ?, Is_Active = ? 
             WHERE Appointment_ID = ?`, [status, isActive, appointmentId]
        );

        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (error) {
        console.error("Error updating appointment status:", error.message);
        res.status(500).json({ message: "Error updating appointment status" });
    }
};

const adminTodayAppointments = async(req, res) => {
    const { clientId } = req.body; // Fetch clientId from request body

    try {
        const [appointments] = await pool.execute(
            `SELECT 
                a.Appointment_ID AS AppointmentId,
                a.Appointment_Time AS AppointmentTime,
                a.Appointment_Type AS AppointmentType,
                u.User_Name AS PatientName,
                a.Status,
                a.Is_Active 
            FROM Appointments a
            JOIN Users u ON a.User_ID = u.User_ID
            WHERE a.Client_ID = ?
              AND a.Appointment_Date = CURDATE()
            ORDER BY a.Appointment_Time`, [clientId]
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
        Meet_Link = null, // Default to null if not provided  
        Consultation_Fees = 0.00, // Default to null if not provided  
        External_POC_ID = null, // New field  
    } = req.body;

    // Validate required input  
    if (!Client_ID || !Department_ID || !POC_Name || !Specialization || !Contact_Number || !Email) {
        return res.status(400).json({ error: "Required fields are missing." });
    }

    // Insert new POC into database  
    const sql = `  
       INSERT INTO poc (Client_ID, Department_ID, POC_Name, Specialization, Contact_Number, Email, Meet_Link, Fees, External_POC_ID)  
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)  
    `;
    const values = [
        Client_ID,
        Department_ID,
        POC_Name,
        Specialization,
        Contact_Number,
        Email,
        Meet_Link,
        Consultation_Fees,
        External_POC_ID,
    ];

    try {
        const [result] = await pool.execute(sql, values);
        return res.status(200).json({ pocId: result.insertId });
    } catch (err) {
        console.error("Error inserting data into database:", err);
        return res.status(500).json({ error: "Failed to add POC. Please try again later." });
    }
};




//upcoming appointments in user profile page of POC

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


const adminAppointmentDetails = async(req, res) => {
    const { clientId, status } = req.body;
    try {
        const [rows] = await pool.execute(
            "SELECT a.Payment_Status, a.Appointment_ID, u.User_Name, u.User_Contact, u.User_Location, p.POC_Name, p.Specialization, a.Appointment_Type, DATE_FORMAT(a.Appointment_Date, '%d-%b-%Y') as Appointment_Date, a.Appointment_Time FROM Appointments a JOIN Users u ON a.User_ID = u.User_ID JOIN POC p ON a.POC_ID = p.POC_ID WHERE a.Client_ID = ? AND a.Status = ? AND (a.Appointment_Date > CURDATE() OR (a.Appointment_Date = CURDATE() AND a.Appointment_Time >= CURTIME()))", [clientId, status]
        );

        const appointments = rows.map((row) => ({
            AppointmentID: row.Appointment_ID,
            UserName: row.User_Name,
            UserContact: row.User_Contact,
            UserLocation: row.User_Location,
            POCName: row.POC_Name,
            Specialization: row.Specialization,
            AppointmentType: row.Appointment_Type,
            AppointmentDate: row.Appointment_Date,
            AppointmentTime: row.Appointment_Time,
            Payment_Status: row.Payment_Status,
        }));

        res.json(appointments);
    } catch (error) {
        console.error("Error fetching appointment details:", error.message);
        res.status(500).json({ message: "Error fetching appointment details" });
    }
};

const adminDepartments = async(req, res) => {
    const { clientId } = req.body;
    try {
        const departmentQuery = `  
      SELECT DISTINCT l.Value_name AS DepartmentName,  
      (SELECT COUNT(*) FROM POC p WHERE p.Department_ID = l.Item_ID AND p.Client_ID = ?) AS NoOfPOCs  
      FROM List l  
      WHERE l.Client_ID = ? AND l.Key_name = 'DEPARTMENT'  
     `;
        const [departments] = await pool.execute(departmentQuery, [clientId, clientId]);

        // Convert the NoOfPOCs column to a number  
        departments.forEach((dept) => {
            dept.NoOfPOCs = parseInt(dept.NoOfPOCs);
        });

        res.json(departments);
    } catch (err) {
        console.error("Error fetching departments:", err);
        res.status(500).json({ message: "Error fetching departments" });
    }
};

const getSchedule = async(req, res) => {
    console.log("Get Schedule fn called");
    const pocId = req.params.pocId;
    const query = "SELECT * FROM POC_Schedules WHERE POC_ID = ?";

    try {
        const results = await pool.query(query, [pocId]);
        console.log(results);
        const scheduleData = results[0].map((result) => ({
            day: result.Day_of_Week,
            timeIntervals: [{
                startTime: result.Start_Time,
                endTime: result.End_Time,
                appointmentsPerSlot: result.appointments_per_slot,
                slotDuration: result.slot_duration,
            }, ],
        }));

        const groupedScheduleData = scheduleData.reduce((acc, current) => {
            const existingDay = acc.find((day) => day.day === current.day);
            if (existingDay) {
                existingDay.timeIntervals.push(...current.timeIntervals);
            } else {
                acc.push(current);
            }
            return acc;
        }, []);
        console.log(groupedScheduleData);
        res.send(groupedScheduleData);
    } catch (err) {
        console.error("Error fetching schedule:", err);
        res.status(500).send({ message: "Error fetching schedule" });
    }
}


const updateSchedule = async(req, res) => {
    const schedule = req.body.schedule;
    console.log(schedule);

    if (schedule.length > 0) {
        try {
            // Delete existing schedule only for the specific days being updated
            const deleteQuery = "DELETE FROM POC_Schedules WHERE POC_ID = ? AND Day_of_Week = ?";
            for (const day of schedule) {
                await pool.query(deleteQuery, [day.pocId, day.day]); // Deleting only the schedule for the specific day
            }

            // Insert new schedule for the POC
            const insertQuery =
                "INSERT INTO POC_Schedules (POC_ID, Day_of_Week, Start_Time, End_Time, appointments_per_slot, slot_duration) VALUES ?";
            const values = schedule.flatMap((day) =>
                day.timeIntervals.map((interval) => [
                    day.pocId,
                    day.day,
                    interval.startTime,
                    interval.endTime,
                    interval.appointmentsPerSlot,
                    interval.slotDuration,
                ])
            );
            await pool.query(insertQuery, [values]);
            res.send({ message: "Schedule updated successfully" });
        } catch (err) {
            console.error("Error updating schedule:", err);
            res.status(500).send({ message: "Error updating schedule" });
        }
    } else {
        res.send({ message: "No schedule data provided" });
    }
};


const getMeetLink = async(req, res) => {
    try {
        const pocId = req.body.pocId;
        console.log('Getting meet link for POC ID:', pocId);
        const query = 'SELECT Meet_Link FROM POC WHERE POC_ID = ?';
        const [results] = await pool.query(query, [pocId]);
        if (results.length > 0 && results[0].Meet_Link) {
            console.log('Meet link found:', results[0].Meet_Link);
            res.send({ success: true, link: results[0].Meet_Link });
        } else {
            console.log('No meet link found');
            res.send({ success: true, link: null });
        }
    } catch (err) {
        console.error('Error getting meet link:', err);
        res.status(500).send({ success: false, message: 'Error getting meet link' });
    }
};



const UpdateMeetLink = async(req, res) => {
    try {
        const { pocId, link } = req.body;
        console.log('Updating meet link for POC ID:', pocId, 'with link:', link);
        const query = 'UPDATE POC SET Meet_Link = ? WHERE POC_ID = ?';
        const result = pool.execute(query, [link, pocId]);
        console.log('Meet link updated successfully');
        res.send({ success: true });

    } catch (err) {
        console.error('Error updating meet link:', err);
        res.status(500).send({ success: false, message: 'Error updating meet link' });
    }
};

const getConsultationFees = async(req, res) => {
    try {
        const pocId = req.body.pocId;
        console.log('Getting consultation fees for POC ID:', pocId);
        const query = 'SELECT Fees FROM POC WHERE POC_ID = ?';
        const [results] = await pool.query(query, [pocId]);
        if (results.length > 0 && results[0].Fees) {
            console.log('Consultation fees found:', results[0].Fees);
            res.send({ success: true, fees: results[0].Fees });
        } else {
            console.log('No consultation fees found');
            res.send({ success: true, fees: null });
        }
    } catch (err) {
        console.error('Error getting consultation fees:', err);
        res.status(500).send({ success: false, message: 'Error getting consultation fees' });
    }
};


const updateConsultationFees = async(req, res) => {
    try {
        const { pocId, fees } = req.body;
        console.log('Updating consultation fees for POC ID:', pocId, 'with fees:', fees);
        const query = 'UPDATE POC SET Fees = ? WHERE POC_ID = ?';
        const result = await pool.execute(query, [fees, pocId]);
        console.log('Consultation fees updated successfully');
        res.send({ success: true });
    } catch (err) {
        console.error('Error updating consultation fees:', err);
        res.status(500).send({ success: false, message: 'Error updating consultation fees' });
    }
};

const getUserDetails = async(req, res) => {
    const { clientId } = req.body;

    if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
    }

    try {
        const query = `
        SELECT User_ID, User_Name, User_Contact, User_Email, User_Location
        FROM users
        WHERE Client_ID = ?`;
        const [users] = await pool.execute(query, [clientId]);

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// In pocController.js, update the controller function

const updateProfileImage = async(req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const pocId = req.body.pocId;

        // Get file information
        const fileName = req.file.filename;

        // Store the complete URL path for the image
        // This is important: Include the full path that the frontend will use
        const fileUrl = `/api/uploads/profile-images/${fileName}`;

        console.log('Saving image path to database:', fileUrl);

        // Update database with new profile image URL
        const query = `
            UPDATE POC 
            SET profile_image = ? 
            WHERE POC_ID = ?
        `;

        await pool.query(query, [fileUrl, pocId]);

        res.json({
            success: true,
            message: 'Profile image updated successfully',
            imageUrl: fileUrl
        });
    } catch (err) {
        console.error('Error updating profile image:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// // Fetch doctor (POC) details
// const fetchPOC = async(req, res) => {
//     const pocId = req.params.pocId;
//     const imageLink = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300';
//     const query = `
//       SELECT 
//         POC_Name AS name, 
//         Specialization AS specialization, 
//         'MD, FACC' AS qualification, 
//         Contact_Number AS phone, 
//         Email AS email, 
//         'Medical Center, New York' AS location, 
//         ? AS image
//       FROM POC 
//       WHERE POC_ID = ?;
//     `;

//     try {
//         const [result] = await pool.query(query, [imageLink, pocId]);
//         res.json(result[0]);
//     } catch (err) {
//         console.error("Error fetching POC details:", err);
//         res.status(500).send('Server error');
//     }
// };

const fetchPOCImage = async(req, res) => {
    const pocId = req.params.pocId;


    const query = `
    SELECT 
      p.POC_Name AS name,
      p.Email AS email,
      p.Contact_Number AS phone,
      p.Specialization AS specialization,
      'MBBS' AS qualification,
      p.profile_image,
      4 AS experience,
      4.44 AS rating,
      (SELECT COUNT(DISTINCT User_ID) FROM Appointments WHERE POC_ID = p.POC_ID) AS patientCount
    FROM POC p
    WHERE p.POC_ID = ?;
  `;


    try {
        const [pocDetails] = await pool.query(query, [pocId]);

        if (pocDetails.length === 0) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.json(pocDetails[0]);
    } catch (err) {
        console.error("Error fetching POC details:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getUserDetails,
    getConsultationFees,
    updateConsultationFees,
    getMeetLink,
    UpdateMeetLink,
    getSchedule,
    updateSchedule,
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
    adminTodayAppointments,
    updateAppointmentStatus,
    addPOC,
    fetchAppointmentDetails,
    getDoctorsForClient,
    adminAppointmentCount,
    fetchDepartmentDoctorCount,
    appointmentDetails,
    adminDepartments,
    adminAppointmentDetails,
    updateProfileImage,
    fetchPOCImage,
    logout,
    contactMails,
    getBlockedSlots,
    unblockSlot,
    unblockSlotById,
    verifyUser
};