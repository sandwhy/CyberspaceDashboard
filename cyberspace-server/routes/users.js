const express           = require('express');
const router            = express.Router();
const db                = require('../db');
const authenticateToken = require('../mdw/auth');

// ============================================================
// 1. GET /api/users - Get users with role, notes, and assigned programs
// ============================================================
router.get('/', authenticateToken, (req, res) => {
    const query = ` 
        SELECT 
            u.id, 
            u.username, 
            r.name as role_name, 
            u.notes,
            (
                SELECT GROUP_CONCAT(p.title ORDER BY tpa.sequence SEPARATOR ', ')
                FROM teacher_program_assignments tpa
                JOIN programs p ON tpa.program_id = p.id
                WHERE tpa.teacher_id = u.id
            ) AS assigned_teachers
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id 
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json(results);
    });
});

// ============================================================
// 2. PUT /api/users/:id - Update user role and notes
// ============================================================
router.put('/:id', authenticateToken, (req, res) => {
    const { role_id, notes } = req.body;
    const userId = req.params.id;
    
    const query = 'UPDATE users SET role_id = ?, notes = ? WHERE id = ?';
    
    db.query(query, [role_id, notes || null, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to update user' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found' });
        
        res.json({ success: true, message: 'User updated successfully' });
    });
});

// ============================================================
// 3. DELETE /api/users/:id - Remove user account
// ============================================================
router.delete('/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    const query = 'DELETE FROM users WHERE id = ?';

    db.query(query, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to delete user' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, message: 'User deleted successfully' });
    });
});

module.exports = router;