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
    `SELECT user_id, username, password, score, role FROM \`${TABLE()}\` WHERE username = ? LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

async function getUserById(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, username, password, score, role FROM \`${TABLE()}\` WHERE user_id = ? LIMIT 1`,
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
  const total = await getTotalScore(userId);
  await pool.query(`UPDATE \`${TABLE()}\` SET score = ? WHERE user_id = ?`, [total, userId]);
}

async function getTotalScore(userId) {
  const [rows] = await pool.query(
    `SELECT SUM(best_score) AS total FROM level_scores WHERE user_id = ?`,
    [userId]
  );
  return Number(rows[0]?.total ?? 0);
}

async function createBattle({ challengerId, opponentId, questionCount, questions }) {
  const [result] = await pool.query(
    `INSERT INTO multiplayer_battles (challenger_id, opponent_id, question_count, questions)
     VALUES (?, ?, ?, ?)`,
    [challengerId, opponentId, questionCount, JSON.stringify(questions)]
  );
  return Number(result.insertId);
}

async function getBattle(battleId) {
  const [rows] = await pool.query(
    `SELECT * FROM multiplayer_battles WHERE battle_id = ? LIMIT 1`,
    [battleId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    ...row,
    questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions,
  };
}

async function joinBattle(battleId, opponentId) {
  const [result] = await pool.query(
    `UPDATE multiplayer_battles SET opponent_id = ?, status = 'in_progress' WHERE battle_id = ? AND status = 'waiting' AND opponent_id IS NULL`,
    [opponentId, battleId]
  );
  return result.affectedRows > 0;
}

async function updateAnswer(battleId, userId, { questionIndex, selectedAnswer, isCorrect, finished }) {
  const [rows] = await pool.query(
    `SELECT challenger_id, opponent_id, challenger_score, opponent_score,
            challenger_current_q, opponent_current_q, challenger_finished, opponent_finished,
            question_count, questions
     FROM multiplayer_battles WHERE battle_id = ? LIMIT 1`,
    [battleId]
  );
  const battle = rows[0];
  if (!battle) return null;

  const isChallenger = Number(userId) === Number(battle.challenger_id);
  if (!isChallenger && Number(userId) !== Number(battle.opponent_id)) return null;

  const nextScore = isChallenger ? Number(battle.challenger_score) + (isCorrect ? 1 : 0) : Number(battle.opponent_score) + (isCorrect ? 1 : 0);
  const nextIndex = Math.max(
    isChallenger ? battle.challenger_current_q : battle.opponent_current_q,
    Number(questionIndex) + 1,
  );
  const nextFinished = finished
    ? (isChallenger ? 1 : 2)
    : (isChallenger ? battle.challenger_finished : battle.opponent_finished);

  const bothFinished = nextFinished === 3 || (
    (isChallenger ? nextFinished : battle.challenger_finished) === 1 &&
    (isChallenger ? battle.opponent_finished : nextFinished) === 2
  );
  const newStatus = bothFinished ? 'completed' : 'in_progress';

  await pool.query(
    `UPDATE multiplayer_battles SET
       ${isChallenger ? 'challenger_score' : 'opponent_score'} = ?,
       ${isChallenger ? 'challenger_current_q' : 'opponent_current_q'} = ?,
       ${isChallenger ? 'challenger_finished' : 'opponent_finished'} = ?,
       status = ?
     WHERE battle_id = ?`,
    [nextScore, nextIndex, nextFinished, newStatus, battleId]
  );

  const opponentFinished = bothFinished || newStatus === 'completed';
  return {
    score: nextScore,
    currentQ: nextIndex,
    finished: Boolean(nextFinished),
    opponentFinished,
    status: newStatus,
    questions: typeof battle.questions === 'string' ? JSON.parse(battle.questions) : battle.questions,
  };
}

async function listPendingBattlesForUser(userId) {
  const [rows] = await pool.query(
    `SELECT battle_id, challenger_id, question_count, created_at FROM multiplayer_battles WHERE opponent_id = ? AND status = 'waiting' ORDER BY created_at ASC`,
    [userId]
  );
  return rows;
}

async function getBattleForUser(battleId, userId) {
  const [rows] = await pool.query(
    `SELECT battle_id, challenger_id, opponent_id, question_count, challenger_score, opponent_score,
            challenger_current_q, opponent_current_q, challenger_finished, opponent_finished, status, questions
     FROM multiplayer_battles WHERE battle_id = ? LIMIT 1`,
    [battleId]
  );
  const battle = rows[0];
  if (!battle) return null;
  const isChallenger = Number(userId) === Number(battle.challenger_id);
  const isOpponent = Number(userId) === Number(battle.opponent_id);
  if (!isChallenger && !isOpponent) return null;
  return {
    ...battle,
    questions: typeof battle.questions === 'string' ? JSON.parse(battle.questions) : battle.questions,
  };
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS multiplayer_battles (
      battle_id INT AUTO_INCREMENT PRIMARY KEY,
      challenger_id INT NOT NULL,
      opponent_id INT NULL,
      question_count INT NOT NULL,
      questions JSON NOT NULL,
      challenger_score INT NOT NULL DEFAULT 0,
      opponent_score INT NOT NULL DEFAULT 0,
      challenger_current_q INT NOT NULL DEFAULT 0,
      opponent_current_q INT NOT NULL DEFAULT 0,
      challenger_finished TINYINT NOT NULL DEFAULT 0,
      opponent_finished TINYINT NOT NULL DEFAULT 0,
      status ENUM('waiting','in_progress','completed') NOT NULL DEFAULT 'waiting',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const [rows] = await pool.query(`SELECT user_id, score FROM \`${TABLE()}\` WHERE score > 0`);
  for (const row of rows) {
    const capped = Math.min(Number(row.score), 25);
    await pool.query(
      `UPDATE level_scores SET best_score = GREATEST(best_score, ?) WHERE user_id = ?`,
      [capped, row.user_id]
    );
  }
}

module.exports = { getUserByUsername, getUserById, getLevelScores, setLevelScore, getTotalScore, createTables, pool, TABLE };