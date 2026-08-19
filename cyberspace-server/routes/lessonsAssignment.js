const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../mdw/auth');

// GET /api/lessonsassignment
router.get('/', authenticateToken, (req, res) => {
    db.query('SELECT * FROM teacher_program_assignments', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

// ============================================================
// 1. GET /api/lessonsAssignment/program/:programId
// Get all teachers assigned to a specific program
// ============================================================
router.get('/program/:programId', authenticateToken, (req, res) => {
  const { programId } = req.params;

  const query = `
    SELECT 
      tpa.teacher_id, 
      tpa.assigned_at,
      tpa.assigned_by,
      u.name AS teacher_name,
      u.email AS teacher_email
    FROM teacher_program_assignments tpa
    JOIN users u ON tpa.teacher_id = u.id
    WHERE tpa.program_id = ?
  `;

  db.query(query, [programId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    return res.json({ success: true, data: results });
  });
});

// ============================================================
// 2. GET /api/lessonsAssignment/teacher/:teacherId
// Get all programs a specific teacher is assigned to
// ============================================================
router.get('/teacher/:teacherId', authenticateToken, (req, res) => {
  const { teacherId } = req.params;

  const query = `
    SELECT 
      tpa.program_id, 
      tpa.assigned_at,
      p.title AS program_title,
      p.lesson_status
    FROM teacher_program_assignments tpa
    JOIN programs p ON tpa.program_id = p.id
    WHERE tpa.teacher_id = ?
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    return res.json({ success: true, data: results });
  });
});

// ============================================================
// 3. POST /api/lessonsAssignment
// Assign a single teacher to a program
// Body: { teacher_id: INT, program_id: INT }
// ============================================================
router.post('/', authenticateToken, (req, res) => {
  const assigned_by = req.user.id; // The admin/operator doing the assigning
  const { teacher_id, program_id } = req.body;

  if (!teacher_id || !program_id) {
    return res.status(400).json({ success: false, message: 'Teacher ID and Program ID are required' });
  }

  const query = `
    INSERT INTO teacher_program_assignments (teacher_id, program_id, assigned_by, assigned_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE assigned_at = NOW(), assigned_by = VALUES(assigned_by)
  `;

  db.query(query, [teacher_id, program_id, assigned_by], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    return res.status(201).json({ 
      success: true, 
      message: 'Teacher assigned successfully',
      data: { teacher_id, program_id }
    });
  });
});

// ============================================================
// 4. PUT /api/lessonsAssignment/program/:programId
// Bulk update (replace) all teachers for a specific program
// Body: { teacherIds: [1, 2, 3] }
// ============================================================
router.put('/program/:programId', authenticateToken, (req, res) => {
  const assigned_by = req.user.id;
  const { programId } = req.params;
  const { teacherIds } = req.body;

  if (!Array.isArray(teacherIds)) {
    return res.status(400).json({ success: false, message: 'teacherIds must be an array' });
  }

  // Transaction to safely delete old and insert new assignments
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ success: false, message: 'Transaction error', error: err });

    // Step 1: Clear existing assignments for this program
    db.query('DELETE FROM teacher_program_assignments WHERE program_id = ?', [programId], (err, deleteResults) => {
      if (err) {
        return db.rollback(() => res.status(500).json({ success: false, message: 'Failed to clear old assignments', error: err }));
      }

      // If array is empty, just commit the deletion
      if (teacherIds.length === 0) {
        return db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error', error: err }));
          return res.json({ success: true, message: 'Roster cleared successfully' });
        });
      }

      // Step 2: Prepare bulk insert for new teachers
      const values = teacherIds.map(tId => [tId, programId, assigned_by]);
      const insertQuery = `
        INSERT INTO teacher_program_assignments (teacher_id, program_id, assigned_by, assigned_at) 
        VALUES ?
      `;

      db.query(insertQuery, [values], (err, insertResults) => {
        if (err) {
          return db.rollback(() => res.status(500).json({ success: false, message: 'Failed to insert new assignments', error: err }));
        }

        db.commit((err) => {
          if (err) {
            return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error', error: err }));
          }
          return res.json({ success: true, message: 'Program roster updated successfully' });
        });
      });
    });
  });
});

// ============================================================
// 5. DELETE /api/lessonsAssignment
// Remove a specific teacher from a program
// Body: { teacher_id: INT, program_id: INT }
// ============================================================
router.delete('/', authenticateToken, (req, res) => {
  const { teacher_id, program_id } = req.body;

  if (!teacher_id || !program_id) {
    return res.status(400).json({ success: false, message: 'Teacher ID and Program ID are required' });
  }

  const query = `
    DELETE FROM teacher_program_assignments 
    WHERE teacher_id = ? AND program_id = ?
  `;

  db.query(query, [teacher_id, program_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    return res.json({ success: true, message: 'Assignment removed successfully' });
  });
});

module.exports = router;