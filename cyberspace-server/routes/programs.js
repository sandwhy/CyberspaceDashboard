const express           = require('express');
const router            = express.Router();
const db                = require('../db');
const upload            = require('../upload');
const authenticateToken = require('../mdw/auth');
const fs                = require('fs');

// GET /api/programs - public, active only
router.get('/', (req, res) => {
    db.query('SELECT * FROM programs ORDER BY sort_order ASC', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// // GET /api/programs/all - admin, all programs
// router.get('/all', authenticateToken, (req, res) => {
//     db.query('SELECT * FROM programs ORDER BY sort_order ASC', (err, results) => {
//         if (err) return res.status(500).json({ message: 'Database error', error: err });
//         res.json(results);
//     });
// });

// POST /api/programs
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
    const { title, age_range, description, bg_color, sort_order, is_active } = req.body;
    if (!title || !age_range) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: 'Title and age range are required' });
    }

    const image_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;
    const parsedSortOrder = sort_order ? parseInt(sort_order, 10) : 0;
    const isActiveInt = (is_active === 'true' || is_active === '1' || is_active == 1) ? 1 : 0;

    db.query(
        'INSERT INTO programs (title, age_range, description, image_url, bg_color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                title, 
                age_range, 
                description || '', 
                image_url, 
                bg_color || 'bg-light-blue', 
                isNaN(parsedSortOrder) ? 0 : parsedSortOrder, 
                isActiveInt
            ],
        (err, result) => {
            if (err) {
                if (req.file) fs.unlink(req.file.path, () => {});
                return res.status(500).json({ message: 'Database error', error: err });
            }
            res.status(201).json({ message: 'Program created', id: result.insertId });
        }
    );
});

// PUT /api/programs/:id
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { title, age_range, description, bg_color, sort_order, is_active } = req.body;

    db.query('SELECT * FROM programs WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.status(404).json({ message: 'Program not found' });
        }

        const c         = results[0];
        const image_url = req.file
            ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            : c.image_url;

        let parsedSortOrder = c.sort_order;
        if (sort_order !== undefined && sort_order !== '') {
            parsedSortOrder = parseInt(sort_order, 10);
            if (isNaN(parsedSortOrder)) parsedSortOrder = c.sort_order;
        }

        let isActiveInt = c.is_active;
        if (is_active !== undefined && is_active !== '') {
            isActiveInt = (is_active === 'true' || is_active === '1' || is_active == 1) ? 1 : 0;
        }

        db.query(
            'UPDATE programs SET title=?, age_range=?, description=?, image_url=?, bg_color=?, sort_order=?, is_active=? WHERE id=?',
            [
                title       || c.title,
                age_range   || c.age_range,
                description !== undefined ? description : c.description,
                image_url,
                bg_color    || c.bg_color,
                parsedSortOrder,
                isActiveInt,
                req.params.id
            ],
            (err) => {
                if (err) {
                    if (req.file) fs.unlink(req.file.path, () => {});
                    return res.status(500).json({ message: 'Database error', error: err });
                }
                res.json({ message: 'Program updated', id: req.params.id });
            }
        );
    });
});

// DELETE /api/programs/:id
router.delete('/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM programs WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Program deleted' });
    });
});

module.exports = router;