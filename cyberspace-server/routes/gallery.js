const express           = require('express');
const router            = express.Router();
const db                = require('../db');
const upload            = require('../upload');
const authenticateToken = require('../mdw/auth');

// GET /api/gallery
router.get('/', (req, res) => {
    db.query('SELECT * FROM gallery ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// GET /api/gallery/:id
router.get('/:id', (req, res) => {
    db.query('SELECT * FROM gallery WHERE id = ?', [req.params.id], (err, results) => {
        if (err)                  return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Gallery item not found' });
        res.json(results[0]);
    });
});

// POST /api/gallery/:id/like
router.post('/:id/like', (req, res) => {
    db.query('UPDATE gallery SET likes = likes + 1 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        db.query('SELECT likes FROM gallery WHERE id = ?', [req.params.id], (err, results) => {
            res.json({ success: true, likes: results?.[0]?.likes ?? 0 });
        });
    });
});

// POST /api/gallery - admin only
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
    const { title, description, category } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Image file is required' });
    if (!title)    return res.status(400).json({ message: 'Title is required' });

    const image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    db.query(
        'INSERT INTO gallery (title, description, image_url, category) VALUES (?, ?, ?, ?)',
        [title, description, image_url, category || 'General'],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.status(201).json({ message: 'Gallery item added', id: result.insertId, image_url });
        }
    );
});

// PUT /api/gallery/:id - admin only
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { title, description, category } = req.body;

    db.query('SELECT * FROM gallery WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'Gallery item not found' });

        const c         = results[0];
        const image_url = req.file
            ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            : c.image_url;

        db.query(
            'UPDATE gallery SET title=?, description=?, image_url=?, category=? WHERE id=?',
            [title || c.title, description ?? c.description, image_url, category || c.category, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.json({ message: 'Gallery item updated' });
            }
        );
    });
});

// DELETE /api/gallery/:id - admin only
router.delete('/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM gallery WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Gallery item deleted' });
    });
});

module.exports = router;