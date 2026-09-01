const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../mdw/auth');

// ============================================================
// 1. GET /api/lessonsAssignment
// ============================================================
router.get('/', authenticateToken, (req, res) => {
  const wtf = req.body
  console.log(`--- lessonsassignment`)
  console.log(`${wtf}`)
    const query = `
        SELECT 
            p.id,
            p.title AS program_title,
            p.lesson_status AS status,
            (SELECT COUNT(*) FROM lessons l WHERE l.program_id = p.id) AS lessons_count,
            (
                SELECT GROUP_CONCAT(u.username SEPARATOR ', ')
                FROM teacher_program_assignments tpa
                JOIN users u ON tpa.teacher_id = u.id
                WHERE tpa.program_id = p.id
            ) AS assigned_teachers
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
      tpa.assigned_at,
      p.title AS program_title, 
      p.lesson_status
    FROM teacher_program_assignments tpa
    JOIN programs p ON tpa.program_id = p.id
    WHERE tpa.teacher_id = ?
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
    return res.json({ success: true, data: results });
  });
});

// ============================================================
// GET /api/lessonsAssignment/my-assignments
// Dedicated filtered query for program info, status, and certificate completion
// ============================================================
router.get('/my-assignments', authenticateToken, (req, res) => {
  const teacher_id = req.user.id; // Extracted from authenticated user token
  // console.log('--- lessonsassignment /my-assignments')
  // console.log(teacher_id)
  const query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.lesson_status,
      p.image_url,
      p.icon,
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
      AND p.lesson_status IN ('active', 'inactive') -- <--- ADD THIS FILTER HERE
    ORDER BY p.id ASC
  `;

  // Pass teacher_id twice for both subquery checks and the main WHERE clause
  db.query(query, [teacher_id, teacher_id], (err, results) => {
    if (err) {
      console.error('Database error in my-assignments:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    return res.json({ success: true, data: results });
  });
});

// ============================================================
// 2. GET /api/lessonsAssignment/program/:programId
// ============================================================
router.get('/program/:programId', authenticateToken, (req, res) => {
  const { programId } = req.params;
  const query = `
    SELECT 
      tpa.teacher_id, tpa.assigned_at, tpa.assigned_by,
      u.username AS teacher_name, u.email AS teacher_email
    FROM teacher_program_assignments tpa
    JOIN users u ON tpa.teacher_id = u.id
    WHERE tpa.program_id = ?
  `;

  db.query(query, [programId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
    return res.json({ success: true, data: results });
  });
});

// ============================================================
// 5. PUT /api/lessonsAssignment/program/:programId
// ============================================================
router.put('/program/:programId', authenticateToken, (req, res) => {
  const assigned_by = req.user.id;
  const { programId } = req.params;
  const { teacherIds } = req.body;

  console.log("+++ api/lessonsassignment/program/:programId")

  if (!Array.isArray(teacherIds)) {
    return res.status(400).json({ success: false, message: 'teacherIds must be an array' });
  }

  // Use getConnection to safely lock a connection for the transaction
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ success: false, message: 'Connection failed', error: err });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ success: false, message: 'Transaction error', error: err });
      }

      // Step 1: Clear old assignments
      connection.query('DELETE FROM teacher_program_assignments WHERE program_id = ?', [programId], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ success: false, message: 'Failed to clear assignments', error: err });
          });
        }

        // If no new teachers, commit here
        if (teacherIds.length === 0) {
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

        // Step 2: Insert new roster
        const values = teacherIds.map(tId => [tId, programId, assigned_by]);
        const insertQuery = `
          INSERT INTO teacher_program_assignments (teacher_id, program_id, assigned_by) 
          VALUES ?
        `;

        // console.log(values)
        // console.log(insertQuery)

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
            return res.json({ success: true, message: 'Program roster updated' });
          });
        });
      });
    });
  });
});

module.exports = router;
