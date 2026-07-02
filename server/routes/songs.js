const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { toTrackDTO } = require('../patterns/ContentAdapter');
const { getStrategyForUser } = require('../patterns/PlaybackStrategy');
const streamGateway = require('../patterns/StreamGateway');

const router = express.Router();

const SELECT_SONGS = `
  SELECT songs.*, artists.name AS artist_name
  FROM songs JOIN artists ON artists.id = songs.artist_id
`;

router.get('/', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q) {
    rows = db
      .prepare(`${SELECT_SONGS} WHERE songs.title LIKE ? OR artists.name LIKE ? OR songs.album LIKE ? ORDER BY songs.plays DESC`)
      .all(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare(`${SELECT_SONGS} ORDER BY songs.plays DESC`).all();
  }
  res.json({ songs: rows.map(toTrackDTO) });
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`${SELECT_SONGS} WHERE songs.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Song not found.' });
  res.json({ song: toTrackDTO(row) });
});

// Resolves a stream URL according to the user's playback strategy (Strategy
// pattern) and registers the session with the singleton StreamGateway.
router.post('/:id/play', requireAuth, (req, res) => {
  const song = db.prepare(`${SELECT_SONGS} WHERE songs.id = ?`).get(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found.' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const strategy = getStrategyForUser(user);
  const playback = strategy.evaluatePlay(user);

  const streamUrl = streamGateway.resolveStream(user.id, song, playback.bitrateKbps);

  db.prepare('UPDATE songs SET plays = plays + 1 WHERE id = ?').run(song.id);
  db.prepare('INSERT INTO listening_history (user_id, song_id) VALUES (?, ?)').run(user.id, song.id);

  res.json({
    streamUrl,
    track: toTrackDTO(song),
    playback,
  });
});

router.post('/:id/skip', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (user.tier === 'PREMIUM') return res.json({ skipsRemaining: Infinity });

  if (user.skips_used_today >= 6) {
    return res.status(429).json({ error: 'Daily skip limit reached. Upgrade to Premium for unlimited skips.' });
  }
  db.prepare('UPDATE users SET skips_used_today = skips_used_today + 1 WHERE id = ?').run(user.id);
  res.json({ skipsRemaining: 6 - (user.skips_used_today + 1) });
});

module.exports = router;
