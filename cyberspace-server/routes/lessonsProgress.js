const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../mdw/auth');

// ============================================================
// POST /api/lessonProgress/lessons/:lessonId
// Upsert lesson progress with automatic Quiz validation
// ============================================================
router.post('/lessons/:lessonId', authenticateToken, (req, res) => {
  const teacher_id = req.user.id;
  const { lessonId } = req.params;
  const { quiz_answers = null } = req.body;

  // 1. First, check the lesson type from the database to secure the logic
  const checkLessonQuery = `SELECT type FROM lessons WHERE id = ?`;

  db.query(checkLessonQuery, [lessonId], (err, lessonResults) => {
    if (err || lessonResults.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const lessonType = lessonResults[0].type;
    
    // 2. Enforce rules based on lesson type
    let status;
    let completed_at = null;
    let formattedQuizAnswers = null;

    if (lessonType === 'quiz') {
      // Quizzes cannot be instantly 'completed' by teachers; they require manual review
      status = 'pending_review';
      formattedQuizAnswers = quiz_answers ? JSON.stringify(quiz_answers) : null;
    } else {
      // Documents, videos, text go straight to completed
      status = req.body.status || 'completed';
      if (status === 'completed') {
        completed_at = new Date();
      }
    }

    // Validate allowed ENUM statuses
    const validStatuses = ['not_started', 'in_progress', 'pending_review', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // 3. Upsert into database
    const upsertQuery = `
      INSERT INTO teacher_lesson_progress (teacher_id, lesson_id, status, quiz_answers, completed_at)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        quiz_answers = COALESCE(VALUES(quiz_answers), quiz_answers),
        completed_at = VALUES(completed_at)
    `;

    db.query(upsertQuery, [teacher_id, lessonId, status, formattedQuizAnswers, completed_at], (err, result) => {
      if (err) {
        console.error('Progress update error:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }

      return res.json({
        success: true,
        message: `Lesson progress updated to ${status}`,
        progress: {
          teacher_id,
          lesson_id: Number(lessonId),
          status,
          quiz_answers: quiz_answers,
          completed_at
        }
      });
    });
  });
});

// ============================================================
// 2. GET /api/lessonProgress/program/:programId
// Get completion progress and quiz data for all lessons in a program for current user
// ============================================================
router.get('/program/:programId', authenticateToken, (req, res) => {
  const teacher_id = req.user.id;
  const { programId } = req.params;

  const query = `
    SELECT 
      l.id AS lesson_id,
      l.title,
      l.type,
      l.sequence_order,
      COALESCE(tlp.status, 'not_started') AS status,
      tlp.quiz_answers,
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