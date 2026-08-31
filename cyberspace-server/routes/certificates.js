const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../mdw/auth');

// ============================================================
// GET /api/certificates - Get all certificates or filter by user and/or program
// ============================================================
router.get('/', authenticateToken, (req, res) => {
  const { teacher_id, program_id } = req.query;
  let query = `
    SELECT tc.*, 
           u.username AS teacher_username, 
           p.title AS program_title, 
           admin.username AS issued_by_username
    FROM teacher_certifications tc
    JOIN users u ON tc.teacher_id = u.id
    JOIN programs p ON tc.program_id = p.id
    LEFT JOIN users admin ON tc.assigned_by = admin.id
    WHERE 1=1
  `;
  const params = [];

  if (teacher_id) {
    query += ` AND tc.teacher_id = ?`;
    params.push(teacher_id);
  }
  if (program_id) {
    query += ` AND tc.program_id = ?`;
    params.push(program_id);
  }

  query += ` ORDER BY tc.issued_at DESC`;

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
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

// ============================================================
// 3. PUT /api/certificates/:id - Update an existing certificate code
// ============================================================
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { certificate_code } = req.body;

  if (!certificate_code) {
    return res.status(400).json({ success: false, message: 'certificate_code is required' });
  }

  const query = `UPDATE teacher_certifications SET certificate_code = ? WHERE id = ?`;

  db.query(query, [certificate_code, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Certificate not found' });
    
    res.json({ success: true, message: 'Certificate updated successfully' });
  });
});

module.exports = router;