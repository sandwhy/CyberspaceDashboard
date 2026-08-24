const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../mdw/auth'); // Adjust path if needed
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// Setup Multer for PDF Uploads
// ============================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/pdf';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ============================================================
// 1. GET /api/lessons
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
            p.lesson_status,
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
        res.json({ success: true, data: results });
    });
});

// ============================================================
// 2. POST /api/lessons
// ============================================================
router.post('/', authenticateToken, upload.single('pdf'), (req, res) => {  // Role check: Only admins/operators can create lessons
    if (['teacher'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized: Teachers cannot create lessons' });
    }

    const { program_id, title, type, data, sequence_order, is_required, lesson_status } = req.body;

    if (!title || !program_id) {
        return res.status(400).json({ message: 'title and program_id are required' });
    }

    // Determine stored data value (either the uploaded file path, or the JSON string for quizzes)
    let lessonData = data || null;
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
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ success: true, message: 'Lesson created', id: result.insertId });
    });
});

// ============================================================
// 3. PUT /api/lessons/:id
// Update an existing lesson (Admin/Operator only)
// ============================================================
router.put('/:id', authenticateToken, upload.single('pdf'), (req, res) => {
    if (['teacher'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized: Teachers cannot edit lessons' });
    }

    const { id } = req.params;
    const { program_id, title, type, data, sequence_order, is_required } = req.body;

    if (!title || !program_id) {
        return res.status(400).json({ message: 'title and program_id are required' });
    }

    let lessonData = data || null;

    // If a new PDF file was uploaded, replace lessonData with the new file URL
    if (req.file) {
        lessonData = `/uploads/pdf/${req.file.filename}`;
    }

    // COALESCE(?, data) ensures we don't accidentally overwrite an existing PDF if they only updated the title
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
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Lesson not found' });
        
        res.json({ success: true, message: 'Lesson updated successfully' });
    });
});

// ============================================================
// 4. DELETE /api/lessons/:id
// Delete a lesson (Admin/Operator only)
// ============================================================
router.delete('/:id', authenticateToken, (req, res) => {
    if (['teacher'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized: Teachers cannot delete lessons' });
    }

    const { id } = req.params;

    // Optional but recommended: Grab the file path before deleting so you can wipe the PDF from the server
    db.query('SELECT type, data FROM lessons WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (rows.length === 0) return res.status(404).json({ message: 'Lesson not found' });

        const lesson = rows[0];

        // Delete from database
        db.query('DELETE FROM lessons WHERE id = ?', [id], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ message: 'Database error', error: deleteErr });

            // If it was a document, try to delete the actual file from the uploads folder to save space
            if (lesson.type === 'document' && lesson.data) {
                const filePath = path.join(__dirname, '..', lesson.data); // Adjust relative path based on your folder structure
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.warn(`Failed to delete file ${filePath}:`, unlinkErr.message);
                });
            }

            res.json({ success: true, message: 'Lesson deleted successfully' });
        });
    });
});

module.exports = router;