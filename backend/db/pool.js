const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database', err.stack);
    } else {
        console.log('Connected to the database');
    }
});

module.exports = pool;