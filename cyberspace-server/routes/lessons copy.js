const express           = require('express');
const router            = express.Router();
const db                = require('../db');
const authenticateToken = require('../mdw/auth');
const multer            = require('multer');
const path              = require('path');
const fs                = require('fs');

// ============================================================
// 1. GET /api/lessons
// Fetch all lessons or filter by ?program_id=X
// ============================================================
router.get('/', authenticateToken, (req, res) => {
    const { program_id } = req.query;

    let query = `
        SELECT 
            l.id,
            l.program_id,
            p.title AS program_title,
            l.title,
            l.type,
            l.data,
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
// 3. GET /api/lessons/certifications
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

// ============================================================
// Multer Disk Storage Configuration for PDF Uploads
// ============================================================
const uploadDir = path.join(__dirname, '../public/uploads/pdf');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'lesson-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB file limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});


// ============================================================
// 4. POST /api/lessons
// Create a new lesson (Handles text fields and optional PDF upload)
// ============================================================
router.post('/', authenticateToken, upload.single('pdf'), (req, res) => {
    // Restrict creation to admins and operators
    if (req.user.role === 'teacher') {
        return res.status(403).json({ message: 'Unauthorized: Teachers cannot create lessons' });
    }

    const { program_id, title, type, data, sequence_order, is_required } = req.body;

    if (!program_id || !title) {
        return res.status(400).json({ message: 'program_id and title are required' });
    }

    // Determine stored value for `data` column
    let lessonData = data || null;

    // If a PDF file was uploaded via multipart form, override `lessonData` with local file path
    if (req.file) {
        lessonData = `/uploads/pdf/${req.file.filename}`;
    }

    const query = `
        INSERT INTO lessons (program_id, title, type, data, sequence_order, is_required)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
        program_id,
        title,
        type || 'document',
        lessonData,
        sequence_order || 1,
        is_required !== undefined ? Number(is_required) : 1
    ];

    db.query(query, params, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }

        res.status(201).json({
            message: 'Lesson created successfully',
            lessonId: result.insertId,
            file_url: req.file ? lessonData : null
        });
    });
});

// ============================================================
// PUT /api/lessons/:id
// Update an existing lesson (Handles text fields & optional new PDF file)
// ============================================================
router.put('/:id', authenticateToken, upload.single('pdf'), (req, res) => {
    // Restrict update to non-teachers
    if (req.user.role === 'teacher') {
        return res.status(403).json({ message: 'Unauthorized: Teachers cannot edit lessons' });
    }

    const { id } = req.params;
    const { program_id, title, type, data, sequence_order, is_required } = req.body;

    if (!title || !program_id) {
        return res.status(400).json({ message: 'title and program_id are required' });
    }

    // Determine stored data value
    let lessonData = data || null;

    // If a new PDF file was uploaded, replace lessonData with the new file URL
    if (req.file) {
        lessonData = `/uploads/pdf/${req.file.filename}`;
    }

    const query = `
        UPDATE lessons 
        SET 
            program_id = ?,
            title = ?,
            type = ?,
            data = COALESCE(?, data),
            sequence_order = ?,
            is_required = ?
        WHERE id = ?
    `;

    const params = [
        program_id,
        title,
        type || 'document',
        lessonData,
        sequence_order || 1,
        is_required !== undefined ? Number(is_required) : 1,
        id
    ];

    db.query(query, params, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        res.json({
            message: 'Lesson updated successfully',
            file_url: req.file ? lessonData : undefined
        });
    });
});