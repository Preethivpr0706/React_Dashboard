const express = require('express');
const cors = require('cors');
const pocRoutes = require('./routes/pocRoutes');
const app = express();
const path = require('path');
const fs = require('fs');
const authMiddleware = require('./routes/authMiddleware');


// Enable CORS  
app.use(cors());

// Parse JSON bodies  
app.use(express.json());

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
    next(); // Pass to the next middleware/route handler  
});

const { matchLoginCredentials } = require('./controllers/pocController');
app.post('/api/poc-login', matchLoginCredentials);
app.post('/api/clients', (req, res) => {
    // Call the getClients function without authentication
    const clients = require('./controllers/pocController').getClients;
    clients(req, res);
});

app.use('/api', authMiddleware, pocRoutes);

// Handle root route  
app.get('/', (req, res) => {
    res.send('Welcome to the Express server!');
});

// Additional route to verify image accessibility
app.get('/check-image-path', (req, res) => {
    const imagePath = req.query.path;
    const fullPath = path.join(__dirname, 'public', imagePath.replace('/api/', ''));

    if (fs.existsSync(fullPath)) {
        res.json({ exists: true, path: fullPath });
    } else {
        res.json({ exists: false, path: fullPath });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
    console.log(`Public directory at: ${publicDir}`);
    console.log(`Uploads directory at: ${uploadsDir}`);
});