require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const db = require('./db');
const initDatabase = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

//----------Middleware
app.use(cors());
app.use(bodyParser.json());

// ---------- Routes
// register
// registrations
app.use('/api/users', require('./routes/users'));
app.use('/api/', require('./routes/register'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/testRoutes', require('./routes/test'));

// ---------- Start
app.use('/uploads', express.static('uploads'));
db.getConnection(async (err, connection) => {
    if (err) return console.error('DB connection failed:', err);
    console.log('✔ Connected to MySQL database.');
    connection.release();
    // when you want to initialise new database
    // await initDatabase();
});

app.listen(PORT, () => {
    console.log(`✔ Server running on http://localhost:${PORT}`);
});
