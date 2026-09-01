require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // <-- ADD THIS

const db = require('./db');
const exportSchema = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

//----------Middleware
app.use(cors());
app.use(bodyParser.json());

// ---------- Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/lessonsAssignment', require('./routes/lessonsAssignment'))
app.use('/api/lessonProgress', require('./routes/lessonsProgress'))
app.use('/api/certificates', require('./routes/certificates'))
app.use('/api/testRoutes', require('./routes/test'));

// Serves files inside "public/uploads" under the "/uploads" endpoint
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const mysql = require('mysql2');

// Automatically verify and create the database if it doesn't exist
const dbName = process.env.DB_NAME || 'cyberspace_db';
const bootstrapConnection = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // 🔥 FIX 1: Enforce SSL for TiDB Cloud connections
    ssl: { rejectUnauthorized: false }
});

bootstrapConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
    if (err) {
        console.error('⚠️ Could not automatically verify/create database:', err.message);
        // 🔥 FIX 2: If it fails, safely close instead of executing commands on a closed socket
        bootstrapConnection.destroy();
        return;
    } else {
        console.log(`✔ Database "${dbName}" checked/created successfully.`);
        bootstrapConnection.end();
    }

    // Now establish connection pool and initialize tables
    db.getConnection(async (poolErr, connection) => {
        if (poolErr) return console.error('DB connection failed:', poolErr);
        console.log('✔ Connected to MySQL database via Pool.');
        connection.release();
        // await exportSchema();
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✔ Server running on http://localhost:${PORT}`);
        console.log(`✔ Database running on http://${process.env.DB_HOST}:${process.env.DB_PORT}`);
    });
}

module.exports = app;
