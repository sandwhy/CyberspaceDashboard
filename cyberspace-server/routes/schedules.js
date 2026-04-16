const express           = require('express');
const router            = express.Router();
const db                = require('../db');
const authenticateToken = require('../mdw/auth');
const { v4: uuidv4 }    = require('uuid');

// GET /api/schedules - now includes teacher_name
router.get('/', authenticateToken, (req, res) => {
    const isTeacher = req.user.role === 'teacher';

    let query = `
        SELECT s.*, u.username AS teacher_name 
        FROM schedules s 
        LEFT JOIN users u ON s.teacher_id = u.id
    `;
    
    const params = [];

    if (isTeacher) {
        query += ' WHERE s.teacher_id = ?';
        params.push(req.user.id); 
    }

    query += ' ORDER BY s.date DESC, s.time_start DESC';
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error Two' });
        res.json(results);
    });
});

// POST /api/schedules/bulk - Process CSV data as individual form submissions
router.post('/bulk', authenticateToken, async (req, res) => {
    const records = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ message: 'Invalid data format' });

    let totalCreated = 0;
    const errors = [];

    for (const row of records) {
        // 1. Disregard incoming ID and map CSV headers to DB keys
        const { 
            teacher_id, date, time_start, time_end, 
            frequency, repeat_until, 
            color, program, module, location, summary, notes
        } = row;

        // Use 'summary' if it exists (for reports) or fallback to 'notes' (for schedules)
        const finalNotes = notes || summary || '';

        // 2. Validate essential fields
        if (!teacher_id || !date || !time_start || !time_end) {
            errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            continue;
        }

        // 3. Series Unrolling Logic (Same as your standard POST)
        const freq_id = (frequency && frequency !== 'none') ? uuidv4() : null;
        let currentDate = new Date(date + 'T00:00:00');
        const stopDate = repeat_until ? new Date(repeat_until) : currentDate;
        const sessions = [];

        let safetyCounter = 0;
        while (currentDate <= stopDate && safetyCounter < 52) {
            const formattedDate = currentDate.toLocaleDateString('en-CA');
            sessions.push([
                teacher_id, formattedDate, time_start, time_end,
                freq_id, frequency || 'none', repeat_until || null,
                color || '#C2DED1', program, module, location, finalNotes, req.user.id
            ]);

            if (frequency === 'Weekly') currentDate.setDate(currentDate.getDate() + 7);
            else if (frequency === 'Bi-weekly') currentDate.setDate(currentDate.getDate() + 14);
            else if (frequency === 'Monthly') currentDate.setMonth(currentDate.getMonth() + 1);
            else break;
            safetyCounter++;
        }

        // 4. Insert unrolled sessions for this row
        const query = `
            INSERT INTO schedules (
                teacher_id, date, time_start, time_end, 
                freq_id, frequency, repeat_until,
                color, program, module, location, notes, created_by
            ) VALUES ?`;

        try {
            await new Promise((resolve, reject) => {
                db.query(query, [sessions], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            totalCreated += sessions.length;
        } catch (err) {
            errors.push(`Database error on row ${date}: ${err.message}`);
        }
    }

    res.status(200).json({ 
        message: `Import complete. Created ${totalCreated} sessions.`,
        errors: errors.length > 0 ? errors : null
    });
});

// POST /api/schedules - Create new entry
router.post('/', authenticateToken, (req, res) => {
    console.log('DATA RECEIVED FOR NEW SCHEDULE:', req.body);

    const { 
        teacher_id, date, time_start, time_end, 
        repeat_frequency, repeat_until, // Updated key
        color, program, module, location, notes,
    } = req.body;

    if (!teacher_id || !date || !time_start || !time_end) {
        return res.status(400).json({ message: 'Required fields missing' });
    }

    // Logic for Series ID
    const frequency = repeat_frequency; // Shortcut to keep your loop logic working
    const freq_id = (frequency && frequency !== 'none' && frequency !== 'None') ? uuidv4() : null;
    let currentDate = new Date(date + 'T00:00:00');
    const sessions = [];
    const stopDate = repeat_until ? new Date(repeat_until) : currentDate;

    // Unroll the series
    let safetyCounter = 0;
    while (currentDate <= stopDate && safetyCounter < 52) { 
        const formattedDate = currentDate.toLocaleDateString('en-CA')
        sessions.push([
            teacher_id, 
            formattedDate,
            time_start, 
            time_end, 
            freq_id, 
            frequency || 'none', 
            repeat_until || null,
            color || '#C2DED1', 
            program, 
            module, 
            location, 
            notes, 
            req.user.id 
        ]);

        if (frequency === 'Weekly') currentDate.setDate(currentDate.getDate() + 7);
        else if (frequency === 'Bi-weekly') currentDate.setDate(currentDate.getDate() + 14);
        else if (frequency === 'Monthly') currentDate.setMonth(currentDate.getMonth() + 1);
        else break; 

        safetyCounter++;
    }
    const query = `
        INSERT INTO schedules (
            teacher_id, date, time_start, time_end, 
            freq_id, frequency, repeat_until,
            color, program, module, location, notes, created_by
        ) VALUES ?`;
    console.log('query:', query)

    db.query(query, [sessions], (err, result) => {
        if (err) {
            console.error('❌ DB ERROR:', err);
            console.log('❌ DB ERROR:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ message: `Created ${sessions.length} session(s)` });
    });
});

// PUT /api/schedules/:id - Update existing entry
router.put('/:id', authenticateToken, (req, res) => {
    const scheduleId = req.params.id;
    const { mode, freq_id } = req.body;

    // 1. FILTER: Only extract columns that exist in the DB
    const validData = {
        teacher_id: req.body.teacher_id,
        date:       req.body.date,
        time_start: req.body.time_start,
        time_end:   req.body.time_end,
        color:      req.body.color,
        program:    req.body.program,
        module:     req.body.module,
        location:   req.body.location,
        notes:      req.body.notes,
        // Include recurring metadata
        frequency:  req.body.frequency, 
        repeat_until: req.body.repeat_until
    };

    // 2. REPORT GUARD: Ensure no report exists before editing
    db.query('SELECT id FROM reports WHERE schedule_id = ?', [scheduleId], (err, reports) => {
        if (reports && reports.length > 0) {
            return res.status(403).json({ message: "Action Denied: Report already exists." });
        }

        if (mode === 'following' && freq_id) {
            // Bulk update logic for the series
            const query = `
                UPDATE schedules 
                SET time_start=?, time_end=?, location=?, color=?, notes=?, program=?, module=?
                WHERE freq_id = ? AND date >= ?
            `;
            const params = [
                validData.time_start, validData.time_end, validData.location, 
                validData.color, validData.notes, validData.program, validData.module,
                freq_id, validData.date
            ];
            db.query(query, params, (err) => {
                if (err) return res.status(500).json({ message: 'Series update failed' });
                res.json({ message: 'Following sessions updated' });
            });
        } else {
            // Clean single update using the filtered object
            const query = `UPDATE schedules SET ? WHERE id = ?`;
            db.query(query, [validData, scheduleId], (err) => {
                if (err) {
                    console.error("SQL ERROR:", err.sqlMessage); // This will tell you exactly which column failed
                    return res.status(500).json({ message: 'Update failed', error: err.sqlMessage });
                }
                res.json({ message: 'Session updated' });
            });
        }
    });
});

// DELETE /api/schedules/:id - Supports "Following" deletion
router.delete('/:id', authenticateToken, (req, res) => {
    const { mode, freq_id, date } = req.query; // mode can be 'following'b  

    // 1. REPORT GUARD
    db.query('SELECT id FROM reports WHERE schedule_id = ?', [req.params.id], (err, reports) => {
        if (reports && reports.length > 0) {
            return res.status(403).json({ message: "Action Denied: Cannot delete a session with an active report." });
        }

        let query = 'DELETE FROM schedules WHERE id = ?';
        let params = [req.params.id];

        if (mode === 'following' && freq_id) {
            // Delete future sessions, but exclude those that have reports
            query = `
                DELETE FROM schedules 
                WHERE freq_id = ? AND date >= ? 
                AND id NOT IN (SELECT schedule_id FROM reports WHERE schedule_id IS NOT NULL)
            `;
            params = [freq_id, date];
        }

        db.query(query, params, (err) => {
            if (err) return res.status(500).json({ message: 'Delete failed' });
            res.json({ message: 'Deleted successfully' });
        });
    });
});

module.exports = router;