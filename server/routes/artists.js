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

module.exports = router;
