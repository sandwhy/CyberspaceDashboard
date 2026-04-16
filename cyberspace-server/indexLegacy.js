require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

//----------Middleware
app.use(cors());
app.use(bodyParser.json());

//----------Database Connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cyberspace_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ============================================================
// TABLE: roles
// ============================================================
const createRolesTable = () => {
    db.query(`
        CREATE TABLE IF NOT EXISTS roles (
            id   INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE
        )
    `, (err) => {
        if (err) return console.error('Error creating roles table:', err);

        db.query(`
            INSERT IGNORE INTO roles (id, name) VALUES 
            (1, 'operator'),
            (2, 'admin'),
            (3, 'teacher')
        `, (err) => {
            if (err) console.error('Error seeding roles:', err);
            else console.log('Roles table ready.');
        });
    });
};

// ============================================================
// TABLE: users
// ============================================================
const createUsersTable = () => {
    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            username      VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name     VARCHAR(150),
            role_id       INT NOT NULL DEFAULT 3,
            is_active     BOOLEAN DEFAULT TRUE,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id)
        )
    `, async (err) => {
        if (err) return console.error('Error creating users table:', err);
        console.log('Users table ready.');

        // Seed default operator account
        db.query('SELECT id FROM users WHERE username = ?', ['operator'], async (err, results) => {
            if (err || results.length > 0) return;
            const hash = await bcrypt.hash('operator123', 10);
            db.query(
                'INSERT INTO users (username, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)',
                ['operator', hash, 'Default Operator', 1],
                (err) => {
                    if (!err) console.log('Default operator created: operator / operator123');
                    else console.error('Error seeding operator:', err);
                }
            );
        });
    });
};

// ============================================================
// TABLE: schedules
// Columns mapped from Image 2 (weekly calendar per teacher)
// ============================================================
const createSchedulesTable = () => {
    db.query(`
        CREATE TABLE IF NOT EXISTS schedules (
            id                INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id        INT NOT NULL,
            date              DATE NOT NULL,
            time_start        TIME NOT NULL,
            time_end          TIME NOT NULL,
            color             VARCHAR(50) DEFAULT '#C7EABB',
            program           VARCHAR(150),
            module            VARCHAR(150),
            location          VARCHAR(150),
            notes             TEXT,
            created_by        INT,
            created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `, (err) => {
        if (err) console.error('Error creating schedules table:', err);
        else console.log('Schedules table ready.');
    });
};

// ============================================================
// TABLE: reports
// Columns mapped from Image 1 (teacher session log)
// ============================================================
const createReportsTable = () => {
    db.query(`
        CREATE TABLE IF NOT EXISTS reports (
            id                      INT AUTO_INCREMENT PRIMARY KEY,
            schedule_id             INT,
            teacher_id              INT NOT NULL,
            invoice_number          VARCHAR(100),
            date                    DATE NOT NULL,
            time_start              TIME,
            time_end                TIME,
            program                 VARCHAR(150),
            module                  VARCHAR(150),
            total_student_attendance INT DEFAULT 0,
            students_name           TEXT,
            summary                 TEXT,
            created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id)  REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
        )
    `, (err) => {
        if (err) console.error('Error creating reports table:', err);
        else console.log('Reports table ready.');
    });
};

// // Helper: Create Default Admin if not exists (Safe to run on restart)
// const createDefaultAdmin = async () => {
//     // Step 1: Create roles table
//     db.query(`
//         CREATE TABLE IF NOT EXISTS roles (
//             id INT AUTO_INCREMENT PRIMARY KEY,
//             name VARCHAR(50) NOT NULL
//         )
//     `, (err) => {
//         if (err) return console.error('Error creating roles table:', err);

//         // Step 2: Insert admin role only if it doesn't exist
//         db.query(`
//             INSERT IGNORE INTO roles (id, name) VALUES 
//             (1, 'operator'),
//             (2, 'admin'),
//             (3, 'teacher')
//         `, (err) => {
//             if (err) return console.error('Error inserting admin role:', err);

//             // Step 3: Create users table
//             db.query(`
//                 CREATE TABLE IF NOT EXISTS users (
//                     id INT AUTO_INCREMENT PRIMARY KEY,
//                     username VARCHAR(100) NOT NULL UNIQUE,
//                     password_hash VARCHAR(255) NOT NULL,
//                     role_id INT DEFAULT 1,
//                     FOREIGN KEY (role_id) REFERENCES roles(id)
//                 )
//             `, (err) => {
//                 if (err) return console.error('Error creating users table:', err);

//                 // Step 4: Check if admin user exists, create if not
//                 db.query('SELECT * FROM users WHERE username = ?', ['admin'], async (err, results) => {
//                     if (err) return console.error('Error checking admin user:', err);

//                     if (results.length === 0) {
//                         const hashedPassword = await bcrypt.hash('admin123', 10);
//                         db.query(
//                             'INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, 1)',
//                             ['admin', hashedPassword],
//                             (err) => {
//                                 if (!err) console.log('Default admin created: admin / admin123');
//                                 else console.error('Error creating admin user:', err);
//                             }
//                         );
//                     } else {
//                         console.log('Admin user already exists.');
//                     }
//                 });
//             });
//         });
//     });
// };

// Helper: Create Gallery Table if not exists
const createGalleryTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            image_url VARCHAR(255) NOT NULL,
            category VARCHAR(50) DEFAULT 'General',
            likes INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(query, (err) => {
        if (!err) {
            console.log('Gallery table checked/created successfully.');
            // Add likes column if missing (migration for existing setup)
            db.query("SHOW COLUMNS FROM gallery LIKE 'likes'", (err, results) => {
                if (!err && results.length === 0) {
                    db.query("ALTER TABLE gallery ADD COLUMN likes INT DEFAULT 0", (err) => {
                        if (!err) console.log("Added 'likes' column to gallery table.");
                    });
                }
            });
        } else {
            console.error('Error creating gallery table:', err);
        }
    });
};

// ... (Existing createDefaultAdmin) ...

// Helper: Create Articles Table if not exists
const createArticlesTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS articles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            content LONGTEXT,
            excerpt TEXT,
            image_url VARCHAR(255),
            author VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    db.query(query, (err) => {
        if (!err) console.log('Articles table checked/created successfully.');
        else console.error('Error creating articles table:', err);
    });
};

// Helper: Create Programs Table if not exists
const createProgramsTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS programs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            age_range VARCHAR(50) NOT NULL,
            description TEXT,
            image_url VARCHAR(255),
            bg_color VARCHAR(50) DEFAULT 'bg-light-blue',
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    db.query(query, (err) => {
        if (!err) {
            console.log('Programs table checked/created successfully.');
            // Add image_url column if missing (migration for existing table)
            db.query("SHOW COLUMNS FROM programs LIKE 'image_url'", (err, results) => {
                if (!err && results.length === 0) {
                    db.query("ALTER TABLE programs ADD COLUMN image_url VARCHAR(255) AFTER description", (err) => {
                        if (!err) console.log("Added 'image_url' column to programs table.");
                    });
                }
            });
            // Seed default programs if table is empty
            db.query('SELECT COUNT(*) as count FROM programs', (err, results) => {
                if (!err && results[0].count === 0) {
                    const seedQuery = `
                        INSERT INTO programs (title, age_range, description, bg_color, sort_order) VALUES
                        ('mTiny', 'Ages 4-6', 'Screen-free coding experience designed for young children. Learn logic through play.', 'bg-light-blue', 1),
                        ('Codey Rocky', 'Ages 6-8', 'The perfect entry into graphical programming and AI concepts.', 'bg-light-purple', 2),
                        ('mBot V2', 'Ages 8-12', 'Build and code your own robot. A hands-on journey into mechanics and sensors.', 'bg-light-green', 3),
                        ('Arduino & Python', 'Ages 12+', 'Advanced electronics and text-based coding for future engineers.', 'bg-light-orange', 4),
                        ('Python AI', 'Ages 13+', 'Deep dive into Artificial Intelligence and Machine Learning with Python.', 'bg-light-blue', 5)
                    `;
                    db.query(seedQuery, (err) => {
                        if (!err) console.log('Default programs seeded successfully.');
                        else console.error('Error seeding programs:', err);
                    });
                }
            });
        } else {
            console.error('Error creating programs table:', err);
        }
    });
};

// ... (Existing createDefaultAdmin) ...

// Run seed check after connection
db.getConnection((err, connection) => {
    if (!err) {
        createDefaultAdmin();
        createGalleryTable();
        createArticlesTable();
        createProgramsTable();
        connection.release();
    }
});

db.getConnection((err, connection) => {
    if (err) return console.error('DB connection failed:', err);
    console.log('Successfully connected to the MySQL database.');

    // Must run in sequence: roles first, then users (FK), then schedules/reports (FK to users)
    createRolesTable();
    setTimeout(() => {
        createUsersTable();
        setTimeout(() => {
            createGalleryTable();
            createArticlesTable();
            createProgramsTable();
            createSchedulesTable();
            setTimeout(() => {
                createReportsTable(); // depends on schedules
            }, 500);
        }, 500);
    }, 500);

    connection.release();
});

// Helper: Generate Slug
const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
};

// === More Configs === //

//  File Upload Config
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed!'));
    }
});

// Serve Uploaded Files
app.use('/uploads', express.static('uploads'));

// Test Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Successfully connected to the MySQL database.');
        connection.release();
    }
});

// === TEST ROUTES === //

// GET /testCookies - retrieve current cookies
app.get('/api/testCookies', (req,res) => {
    const username = "admin"
    const query = `
        SELECT u.id, u.username, u.password_hash, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.username = ?
    `;
    db.query(query, [username], async (err, results) => {

        const user = results[0];
        // --- testing
        // console.log('index.js web')
        // console.log(user)

        // Generate Token
        // const token = jwt.sign(
        //     { id: user.id, username: user.username, role: user.role_name }, 
        //     JWT_SECRET, 
        //     { expiresIn: '1h' }
        // );

        res.json(user);
    });
});

app.get('/api/userslist', (req,res) => {
    const query = ` 
        SELECT u.id, u.username, u.password_hash, r.name as role_name 
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id 
    `
    db.query(query, async (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        // --- testing
        console.log('test')
        console.log(results)
        res.json(results);
    });
});

// === REGISTER & LOGIN ROUTES === //

// 1. POST /api/register - Handle form submission
app.post('/api/register', (req, res) => {
    const { parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience, bot_field } = req.body;

    // Honeypot Spam Protection
    // If 'bot_field' is filled, it's likely a bot. Reject silently or with a generic success to confuse them.
    if (bot_field) {
        console.log('Spam bot detected!');
        return res.status(200).json({ message: 'Registration successful!' }); 
    }

    // Simple validation
    if (!parent_name || !whatsapp_number || !child_name || !child_age) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const query = `
        INSERT INTO registrations (parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [parent_name, whatsapp_number, child_name, child_age, info_source, has_prior_experience];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ 
            message: 'Registration successful!', 
            registrationId: result.insertId 
        });
    });
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'Something very different';

// Middleware: Verify JWT Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};

// 2. GET /api/registrations - Protected Route
app.get('/api/registrations', authenticateToken, (req, res) => {
    // Optional: Check specific permission
    // if (!req.user.permissions.includes('registrations.view')) return res.sendStatus(403);

    const limit = parseInt(req.query.limit) || 0;
    
    let query = 'SELECT * FROM registrations ORDER BY created_at DESC';
    const queryParams = [];

    if (limit > 0) {
        query += ' LIMIT ?';
        queryParams.push(limit);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.json(results);
    });
});

// 3. POST /api/login - JWT Login with DB Verification
app.post('/api/login', (req, res) => {
    const { username, password } = req.body; // Expect username, not just password

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    // Check user in DB
    const query = `
        SELECT u.id, u.username, u.password_hash, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.username = ?
    `;
    db.query(query, [username], async (err, results) => {

        if (err) return res.status(500).json({ message: 'Database error' });
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = results[0];

        // Compare Password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role_name }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ success: true, token, username: user.username, role: user.role_name });
    });
});

// === ARTICLES ROUTES ---

// 7. GET /api/articles - Public List
app.get('/api/articles', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const query = 'SELECT id, title, slug, excerpt, image_url, created_at, author FROM articles ORDER BY created_at DESC LIMIT ?';
    db.query(query, [limit], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// 8. GET /api/articles/:slug - Public Detail
app.get('/api/articles/:slug', (req, res) => {
    const query = 'SELECT * FROM articles WHERE slug = ?';
    db.query(query, [req.params.slug], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Article not found' });
        res.json(results[0]);
    });
});

// 8b. GET /api/articles/id/:id - Admin Detail
app.get('/api/articles/id/:id', (req, res) => {
    const query = 'SELECT * FROM articles WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Article not found' });
        res.json(results[0]);
    });
});

// 9. POST /api/articles - Admin Create
app.post('/api/articles', authenticateToken, upload.single('image'), (req, res) => {
    const { title, content, excerpt, author } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    let slug = generateSlug(title);
    // basic uniqueness check could be better, but appended timestamp ensures validation for now if collision
    // For simplicity in this demo, we assume relatively unique titles or user handles it. 
    // A better way is checking DB. Let's do a quick append if needed? 
    // Actually, let's keep it simple. If duplicates, mysql generic error will trigger (Unique idx).

    let image_url = null;
    if (req.file) {
        const protocol = req.protocol;
        const host = req.get('host');
        image_url = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const query = 'INSERT INTO articles (title, slug, content, excerpt, image_url, author) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [title, slug, content, excerpt, image_url, author || req.user.username], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                 return res.status(400).json({ message: 'Article with this title already exists.' });
            }
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ message: 'Article created', id: result.insertId, slug });
    });
});

// 10. PUT /api/articles/:id - Admin Update
app.put('/api/articles/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { title, content, excerpt } = req.body;
    const articleId = req.params.id;

    // Check if article exists
    const checkQuery = 'SELECT * FROM articles WHERE id = ?';
    db.query(checkQuery, [articleId], (err, results) => {
         if (err || results.length === 0) return res.status(404).json({ message: 'Article not found' });
         
         const currentArticle = results[0];
         let image_url = currentArticle.image_url;

         if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            image_url = `${protocol}://${host}/uploads/${req.file.filename}`;
         }

         let updateQuery = 'UPDATE articles SET title = ?, content = ?, excerpt = ?, image_url = ? WHERE id = ?';
         let params = [title || currentArticle.title, content || currentArticle.content, excerpt || currentArticle.excerpt, image_url, articleId];
         
         if (title && title !== currentArticle.title) {
             // If title changed, maybe update slug? usually bad for SEO to change URLs, let's keep slug unless explicitly requested.
             // allowing slug updates is risky for broken links. Let's NOT update slug for now.
         }

         db.query(updateQuery, params, (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'Article updated', id: articleId });
         });
    });
});

// 11. DELETE /api/articles/:id - Admin Delete
app.delete('/api/articles/:id', authenticateToken, (req, res) => {
    const query = 'DELETE FROM articles WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Article deleted' });
    });
});

// === GALLLERY ROUTES ---- //

// 4. GET /api/gallery - Public
app.get('/api/gallery', (req, res) => {
    const query = 'SELECT * FROM gallery ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// 4b. GET /api/gallery/:id - Public Detail
app.get('/api/gallery/:id', (req, res) => {
    const query = 'SELECT * FROM gallery WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Gallery item not found' });
        res.json(results[0]);
    });
});

// 4c. POST /api/gallery/:id/like - Public Like
app.post('/api/gallery/:id/like', (req, res) => {
    const query = 'UPDATE gallery SET likes = likes + 1 WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        // Return new count
        db.query('SELECT likes FROM gallery WHERE id = ?', [req.params.id], (err, results) => {
            if (!err && results.length > 0) {
                res.json({ success: true, likes: results[0].likes });
            } else {
                res.json({ success: true }); // Fallback
            }
        });
    });
});

// 5. POST /api/gallery - Admin Only
app.post('/api/gallery', authenticateToken, upload.single('image'), (req, res) => {
    const { title, description, category } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Image file is required' });
    }
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    // Construct full URL for the image
    const protocol = req.protocol;
    const host = req.get('host');
    const image_url = `${protocol}://${host}/uploads/${req.file.filename}`;

    const query = 'INSERT INTO gallery (title, description, image_url, category) VALUES (?, ?, ?, ?)';
    db.query(query, [title, description, image_url, category || 'General'], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ message: 'Gallery item added', id: result.insertId, image_url });
    });
});

// 6. DELETE /api/gallery/:id - Admin Only
app.delete('/api/gallery/:id', authenticateToken, (req, res) => {
    const query = 'DELETE FROM gallery WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Gallery item deleted' });
    });
});

// === PROGRAMS ROUTES === //

// GET /api/programs - Public List (active only, sorted)
app.get('/api/programs', (req, res) => {
    const query = 'SELECT * FROM programs WHERE is_active = TRUE ORDER BY sort_order ASC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// GET /api/programs/all - Admin List (all programs)
app.get('/api/programs/all', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM programs ORDER BY sort_order ASC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// POST /api/programs - Admin Create (with image upload)
app.post('/api/programs', authenticateToken, upload.single('image'), (req, res) => {
    const { title, age_range, description, bg_color, sort_order, is_active } = req.body;

    if (!title || !age_range) {
        return res.status(400).json({ message: 'Title and age range are required' });
    }

    let image_url = null;
    if (req.file) {
        const protocol = req.protocol;
        const host = req.get('host');
        image_url = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const query = 'INSERT INTO programs (title, age_range, description, image_url, bg_color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [title, age_range, description || '', image_url, bg_color || 'bg-light-blue', sort_order || 0, is_active !== 'false'], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ message: 'Program created', id: result.insertId });
    });
});

// PUT /api/programs/:id - Admin Update (with image upload)
app.put('/api/programs/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { title, age_range, description, bg_color, sort_order, is_active } = req.body;
    const programId = req.params.id;

    const checkQuery = 'SELECT * FROM programs WHERE id = ?';
    db.query(checkQuery, [programId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'Program not found' });

        const current = results[0];
        let image_url = current.image_url;

        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            image_url = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        const updateQuery = 'UPDATE programs SET title = ?, age_range = ?, description = ?, image_url = ?, bg_color = ?, sort_order = ?, is_active = ? WHERE id = ?';
        const params = [
            title || current.title,
            age_range || current.age_range,
            description !== undefined ? description : current.description,
            image_url,
            bg_color || current.bg_color,
            sort_order !== undefined ? sort_order : current.sort_order,
            is_active !== undefined ? (is_active === 'true' || is_active === true) : current.is_active,
            programId
        ];

        db.query(updateQuery, params, (err) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'Program updated', id: programId });
        });
    });
});

// DELETE /api/programs/:id - Admin Delete
app.delete('/api/programs/:id', authenticateToken, (req, res) => {
    const query = 'DELETE FROM programs WHERE id = ?';
    db.query(query, [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Program deleted' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
