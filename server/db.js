const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function getUserByUsername(username) {
  const table = process.env.DB_TABLE || 'user';
  const [rows] = await pool.query(
    `SELECT user_id, username, password, score FROM \`${table}\` WHERE username = ? LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

module.exports = { getUserByUsername, pool };

