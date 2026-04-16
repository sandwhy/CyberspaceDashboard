require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cyberspace_db'
});

db.connect(async (err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    try {
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        console.log('Generated hash for admin123');

        // Update or Insert
        // Using ON DUPLICATE KEY UPDATE to handle both cases (if user exists or not)
        // Assuming username is UNIQUE
        const query = `
            INSERT INTO users (username, password_hash, role_id) 
            VALUES ('admin', ?, 1) 
            ON DUPLICATE KEY UPDATE password_hash = ?
        `;
        
        db.query(query, [hash, hash], (err, result) => {
            if (err) {
                console.error('Error updating admin:', err);
            } else {
                console.log('Admin password reset successfully to: admin123');
            }
            db.end();
        });
    } catch (error) {
        console.error('Error:', error);
        db.end();
    }
});
