// authMiddleware.js with role information
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    console.log('Cookie received:', req.cookies);
    const token = req.cookies.token;

    if (!token) {
        console.log('No token found in cookies');
        return res.status(401).send({ message: 'Unauthorized: No token provided' });
    }

    try {
        console.log('Attempting to verify token');
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Token verified, decoded:', decoded);

        // Include the user information in the request
        req.user = decoded; // This already contains role, clientId/pocId based on your login logic

        next();
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(401).send({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;