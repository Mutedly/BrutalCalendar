'use strict';

const express = require('express');
const bcrypt = require('bcrypt');

const { query, pool } = require('../db');
const { signToken, requireAuth } = require('../auth');

const router = express.Router();

const SALT_ROUNDS = 10;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// Validate the shared register/login body.
function validateCredentials(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!USERNAME_RE.test(username)) {
    return {
      error:
        'Username must be 3-20 characters: letters, numbers or underscore.',
    };
  }
  if (password.length < 6 || password.length > 100) {
    return { error: 'Password must be between 6 and 100 characters.' };
  }
  return { username, password };
}

// POST /api/register --------------------------------------------------------
router.post('/register', async (req, res) => {
  const parsed = validateCredentials(req.body || {});
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const { username, password } = parsed;
  let bodyColor =
    typeof req.body.bodyColor === 'string' ? req.body.bodyColor : '#3498db';
  if (!COLOR_RE.test(bodyColor)) {
    bodyColor = '#3498db';
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const existing = await conn.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existing[0].length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [userResult] = await conn.execute(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );
    const userId = userResult.insertId;

    await conn.execute(
      'INSERT INTO avatars (user_id, nickname, body_color) VALUES (?, ?, ?)',
      [userId, username, bodyColor]
    );

    await conn.commit();

    const user = { id: userId, username };
    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: userId, username, nickname: username, bodyColor },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Could not create account.' });
  } finally {
    conn.release();
  }
});

// POST /api/login -----------------------------------------------------------
router.post('/login', async (req, res) => {
  const parsed = validateCredentials(req.body || {});
  if (parsed.error) {
    // Use a generic message to avoid leaking which field was wrong.
    return res.status(400).json({ error: 'Invalid username or password.' });
  }

  const { username, password } = parsed;

  try {
    const rows = await query(
      `SELECT u.id, u.username, u.password_hash, a.nickname, a.body_color
         FROM users u
         LEFT JOIN avatars a ON a.user_id = u.id
        WHERE u.username = ?`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const record = rows[0];
    const match = await bcrypt.compare(password, record.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = { id: record.id, username: record.username };
    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: record.id,
        username: record.username,
        nickname: record.nickname || record.username,
        bodyColor: record.body_color || '#3498db',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Could not log in.' });
  }
});

// GET /api/me ---------------------------------------------------------------
router.get('/me', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT u.id, u.username, a.nickname, a.body_color
         FROM users u
         LEFT JOIN avatars a ON a.user_id = u.id
        WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const record = rows[0];
    return res.json({
      user: {
        id: record.id,
        username: record.username,
        nickname: record.nickname || record.username,
        bodyColor: record.body_color || '#3498db',
      },
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Could not load profile.' });
  }
});

module.exports = router;
