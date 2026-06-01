const express = require('express');
const cors = require('cors');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const { createTables, getUserByUsername, getUserById, getLevelScores, setLevelScore, getTotalScore } = require('./db');
const { requireAuth } = require('./auth');
const { pool } = require('./db');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

createTables().catch(err => console.error('Failed to create tables:', err));

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const total = await getTotalScore(user.user_id);
    const level = Math.min(10, Math.floor(total / 50) + 1);

    const payload = {
      user_id: user.user_id,
      username: user.username,
      score: total,
      level,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Server error',
      error: err?.message,
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
    });
  }
});

app.get('/api/me', requireAuth, async (req, res) => {
  const user = await getUserById(req.user.user_id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const total = await getTotalScore(req.user.user_id);
  const level = Math.min(10, Math.floor(total / 50) + 1);
  return res.json({ user: { ...user, score: total, level } });
});

app.get('/api/me/scores', requireAuth, async (req, res) => {
  const level = Number(req.query.level ?? 1);
  const allScores = await getLevelScores(req.user.user_id);
  const entry = allScores.find(s => s.level === level);
  return res.json({ scores: entry ? [entry] : [{ level, best_score: 0 }] });
});

app.post('/api/me/level-score', requireAuth, async (req, res) => {
  const level = Number(req.body?.level);
  const score = Number(req.body?.score);
  if (!Number.isInteger(level) || level < 1 || !Number.isInteger(score) || score < 0) {
    return res.status(400).json({ message: 'level and positive score are required' });
  }
  await setLevelScore(req.user.user_id, level, score);
  const total = await getTotalScore(req.user.user_id);
  return res.json({ ok: true, total });
});

app.get('/api/leaderboard/me', requireAuth, async (req, res) => {
  try {
    const table = process.env.DB_TABLE || 'user';
    const currentUserId = req.user.user_id;

    const [totalRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM \`${table}\``
    );
    const totalUsers = Number(totalRows[0]?.total ?? 0);

    const myScore = await getTotalScore(currentUserId);

    const [rankRows] = await pool.query(
      `SELECT COUNT(*) AS higher FROM \`${table}\` WHERE score > ?`,
      [myScore]
    );
    const higher = Number(rankRows[0]?.higher ?? 0);
    const rank = higher + 1;

    return res.json({ totalUsers, rank });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/dictionary/english', async (req, res) => {
  try {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      return res.status(500).json({
        message: 'Database not configured. Please set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME in server env.',
      });
    }

    const table = 'english';

    const [columns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME, table]
    );

    const colNames = columns.map((c) => c.COLUMN_NAME);
    const englishCol = colNames.includes('english') ? 'english' : 'words';

    const [rows] = await pool.query(
      `SELECT \`${englishCol}\` AS english, meaning, chinese FROM \`${table}\` ORDER BY \`${englishCol}\` ASC`
    );

    return res.json({
      items: rows.map((r) => ({
        english: r.english,
        meaning: r.meaning,
        chinese: r.chinese,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
});

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

app.get('/api/quiz/questions', async (req, res) => {
  try {
    const level = parseInt(req.query.level || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 50);
    const levelStart = (level - 1) * 50 + 1;
    const levelEnd = level * 50;

    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      return res.status(500).json({ message: 'Database not configured.' });
    }

    const table = 'english';

    const [columns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME, table]
    );
    const colNames = columns.map((c) => c.COLUMN_NAME);
    const hasId = colNames.includes('id');

    let questionQuery;
    let queryParams;

    if (hasId) {
      questionQuery = `SELECT words AS word, meaning FROM \`${table}\` WHERE id BETWEEN ? AND ? AND meaning IS NOT NULL AND meaning != '' ORDER BY RAND()`;
      queryParams = [levelStart, levelEnd];
    } else {
      const offset = (level - 1) * 50;
      questionQuery = `SELECT words AS word, meaning FROM \`${table}\` WHERE meaning IS NOT NULL AND meaning != '' ORDER BY words ASC LIMIT ? OFFSET ?`;
      queryParams = [limit, offset];
    }

    const [rows] = await pool.query(questionQuery, queryParams);

    const allMeanings = await pool.query(
      `SELECT meaning FROM \`${table}\` WHERE meaning IS NOT NULL AND meaning != ''`
    );
    const allMeaningValues = allMeanings[0].map((r) => r.meaning);

    const questions = rows.map((q, idx) => {
      const distractors = shuffle(allMeaningValues.filter(m => m !== q.meaning)).slice(0, 3);
      const options = shuffle([...distractors, q.meaning]);
      return {
        id: hasId ? q.id : levelStart + idx,
        word: q.word,
        options: options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`),
        answer: q.meaning,
      };
    });

    return res.json({ questions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Auth server listening on http://localhost:${port}`);
});