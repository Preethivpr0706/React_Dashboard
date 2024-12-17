const express = require('express');
const cors = require('cors');
const pocRoutes = require('./routes/pocRoutes');
const app = express();

// Enable CORS  
app.use(cors());

// Parse JSON bodies  
app.use(express.json());

// Middleware to log incoming requests  
app.use((req, res, next) => {
    console.log(`${req.method} request made to: ${req.url}`);
    next(); // Pass to the next middleware/route handler  
});

app.use('/api', pocRoutes);

// Handle root route  
app.get('/', (req, res) => {
    res.send('Welcome to the Express server!');
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});