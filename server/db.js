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

async function getUserById(userId) {
  const table = process.env.DB_TABLE || 'user';
  const [rows] = await pool.query(
    `SELECT user_id, username, score FROM \`${table}\` WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function getLevelScores(userId) {
  const table = 'level_scores';
  const [rows] = await pool.query(
    `SELECT level, best_score FROM \`${table}\` WHERE user_id = ? ORDER BY level ASC`,
    [userId]
  );
  return rows;
}

async function setLevelScore(userId, level, score) {
  const table = 'level_scores';
  await pool.query(
    `INSERT INTO \`${table}\` (user_id, level, best_score) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE best_score = GREATEST(best_score, VALUES(best_score))`,
    [userId, level, score]
  );
}

async function getTotalScore(userId) {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(best_score), 0) AS total FROM level_scores WHERE user_id = ?`,
    [userId]
  );
  return Number(rows[0].total);
}

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS level_scores (
      user_id INT NOT NULL,
      level INT NOT NULL,
      best_score INT NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, level)
    )
  `);
}

module.exports = { getUserByUsername, getUserById, getLevelScores, setLevelScore, getTotalScore, createTables, pool };

