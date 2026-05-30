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
    return res.status(500).json({ message: 'Server error' });
  }
});

// Token-protected endpoint to get current user
app.get('/api/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Auth server listening on http://localhost:${port}`);
});

