const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../mdw/auth');

// ============================================================
// 1. GET /api/lessonsAssignment
// ============================================================
router.get('/', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            p.id,
            p.title AS program_title,
            p.lesson_status AS status,
            (SELECT COUNT(*) FROM lessons l WHERE l.program_id = p.id) AS lessons_count
        FROM programs p
        ORDER BY p.id ASC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json(results);
    });
});

// ============================================================
// GET /api/lessonsAssignment/teacher/:teacherId
// ============================================================
router.get('/teacher/:teacherId', authenticateToken, (req, res) => {
  const { teacherId } = req.params;
  const query = `
    SELECT 
      tpa.program_id, 
      tpa.sequence,
      tpa.assigned_at,
      p.title AS program_title, 
      p.lesson_status
    FROM teacher_program_assignments tpa
    JOIN programs p ON tpa.program_id = p.id
    WHERE tpa.teacher_id = ?
    ORDER BY tpa.sequence ASC
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
    return res.json({ success: true, data: results });
  });
});

// ============================================================
// GET /api/lessonsAssignment/my-assignments
// ============================================================
router.get('/my-assignments', authenticateToken, (req, res) => {
  const teacher_id = req.user.id;
  const query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.lesson_status,
      p.image_url,
      p.icon,
      tpa.sequence,
      CASE 
        WHEN (
          SELECT COUNT(*) 
          FROM lessons l 
          WHERE l.program_id = p.id
        ) > 0 AND (
          SELECT COUNT(*) 
          FROM lessons l 
          LEFT JOIN teacher_lesson_progress tlp 
            ON l.id = tlp.lesson_id AND tlp.teacher_id = ?
          WHERE l.program_id = p.id AND (tlp.status = 'completed')
        ) = (
          SELECT COUNT(*) 
          FROM lessons l 
          WHERE l.program_id = p.id
        ) THEN 1 
        ELSE 0 
      END AS is_completed
    FROM teacher_program_assignments tpa
    JOIN programs p ON tpa.program_id = p.id
    WHERE tpa.teacher_id = ? 
      AND p.lesson_status IN ('active', 'inactive')
    ORDER BY tpa.sequence ASC
  `;

  db.query(query, [teacher_id, teacher_id], (err, results) => {
    if (err) {
      console.error('Database error in my-assignments:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    return res.json({ success: true, data: results });
  });
});

// ============================================================
// PUT /api/lessonsAssignment/teacher/:teacherId (Replaces program endpoint)
// ============================================================
router.put('/teacher/:teacherId', authenticateToken, (req, res) => {
  const assigned_by = req.user.id;
  const { teacherId } = req.params;
  const { programs } = req.body; // Expects an array of { program_id, sequence }

  if (!Array.isArray(programs)) {
    return res.status(400).json({ success: false, message: 'programs must be an array' });
  }

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ success: false, message: 'Connection failed', error: err });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ success: false, message: 'Transaction error', error: err });
      }

      // Step 1: Clear old assignments for this teacher
      connection.query('DELETE FROM teacher_program_assignments WHERE teacher_id = ?', [teacherId], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ success: false, message: 'Failed to clear assignments', error: err });
          });
        }

        if (programs.length === 0) {
          return connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ success: false, message: 'Commit error', error: err });
              });
            }
            connection.release();
            return res.json({ success: true, message: 'Roster cleared successfully' });
          });
        }

        // Step 2: Insert new sequenced roster
        const values = programs.map((p, index) => [teacherId, p.program_id, assigned_by, p.sequence || index + 1]);
        const insertQuery = `
          INSERT INTO teacher_program_assignments (teacher_id, program_id, assigned_by, sequence) 
          VALUES ?
        `;

        connection.query(insertQuery, [values], (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ success: false, message: 'Failed to insert new assignments', error: err });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ success: false, message: 'Commit error', error: err });
              });
            }
            connection.release();
            return res.json({ success: true, message: 'Teacher program sequence updated' });
          });
        });
      });
    });
  });
});

module.exports = router;