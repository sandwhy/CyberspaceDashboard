const db     = require('./db');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {

    const query = (sql) => new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });

    const queryWithParams = (sql, params) => new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });

    try {

        // ============================================================
        // TABLE: roles
        // ============================================================
        await query(`
            CREATE TABLE IF NOT EXISTS roles (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                name        VARCHAR(50)  NOT NULL UNIQUE,
                description VARCHAR(255) DEFAULT NULL
            )
        `);
        await query(`
            INSERT IGNORE INTO roles (id, name) VALUES
            (1, 'operator'),
            (2, 'admin'),
            (3, 'teacher')
        `);
        console.log('✔ roles');

        // ============================================================
        // TABLE: users
        // ============================================================
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                username      VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role_id       INT          DEFAULT 3,
                is_active     TINYINT(1)   DEFAULT 1,
                created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
            )
        `);
        // Seed default operator if no users exist
        const existingUsers = await query('SELECT id FROM users');
        if (existingUsers.length === 0) {
            const hash = await bcrypt.hash('password123', 10);

            await queryWithParams(
                'INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)',
                ['operator', hash, 1]
            );
            await queryWithParams(
                'INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)',
                ['admin', hash, 2]
            );
            await queryWithParams(
                'INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)',
                ['teacher', hash, 3]
            );

            console.log('✔ users (seeded defaults — all passwords: password123)');
        } else {
            console.log('✔ users');
        }
        
        // ============================================================
        // TABLE: schedules  (depends on users)
        // ============================================================
        await query(`
            CREATE TABLE IF NOT EXISTS schedules (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id   INT          NOT NULL,
                date         DATE         NOT NULL,
                time_start   TIME         NOT NULL,
                time_end     TIME         NOT NULL,
                freq_id      VARCHAR(36)  DEFAULT NULL,
                frequency    VARCHAR(50)  DEFAULT NULL,
                repeat_until DATE         DEFAULT NULL,
                color        VARCHAR(50)  DEFAULT '#C7EABB',
                program      VARCHAR(150) DEFAULT NULL,
                module       VARCHAR(150) DEFAULT NULL,
                location     VARCHAR(150) DEFAULT NULL,
                notes        TEXT,
                created_by   INT          DEFAULT NULL,
                created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✔ schedules');

        // ============================================================
        // TABLE: reports  (depends on users + schedules)
        // ============================================================
        await query(`
            CREATE TABLE IF NOT EXISTS reports (
                id                       INT AUTO_INCREMENT PRIMARY KEY,
                schedule_id              INT          DEFAULT NULL,
                teacher_id               INT          NOT NULL,
                invoice_number           VARCHAR(100) DEFAULT NULL,
                date                     DATE         NOT NULL,
                time_start               TIME         DEFAULT NULL,
                time_end                 TIME         DEFAULT NULL,
                program                  VARCHAR(150) DEFAULT NULL,
                module                   VARCHAR(150) DEFAULT NULL,
                total_student_attendance INT          DEFAULT 0,
                students_name            TEXT,
                notes                    TEXT,
                image_url                VARCHAR(255) DEFAULT NULL,
                created_at               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id)  REFERENCES users(id)     ON DELETE CASCADE,
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
            )
        `);
        console.log('✔ reports');



        // ============================================================
        // others
        // TABLE: registrations
        // ============================================================
        await query(`
            CREATE TABLE IF NOT EXISTS registrations (
                id                   INT AUTO_INCREMENT PRIMARY KEY,
                parent_name          VARCHAR(255) NOT NULL,
                child_name           VARCHAR(255) NOT NULL,
                child_age            INT          NOT NULL,
                whatsapp_number      VARCHAR(20)  NOT NULL,
                info_source          VARCHAR(255) DEFAULT NULL,
                has_prior_experience TINYINT(1)   DEFAULT 0,
                created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ registrations');

        // ============================================================
        // TABLE: gallery
        // ============================================================
        await query(`
            CREATE TABLE IF NOT EXISTS gallery (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                title       VARCHAR(255) NOT NULL,
                description TEXT,
                image_url   VARCHAR(255) NOT NULL,
                category    VARCHAR(50)  DEFAULT 'General',
                likes       INT          DEFAULT 0,
                created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ gallery');

        // ============================================================
        // TABLE: articles
        // ============================================================
        await query(`
            CREATE TABLE IF NOT EXISTS articles (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                title      VARCHAR(255) NOT NULL,
                slug       VARCHAR(255) NOT NULL UNIQUE,
                content    LONGTEXT,
                excerpt    TEXT,
                image_url  VARCHAR(255) DEFAULT NULL,
                author     VARCHAR(100) DEFAULT NULL,
                created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ articles');

        // ============================================================
        // TABLE: programs
        // ============================================================
        await query(`
            CREATE TABLE IF NOT EXISTS programs (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                title       VARCHAR(255) NOT NULL,
                age_range   VARCHAR(50)  NOT NULL,
                description TEXT,
                image_url   VARCHAR(255) DEFAULT NULL,
                icon        VARCHAR(50)  DEFAULT '?',
                bg_color    VARCHAR(50)  DEFAULT 'bg-light-blue',
                sort_order  INT          DEFAULT 0,
                is_active   BOOLEAN      DEFAULT TRUE,
                created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        // Seed default programs if empty
        const programCount = await query('SELECT COUNT(*) as count FROM programs');
        if (programCount[0].count === 0) {
            await query(`
                INSERT INTO programs (title, age_range, description, icon, bg_color, sort_order) VALUES
                ('mTiny',            'Ages 4-6',  'Screen-free coding experience designed for young children. Learn logic through play.', '?',  'bg-light-blue',   1),
                ('Codey Rocky',      'Ages 6-8',  'The perfect entry into graphical programming and AI concepts.',                         '?',  'bg-light-purple', 2),
                ('mBot V2',          'Ages 8-12', 'Build and code your own robot. A hands-on journey into mechanics and sensors.',          '?',  'bg-light-green',  3),
                ('Arduino & Python', 'Ages 12+',  'Advanced electronics and text-based coding for future engineers.',                       '⚡', 'bg-light-orange', 4),
                ('Python AI',        'Ages 13+',  'Deep dive into Artificial Intelligence and Machine Learning with Python.',               '?',  'bg-light-blue',   5)
            `);
            console.log('✔ programs (seeded defaults)');
        } else {
            console.log('✔ programs');
        }

        console.log('\n✔ All tables initialized successfully.\n');

    } catch (err) {
        console.error('Database initialization error:', err);
    }
};

module.exports = initDatabase;