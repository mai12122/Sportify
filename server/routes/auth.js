const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    tier: row.tier,
    skipsUsedToday: row.skips_used_today,
    createdAt: row.created_at,
  };
}

router.post('/register', (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'email, password, and displayName are required.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

  const hash = bcrypt.hashSync(password, 8);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)')
    .run(email, hash, displayName);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  // include playlist count
  const count = db.prepare('SELECT COUNT(*) AS c FROM playlists WHERE user_id = ?').get(req.userId).c;
  const u = publicUser(user);
  u.playlistCount = count;
  res.json({ user: u });
});

router.patch('/me', requireAuth, (req, res) => {
  // Accept either camelCase or snake_case from clients
  const body = req.body || {};
  const displayName = body.displayName || body.display_name;
  if (!displayName || !displayName.trim()) return res.status(400).json({ error: 'displayName is required.' });
  db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName.trim(), req.userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const count = db.prepare('SELECT COUNT(*) AS c FROM playlists WHERE user_id = ?').get(req.userId).c;
  const u = publicUser(user);
  u.playlistCount = count;
  res.json({ user: u });
});

module.exports = router;
