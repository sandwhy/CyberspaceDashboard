require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

(async () => {
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
                process.exit(1);
            } else {
                console.log('Admin password reset successfully to: admin123');
                process.exit(0);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
