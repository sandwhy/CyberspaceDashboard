const express           = require('express');
const router            = express.Router();
const db                = require('../db');
const authenticateToken = require('../mdw/auth');

// ============================================================
// 1. GET /api/lessons
// Fetch all lessons (or filter by ?program_id=X)
// ============================================================
router.get('/lessons', authenticateToken, (req, res) => {
    const { program_id } = req.query;

    let query = `
        SELECT 
            l.id,
            l.program_id,
            p.title AS program_title,
            l.title,
            l.sequence_order,
            l.is_required,
            l.created_at
        FROM lessons l
        LEFT JOIN programs p ON l.program_id = p.id
    `;
    
    const params = [];

    if (program_id) {
        query += ` WHERE l.program_id = ?`;
        params.push(program_id);
    }

    query += ` ORDER BY l.program_id ASC, l.sequence_order ASC`;

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});


// ============================================================
// 2. GET /api/lessons/progress
// Fetch lesson progress (Teachers get their own; Admins can filter by ?teacher_id=X)
// ============================================================
router.get('/progress', authenticateToken, (req, res) => {
    // Force teachers to view only their own records; admins/operators can specify ?teacher_id=
    const teacherId = req.user.role === 'teacher' ? req.user.id : (req.query.teacher_id || null);

    let query = `
        SELECT 
            tlp.id,
            tlp.teacher_id,
            u.username AS teacher_name,
            tlp.lesson_id,
            l.title AS lesson_title,
            l.sequence_order,
            l.is_required,
            l.program_id,
            p.title AS program_title,
            tlp.status,
            tlp.completed_at
        FROM teacher_lesson_progress tlp
        JOIN users u    ON tlp.teacher_id = u.id
        JOIN lessons l  ON tlp.lesson_id  = l.id
        LEFT JOIN programs p ON l.program_id = p.id
    `;

    const params = [];

    if (teacherId) {
        query += ` WHERE tlp.teacher_id = ?`;
        params.push(teacherId);
    }

    query += ` ORDER BY tlp.teacher_id ASC, l.program_id ASC, l.sequence_order ASC`;

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});


// ============================================================
// 3. GET /api/certifications
// Fetch earned certificates (Teachers get their own; Admins can view all or filter by ?teacher_id=X)
// ============================================================
router.get('/certifications', authenticateToken, (req, res) => {
    const teacherId = req.user.role === 'teacher' ? req.user.id : (req.query.teacher_id || null);

    let query = `
        SELECT 
            tc.id,
            tc.teacher_id,
            u.username AS teacher_name,
            tc.program_id,
            p.title AS program_title,
            tc.certificate_code,
            tc.issued_at
        FROM teacher_certifications tc
        JOIN users u    ON tc.teacher_id = u.id
        JOIN programs p ON tc.program_id = p.id
    `;

    const params = [];

    if (teacherId) {
        query += ` WHERE tc.teacher_id = ?`;
        params.push(teacherId);
    }

    query += ` ORDER BY tc.issued_at DESC`;

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

module.exports = router;