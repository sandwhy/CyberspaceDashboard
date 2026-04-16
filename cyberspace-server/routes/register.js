// routes/register.js
const express = require('express');
const bcrypt = require('bcryptjs'); // Already imported
const router  = express.Router();
const db      = require('../db');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../mdw/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'Something very different';

// --- NEW STAFF REGISTRATION ROUTE ---
router.post('/register-staff', async (req, res) => {
    console.log('hello its going here')
    const { username, password } = req.body;

    // 1. Validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // 2. Check if username already exists to prevent DB crashes
        db.query('SELECT id FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (results.length > 0) {
                return res.status(400).json({ message: 'Username already taken.' });
            }

            // 3. Hash the password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // 4. Insert into users table
            // role_id is NULL by default (Pending), is_active is 1 by default
            const query = `INSERT INTO users (username, password_hash, role_id, is_active) VALUES (?, ?, 4, 1)`;
            
            db.query(query, [username, password_hash], (err, result) => {
                if (err) return res.status(500).json({ message: 'Failed to create account.', error: err });
                
                res.status(201).json({ 
                    success: true, 
                    message: 'Staff account created successfully. Please wait for Admin approval.' 
                });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// ---------- LEGACY LOGIN (Intact) ----------
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const query = `
        SELECT u.id, u.username, u.password_hash, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.username = ?
    `;

    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const user          = results[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role_name },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ success: true, token, username: user.username, role: user.role_name });
    });
});

// ---------- LEGACY REGISTRATION (Public Student Form - Intact) ----------
// router.post('/register', (req, res) => {
//     const { parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience, bot_field } = req.body;

//     if (bot_field) {
//         console.log('Spam bot detected!');
//         return res.status(200).json({ message: 'Registration successful!' });
//     }

//     if (!parent_name || !whatsapp_number || !child_name || !child_age) {
//         return res.status(400).json({ message: 'Please provide all required fields.' });
//     }

//     const query  = `INSERT INTO registrations (parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience) VALUES (?, ?, ?, ?, ?, ?)`;
//     const values = [parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience];

//     db.query(query, values, (err, result) => {
//         if (err) return res.status(500).json({ message: 'Database error', error: err });
//         res.status(201).json({ message: 'Registration successful!', registrationId: result.insertId });
//     });
// });

// ---------- LEGACY VIEW REGISTRATIONS (Intact) ----------
router.get('/registrations', authenticateToken, (req, res) => {
    const limit       = parseInt(req.query.limit) || 0;
    let query         = 'SELECT * FROM registrations ORDER BY created_at DESC';
    const queryParams = [];

    if (limit > 0) {
        query += ' LIMIT ?';
        queryParams.push(limit);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

module.exports = router;