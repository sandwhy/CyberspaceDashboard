const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const router     = express.Router();
const db         = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'Something very different';

// POST /api/auth/login
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
        if (err)                  return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const user         = results[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role_name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ success: true, token, username: user.username, role: user.role_name });
    });
});

// POST /api/auth/register - public registration form
router.post('/register', (req, res) => {
    const { parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience, bot_field } = req.body;

    if (bot_field) {
        console.log('Spam bot detected!');
        return res.status(200).json({ message: 'Registration successful!' });
    }

    if (!parent_name || !whatsapp_number || !child_name || !child_age) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const query  = `INSERT INTO registrations (parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ message: 'Registration successful!', registrationId: result.insertId });
    });
});

module.exports = router;