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

const TABLE = () => process.env.DB_TABLE || 'user';

async function getUserByUsername(username) {
  const [rows] = await pool.query(
    `SELECT user_id, username, password, score FROM \`${TABLE()}\` WHERE username = ? LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

async function getUserById(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, username, score FROM \`${TABLE()}\` WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function getLevelScores(userId) {
  const [rows] = await pool.query(
    `SELECT level, best_score FROM level_scores WHERE user_id = ? ORDER BY level ASC`,
    [userId]
  );
  return rows.map((r) => ({ level: r.level, best_score: Number(r.best_score) }));
}

async function setLevelScore(userId, level, score) {
  const [existing] = await pool.query(
    `SELECT best_score FROM level_scores WHERE user_id = ? AND level = ? LIMIT 1`,
    [userId, level]
  );
  const existingScore = Number(existing[0]?.best_score ?? 0);
  if (score <= existingScore) return;
  await pool.query(
    `INSERT INTO level_scores (user_id, level, best_score) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE best_score = GREATEST(best_score, VALUES(best_score))`,
    [userId, level, score]
  );
}

async function getTotalScore(userId) {
  const [rows] = await pool.query(
    `SELECT SUM(best_score) AS total FROM level_scores WHERE user_id = ?`,
    [userId]
  );
  return Number(rows[0]?.total ?? 0);
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
  const [rows] = await pool.query(`SELECT user_id, score FROM \`${TABLE()}\` WHERE score > 0`);
  for (const row of rows) {
    const capped = Math.min(Number(row.score), 50);
    await pool.query(
      `UPDATE level_scores SET best_score = GREATEST(best_score, ?) WHERE user_id = ?`,
      [capped, row.user_id]
    );
  }
}

module.exports = { getUserByUsername, getUserById, getLevelScores, setLevelScore, getTotalScore, createTables, pool };