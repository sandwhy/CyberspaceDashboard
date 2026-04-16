const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');
const authenticateToken = require('../mdw/auth');
const upload = require('../mdw/upload');

/**
 * GET /api/reports
 * Fetches all reports (Admin/Operator) or only owned reports (Teacher)
 */
router.get('/', authenticateToken, (req, res) => {
    const isTeacher = req.user.role === 'teacher';
    
    let query = `
        SELECT r.*, u.username AS teacher_name 
        FROM reports r 
        LEFT JOIN users u ON r.teacher_id = u.id
    `;
    
    const params = [];
    if (isTeacher) {
        query += ' WHERE r.teacher_id = ?';
        params.push(req.user.id);
    }
    
    query += ' ORDER BY r.date DESC, r.time_start DESC';
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

/**
 * POST /api/reports
 * Handles creation and renames image to: {scheduleid}-{reportid}-img1.{ext}
 */
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
    console.log('going here 1')
    const { 
        schedule_id, teacher_id, invoice_number, date, 
        time_start, time_end, program, module, 
        total_student_attendance, students_name, notes, image_url 
    } = req.body;

    const resolvedTeacherId = req.user.role === 'teacher' ? req.user.id : (teacher_id || req.user.id);

    // 1. First Insert: Create the record to get the auto-increment ID
    const insertQuery = `
        INSERT INTO reports (
            schedule_id, teacher_id, invoice_number, date, 
            time_start, time_end, program, module, 
            total_student_attendance, students_name, notes, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        schedule_id || null, 
        resolvedTeacherId, 
        invoice_number, 
        date, 
        time_start, 
        time_end, 
        program, 
        module, 
        total_student_attendance ?? 0, 
        students_name, 
        notes, 
        image_url || null // Added fallback
    ];
    console.log('going here 1, stuff:', values)

    db.query(insertQuery, values, (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });

        const reportId = result.insertId;
        const schedId = schedule_id || '0';

        // 2. Handle Image Renaming if a file exists
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const newFileName = `${schedId}-${reportId}-img1${ext}`; // Your requested pattern
            const newPath = path.join('uploads', newFileName);

            fs.rename(req.file.path, newPath, (renameErr) => {
                if (renameErr) return res.status(500).json({ message: 'File renaming failed' });

                // 3. Update the record with the final patterned URL
                const finalUrl = `/uploads/${newFileName}`;
                db.query('UPDATE reports SET image_url = ? WHERE id = ?', [finalUrl, reportId], () => {
                    res.status(201).json({ message: 'Report created with image', id: reportId, image_url: finalUrl });
                });
            });
        } else {
            res.status(201).json({ message: 'Report created', id: reportId });
        }
    });
});

/**
 * PUT /api/reports/:id
 * Updates report and enforces the same naming pattern if a new image is provided
 */
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
    console.log('going here 2')
    const reportId = req.params.id;

    db.query('SELECT * FROM reports WHERE id = ?', [reportId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'Report not found' });

        const report = results[0];
        if (req.user.role === 'teacher' && report.teacher_id !== req.user.id) return res.sendStatus(403);

        const { 
            invoice_number, date, time_start, time_end, 
            program, module, total_student_attendance, 
            students_name, notes, schedule_id, image_url
        } = req.body;

        let finalImageUrl = report.image_url;

        // Handle new file upload
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const schedId = schedule_id || report.schedule_id || '0';
            const newFileName = `${schedId}-${reportId}-img1${ext}`;
            const newPath = path.join('uploads', newFileName);

            // Rename/Overwrite existing file
            fs.renameSync(req.file.path, newPath);
            finalImageUrl = `/uploads/${newFileName}`;
        }

        const updateQuery = `
            UPDATE reports 
            SET invoice_number=?, date=?, time_start=?, time_end=?, 
                program=?, module=?, total_student_attendance=?, 
                students_name=?, notes=?, image_url=? 
            WHERE id=?
        `;
        
        const params = [
            invoice_number ?? report.invoice_number,
            date || report.date,
            time_start || report.time_start,
            time_end || report.time_end,
            program || report.program,
            module || report.module,
            total_student_attendance ?? report.total_student_attendance,
            students_name ?? report.students_name,
            notes ?? report.notes,
            image_url ?? finalImageUrl,
            reportId
        ];

        db.query(updateQuery, params, (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json({ message: 'Report updated', image_url: finalImageUrl });
        });
    });
});

/**
 * DELETE /api/reports/:id
 * Removes database entry and attempts to delete the physical image
 */
router.delete('/:id', authenticateToken, (req, res) => {
    if (req.user.role === 'teacher') return res.sendStatus(403);

    // Get the image URL first so we can delete the file
    db.query('SELECT image_url FROM reports WHERE id = ?', [req.params.id], (err, results) => {
        if (results && results.length > 0 && results[0].image_url) {
            const filePath = path.join(__dirname, '..', results[0].image_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Delete file
        }

        db.query('DELETE FROM reports WHERE id = ?', [req.params.id], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json({ message: 'Report and associated file deleted' });
        });
    });
});

module.exports = router;