const express           = require('express');
const router            = express.Router();
const db                = require('../db');
const authenticateToken = require('../mdw/auth');

router.get('/', authenticateToken, (req, res) => {
    const query = ` 
        SELECT u.id, u.username, r.name as role_name 
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id 
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

// 2. UPDATE: Change user role
router.put('/:id', authenticateToken, (req, res) => {
    const { role_id } = req.body;
    const userId = req.params.id;
    console.log('info:  ', req.body, userId)
    const query = 'UPDATE users SET role_id = ? WHERE id = ?';
    
    db.query(query, [role_id, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to update user role' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        
        res.json({ message: 'User role updated successfully' });
    });
});

// 3. DELETE: Remove user account
router.delete('/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;

    const query = 'DELETE FROM users WHERE id = ?';

    db.query(query, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to delete user' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User deleted successfully' });
    });
});


module.exports = router;
