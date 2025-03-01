const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'chatbotdynamic',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Wrap the pool with promises
const promisePool = pool.promise();

promisePool.getConnection()
    .then((connection) => {
        console.log('Database connected successfully');
        connection.release(); // Release the connection back to the pool
    })
    .catch((err) => {
        console.error('Database connection failed:', err.message);
    });

module.exports = promisePool;