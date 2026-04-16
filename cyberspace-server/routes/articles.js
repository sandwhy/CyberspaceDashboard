const express           = require('express');
const router            = express.Router();
const db                = require('../db');
const upload            = require('../upload');
const authenticateToken = require('../mdw/auth');

const generateSlug = (text) => text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

// GET /api/articles
router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    db.query(
        'SELECT id, title, slug, excerpt, image_url, created_at, author FROM articles ORDER BY created_at DESC LIMIT ?',
        [limit],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json(results);
        }
    );
});

// GET /api/articles/id/:id - admin detail
router.get('/id/:id', (req, res) => {
    db.query('SELECT * FROM articles WHERE id = ?', [req.params.id], (err, results) => {
        if (err)                  return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'Article not found' });
        res.json(results[0]);
    });
});

// GET /api/articles/:slug - public detail
router.get('/:slug', (req, res) => {
    db.query('SELECT * FROM articles WHERE slug = ?', [req.params.slug], (err, results) => {
        if (err)                  return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'Article not found' });
        res.json(results[0]);
    });
});

// POST /api/articles
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
    const { title, content, excerpt, author } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });

    const slug      = generateSlug(title);
    const image_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

    db.query(
        'INSERT INTO articles (title, slug, content, excerpt, image_url, author) VALUES (?, ?, ?, ?, ?, ?)',
        [title, slug, content, excerpt, image_url, author || req.user.username],
        (err, result) => {
            if (err?.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Article with this title already exists.' });
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.status(201).json({ message: 'Article created', id: result.insertId, slug });
        }
    );
});

// PUT /api/articles/:id
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { title, content, excerpt } = req.body;

    db.query('SELECT * FROM articles WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'Article not found' });

        const c         = results[0];
        const image_url = req.file
            ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            : c.image_url;

        db.query(
            'UPDATE articles SET title=?, content=?, excerpt=?, image_url=? WHERE id=?',
            [title || c.title, content || c.content, excerpt || c.excerpt, image_url, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.json({ message: 'Article updated', id: req.params.id });
            }
        );
    });
});

// DELETE /api/articles/:id
router.delete('/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM articles WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Article deleted' });
    });
});

module.exports = router;