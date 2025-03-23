const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pocRoutes = require('./routes/pocRoutes');
const authMiddleware = require('./routes/authMiddleware');
const { matchLoginCredentials, logout, verifyEmail, verifyPOCEmail, updatePassword, requestPasswordReset, resetPassword } = require('./controllers/pocController');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS with credentials support
app.use(cors({
    origin: 'http://localhost:3000', // Replace with actual frontend URL
    credentials: true // Allow cookies
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Ensure uploads directory exists
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(publicDir, 'uploads');
const profileImagesDir = path.join(uploadsDir, 'profile-images');

// Create directories if they don't exist
[publicDir, uploadsDir, profileImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Serve static files from public directory
app.use('/api/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`${req.method} request made to: ${req.url}`);
    next();
});

// Authentication Routes
app.post('/api/poc-login', matchLoginCredentials);
app.post('/api/logout', logout);

app.post('/api/clients', (req, res) => {
    // Call the getClients function without authentication
    const clients = require('./controllers/pocController').getClients;
    clients(req, res);
});

app.get('/api/auth/validate', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'User is authenticated', user: req.user });
});

app.post('/api/verify-poc-email', verifyPOCEmail);
app.post('/api/verify-email', verifyEmail);
app.post('/api/update-password', updatePassword);
app.post('/api/request-password-reset', requestPasswordReset);
app.post('/api/reset-password', resetPassword);

app.use('/api', authMiddleware, pocRoutes);


// Additional route to verify image accessibility
app.get('/check-image-path', (req, res) => {
    const imagePath = req.query.path;
    if (!imagePath) {
        return res.status(400).json({ exists: false, error: 'No path provided' });
    }

    // Remove /api/ prefix if present
    const relativePath = imagePath.replace(/^\/api\//, '');
    const fullPath = path.join(__dirname, 'public', relativePath);

    console.log('Checking image path:', { requested: imagePath, fullPath });

    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ exists: false, path: fullPath, error: err.message });
        }
        res.json({ exists: true, path: fullPath });
    });
});

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to the Express server!');
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});