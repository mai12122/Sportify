const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /artists - List all artists with song counts
router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT artists.id, artists.name, artists.bio, COUNT(songs.id) AS songCount
         FROM artists
         LEFT JOIN songs ON songs.artist_id = artists.id
         GROUP BY artists.id
         ORDER BY songCount DESC`
      )
      .all();
    res.json({ artists: rows });
  } catch (err) {
    console.error('Error fetching artists:', err);
    res.status(500).json({ error: 'Failed to fetch artists.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid artist ID.' });
    }

    const row = db.prepare('SELECT id, name, bio FROM artists WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ error: 'Artist not found.' });
    }

    res.json({ artist: row });
  } catch (err) {
    console.error('Error fetching artist:', err);
    res.status(500).json({ error: 'Failed to fetch artist.' });
  }
});

module.exports = router;
