const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../mdw/auth');

// ============================================================
// GET /api/certificates - Get certificates (auto-filters by token if user isn't querying explicitly)
// ============================================================
router.get('/', authenticateToken, (req, res) => {
  let { teacher_id, program_id } = req.query;
  
  // If no teacher_id is explicitly passed, default to the logged-in user's ID
  // (You can add an admin role check here if admins need to view all certificates by default)
  if (!teacher_id) {
    teacher_id = req.user.id;
  }

  let query = `
    SELECT tc.*, 
           u.username AS teacher_username, 
           p.title AS program_title, 
           admin.username AS issued_by_username
    FROM teacher_certifications tc
    JOIN users u ON tc.teacher_id = u.id
    JOIN programs p ON tc.program_id = p.id
    LEFT JOIN users admin ON tc.assigned_by = admin.id
    WHERE tc.teacher_id = ?
  `;
  const params = [Number(teacher_id)];

  if (program_id) {
    query += ` AND tc.program_id = ?`;
    params.push(Number(program_id));
  }

  query += ` ORDER BY tc.issued_at DESC`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error in GET /api/certificates:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    res.json({ success: true, data: results });
  });
});

// ============================================================
// GET /api/certificates/my-certificates - Get certificates for the currently logged-in user
// ============================================================
router.get('/my-certificates', authenticateToken, (req, res) => {
  const teacher_id = req.user.id; // Extracted securely from the Bearer token middleware

  const query = `
    SELECT tc.*, 
           u.username AS teacher_username, 
           p.title AS program_title, 
           admin.username AS issued_by_username
    FROM teacher_certifications tc
    JOIN users u ON tc.teacher_id = u.id
    JOIN programs p ON tc.program_id = p.id
    LEFT JOIN users admin ON tc.assigned_by = admin.id
    WHERE tc.teacher_id = ?
    ORDER BY tc.issued_at DESC
  `;

  db.query(query, [teacher_id], (err, results) => {
    if (err) {
      console.error('Database error in GET /api/certificates/my-certificates:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    res.json({ success: true, data: results });
  });
});

// ============================================================
// POST /api/certificates - Issue a new certificate
// ============================================================
router.post('/', authenticateToken, (req, res) => {
  const assigned_by = req.user.id; // Operator issuing the certificate
  const { teacher_id, program_id, certificate_code, image_link } = req.body;

  if (!teacher_id || !program_id || !certificate_code) {
    return res.status(400).json({ success: false, message: 'teacher_id, program_id, and certificate_code are required' });
  }

  const query = `
    INSERT INTO teacher_certifications (teacher_id, program_id, assigned_by, certificate_code, image_link)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [teacher_id, program_id, assigned_by, certificate_code, image_link || null], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Certificate already issued for this user/program combination' });
      }
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    res.status(201).json({ success: true, message: 'Certificate generated successfully', id: result.insertId });
  });
});

module.exports = router;