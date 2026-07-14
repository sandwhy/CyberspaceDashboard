const mysql = require('mysql2');


const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123123123123',
    database: process.env.DB_NAME || 'cyberspace_db',
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' || (process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1')) ? { rejectUnauthorized: false } : null
};
const db = mysql.createPool(dbConfig);
module.exports = db;
