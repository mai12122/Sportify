const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { toTrackDTO, toPlaylistDTO } = require('../patterns/ContentAdapter');
const { buildPlaylistValidationChain } = require('../patterns/ValidationChain');
const { center } = require('../patterns/NotificationCenter');

const router = express.Router();

function loadTracksFor(playlistId) {
  const rows = db
    .prepare(
      `SELECT songs.*, artists.name AS artist_name
       FROM playlist_songs
       JOIN songs ON songs.id = playlist_songs.song_id
       JOIN artists ON artists.id = songs.artist_id
       WHERE playlist_songs.playlist_id = ?
       ORDER BY playlist_songs.position ASC`
    )
    .all(playlistId);
  return rows.map(toTrackDTO);
}

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  const playlists = rows.map((row) => toPlaylistDTO(row, loadTracksFor(row.id)));
  res.json({ playlists });
});

router.post('/', requireAuth, (req, res) => {
  const { name } = req.body || {};
  const chain = buildPlaylistValidationChain(db);
  const result = chain.handle({ userId: req.userId, name: name || '' });
  if (!result.ok) return res.status(400).json({ error: result.error });

  const info = db.prepare('INSERT INTO playlists (user_id, name) VALUES (?, ?)').run(req.userId, name.trim());
  const row = db.prepare('SELECT * FROM playlists WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ playlist: toPlaylistDTO(row, []) });
});

router.post('/:id/songs', requireAuth, (req, res) => {
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  const { songId } = req.body || {};
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
  if (!song) return res.status(404).json({ error: 'Song not found.' });

  const maxPos = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS m FROM playlist_songs WHERE playlist_id = ?')
    .get(playlist.id).m;

  db.prepare('INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)').run(
    playlist.id,
    song.id,
    maxPos + 1
  );

  // Observer pattern: broadcast a "playlist updated" event
  center.notify({ userId: req.userId, message: `Added "${song.title}" to ${playlist.name}.` });

  res.status(201).json({ playlist: toPlaylistDTO(playlist, loadTracksFor(playlist.id)) });
});

router.delete('/:id/songs/:songId', requireAuth, (req, res) => {
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?').run(playlist.id, req.params.songId);
  res.json({ playlist: toPlaylistDTO(playlist, loadTracksFor(playlist.id)) });
});

router.delete('/:id', requireAuth, (req, res) => {
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });
  db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ?').run(playlist.id);
  db.prepare('DELETE FROM playlists WHERE id = ?').run(playlist.id);
  res.json({ ok: true });
});

module.exports = router;
