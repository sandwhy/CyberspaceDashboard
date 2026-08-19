const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../mdw/auth');

// ============================================================
// 1. POST /api/progress/lessons/:lessonId
// Upsert lesson progress for the authenticated user
// Body: { status: 'not_started' | 'in_progress' | 'completed' }
// ============================================================
router.post('/lessons/:lessonId', authenticateToken, (req, res) => {
  const teacher_id = req.user.id; // Extracted from JWT token payload
  const { lessonId } = req.params;
  const { status = 'completed' } = req.body;

  // Validate allowed ENUM statuses
  const validStatuses = ['not_started', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  // Set timestamp if marked as completed
  const completed_at = status === 'completed' ? new Date() : null;

  // ON DUPLICATE KEY UPDATE ensures we insert on first view/completion,
  // or update the record if (teacher_id, lesson_id) unique constraint exists.
  const query = `
    INSERT INTO teacher_lesson_progress (teacher_id, lesson_id, status, completed_at)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      completed_at = VALUES(completed_at)
  `;

  db.query(query, [teacher_id, lessonId, status, completed_at], (err, result) => {
    if (err) {
      console.error('Progress update error:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    return res.json({
      success: true,
      message: `Lesson progress set to ${status}`,
      progress: {
        teacher_id,
        lesson_id: Number(lessonId),
        status,
        completed_at
      }
    });
  });
});

// ============================================================
// 2. GET /api/progress/program/:programId
// Get completion progress for all lessons in a program for current user
// ============================================================
router.get('/program/:programId', authenticateToken, (req, res) => {
  const teacher_id = req.user.id;
  const { programId } = req.params;

  const query = `
    SELECT 
      l.id AS lesson_id,
      l.title,
      l.sequence_order,
      COALESCE(tlp.status, 'not_started') AS status,
      tlp.completed_at
    FROM lessons l
    LEFT JOIN teacher_lesson_progress tlp 
      ON l.id = tlp.lesson_id AND tlp.teacher_id = ?
    WHERE l.program_id = ?
    ORDER BY l.sequence_order ASC
  `;

  db.query(query, [teacher_id, programId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    // Calculate total percentage complete
    const totalLessons = results.length;
    const completedLessons = results.filter(r => r.status === 'completed').length;
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return res.json({
      success: true,
      program_id: Number(programId),
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      completion_percentage: completionPercentage,
      lessons_progress: results
    });
  });
});

module.exports = router;