const express = require('express');
const cors = require('cors');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const { getUserByUsername } = require('./db');
const { requireAuth } = require('./auth');

const app = express();

app.use(cors({ origin: true, credentials: true }));

// Basic JSON body parsing + CORS
// Endpoints:
//  POST /api/login  -> { token, user }
//  GET  /api/me     -> { user } (Bearer token required)
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

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

    // NOTE: This assumes your DB password column stores the plain password.
    // If you store a hash instead, replace this with bcrypt/argon2 verification.
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const payload = {
      user_id: user.user_id,
      username: user.username,
      score: user.score,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    // Surface actual MySQL error details to diagnose DB_NAME/table/columns.
    return res.status(500).json({
      message: 'Server error',
      error: err?.message,
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
    });
  }
});


// Token-protected endpoint to get current user
app.get('/api/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

// Token-protected endpoint to get leaderboard rank for current user
// Returns: { totalUsers, rank }
app.get('/api/leaderboard/me', requireAuth, async (req, res) => {
  try {
    const table = process.env.DB_TABLE || 'user';
    const currentUserId = req.user.user_id;

    // total users
    const [totalRows] = await require('./db').pool.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
    const totalUsers = Number(totalRows[0]?.total ?? 0);

    // score for current user
    const [scoreRows] = await require('./db').pool.query(
      `SELECT score FROM \`${table}\` WHERE user_id = ? LIMIT 1`,
      [currentUserId]
    );
    const myScore = Number(scoreRows[0]?.score ?? 0);

    // Rank by ordering score DESC. Tie handling: rank = 1 + number of users with score > myScore
    const [rankRows] = await require('./db').pool.query(
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

// Dictionary data (English): returns rows from `english` table.
// Columns: words (word), meaning, chinese.
// Sorting is done A->Z by `words`.
app.get('/api/dictionary/english', async (req, res) => {
  try {
    // DB credentials are expected in env vars.
    // If env vars are missing, mysql2 will error; we surface a clear message.
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      return res.status(500).json({
        message:
          'Database not configured. Please set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME in server env.',
      });
    }

    const table = 'english';

    // Try common column names. Your error says the query tried to select `english`.
    // We'll detect the actual column set from MySQL metadata.
    const [columns] = await require('./db').pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME, table]
    );

    const colNames = columns.map((c) => c.COLUMN_NAME);
    const hasEnglish = colNames.includes('english');
    const hasWords = colNames.includes('words');

    const englishCol = hasEnglish ? 'english' : 'words';

    const [rows] = await require('./db').pool.query(
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
    return res.status(500).json({
      message: 'Server error',
      error: err?.message,
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
    });
  }
});


function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Quiz questions by level (fetches words from english table)
// Returns: { questions: [{ word, meaning }, ...] }
// Each level has 50 questions (level 1: 1-50, level 2: 51-100, etc.)
// Options are randomly shuffled for each question
app.get('/api/quiz/questions', async (req, res) => {
  try {
    const level = parseInt(req.query.level || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 50);
    const levelStart = (level - 1) * 50 + 1;
    const levelEnd = level * 50;
    
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      return res.status(500).json({
        message: 'Database not configured.',
      });
    }

    const table = 'english';
    
    // Detect columns in the english table
    const [columns] = await require('./db').pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME, table]
    );
    const colNames = columns.map((c) => c.COLUMN_NAME);
    const hasId = colNames.includes('id');
    
    // Build query based on whether id column exists
    let questionQuery;
    let queryParams;
    
    if (hasId) {
      // Use auto-increment id for proper alignment
      questionQuery = `SELECT words AS word, meaning FROM \`${table}\` WHERE id BETWEEN ? AND ? AND meaning IS NOT NULL AND meaning != '' ORDER BY RAND()`;
      queryParams = [levelStart, levelEnd];
    } else {
      // Fallback: use OFFSET (less precise alignment)
      const offset = (level - 1) * 50;
      questionQuery = `SELECT words AS word, meaning FROM \`${table}\` WHERE meaning IS NOT NULL AND meaning != '' ORDER BY words ASC LIMIT ? OFFSET ?`;
      queryParams = [limit, offset];
    }
    
    const [rows] = await require('./db').pool.query(questionQuery, queryParams);

    // Generate options: correct meaning + 3 random distractors
    const allMeanings = await require('./db').pool.query(
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
    return res.status(500).json({
      message: 'Server error',
      error: err?.message,
    });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Auth server listening on http://localhost:${port}`);
});

