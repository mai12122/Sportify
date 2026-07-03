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

// GET /songs - List all songs or search
router.get('/', (req, res) => {
  try {
    const { q } = req.query;
    let rows;
    
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      rows = db
        .prepare(`${SELECT_SONGS} WHERE songs.title LIKE ? OR artists.name LIKE ? OR songs.album LIKE ? ORDER BY songs.plays DESC`)
        .all(searchTerm, searchTerm, searchTerm);
    } else {
      rows = db.prepare(`${SELECT_SONGS} ORDER BY songs.plays DESC`).all();
    }
    
    res.json({ songs: rows.map(toTrackDTO) });
  } catch (err) {
    console.error('Error fetching songs:', err);
    res.status(500).json({ error: 'Failed to fetch songs.' });
  }
});

// GET /songs/:id - Get a single song
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid song ID.' });
    }

    const row = db.prepare(`${SELECT_SONGS} WHERE songs.id = ?`).get(id);
    if (!row) {
      return res.status(404).json({ error: 'Song not found.' });
    }
    
    res.json({ song: toTrackDTO(row) });
  } catch (err) {
    console.error('Error fetching song:', err);
    res.status(500).json({ error: 'Failed to fetch song.' });
  }
});

// POST /songs/:id/play - Play a song
router.post('/:id/play', requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid song ID.' });
    }

    const song = db.prepare(`${SELECT_SONGS} WHERE songs.id = ?`).get(id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const strategy = getStrategyForUser(user);
    const playback = strategy.evaluatePlay(user);
    const stream = streamGateway.resolveStream(user.id, song, playback);

    // Update play count and listening history
    db.prepare('UPDATE songs SET plays = plays + 1 WHERE id = ?').run(song.id);
    db.prepare('INSERT INTO listening_history (user_id, song_id) VALUES (?, ?)').run(user.id, song.id);

    res.json({
      streamUrl: stream.streamUrl,
      track: toTrackDTO(song),
      playback: {
        ...playback,
        bitrateKbps: stream.bitrateKbps,
        networkQuality: stream.networkQuality,
        latencyMs: stream.latencyMs,
        bufferingMs: stream.bufferingMs,
      },
    });
  } catch (err) {
    console.error('Error playing song:', err);
    res.status(500).json({ error: 'Failed to play song.' });
  }
});

// POST /songs/:id/adapt - ABR adaptation tick
router.post('/:id/adapt', requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid song ID.' });
    }

    const result = streamGateway.adapt(req.userId);
    if (!result) {
      return res.status(409).json({ error: 'No active stream session.' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error adapting stream:', err);
    res.status(500).json({ error: 'Failed to adapt stream.' });
  }
});

// POST /songs/:id/skip - Skip current track
router.post('/:id/skip', requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid song ID.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Premium users get unlimited skips
    if (user.tier === 'PREMIUM') {
      return res.json({ skipsRemaining: Infinity });
    }

    // Free users have a daily skip limit
    const DAILY_SKIP_LIMIT = 6;
    if (user.skips_used_today >= DAILY_SKIP_LIMIT) {
      return res.status(429).json({ 
        error: 'Daily skip limit reached. Upgrade to Premium for unlimited skips.' 
      });
    }

    db.prepare('UPDATE users SET skips_used_today = skips_used_today + 1 WHERE id = ?').run(user.id);
    
    const remainingSkips = DAILY_SKIP_LIMIT - (user.skips_used_today + 1);
    res.json({ skipsRemaining: remainingSkips });
  } catch (err) {
    console.error('Error skipping song:', err);
    res.status(500).json({ error: 'Failed to skip song.' });
  }
});

// GET /songs/artist/:artistId - Get songs by artist (bonus endpoint)
router.get('/artist/:artistId', (req, res) => {
  try {
    const artistId = parseInt(req.params.artistId, 10);
    if (isNaN(artistId)) {
      return res.status(400).json({ error: 'Invalid artist ID.' });
    }

    const rows = db
      .prepare(`${SELECT_SONGS} WHERE songs.artist_id = ? ORDER BY songs.plays DESC`)
      .all(artistId);
    
    res.json({ songs: rows.map(toTrackDTO) });
  } catch (err) {
    console.error('Error fetching artist songs:', err);
    res.status(500).json({ error: 'Failed to fetch artist songs.' });
  }
});

module.exports = router;