// db.js — SQLite database bootstrap + seed data
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'spotify.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'FREE',      -- FREE | PREMIUM
  skips_used_today INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bio TEXT
);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist_id INTEGER NOT NULL,
  album TEXT,
  duration_sec INTEGER NOT NULL,
  cover_color TEXT NOT NULL DEFAULT '#1ED760',
  plays INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id),
  FOREIGN KEY (song_id) REFERENCES songs(id)
);

CREATE TABLE IF NOT EXISTS listening_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  played_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// --- Seed once, if empty ---
const artistCount = db.prepare('SELECT COUNT(*) AS c FROM artists').get().c;
if (artistCount === 0) {
  const insertArtist = db.prepare('INSERT INTO artists (name, bio) VALUES (?, ?)');
  const artists = [
    ['Nova Ridge', 'Indie synth duo from Portland.'],
    ['Marlowe Str.', 'Lo-fi bedroom pop.'],
    ['The Vantablacks', 'Post-punk revival act.'],
    ['Coral Static', 'Ambient / downtempo electronic.'],
    ['Juno Ledger', 'Singer-songwriter, folk-adjacent.'],
  ];
  const artistIds = artists.map(a => insertArtist.run(...a).lastInsertRowid);

  const insertSong = db.prepare(
    'INSERT INTO songs (title, artist_id, album, duration_sec, cover_color, plays) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const palette = ['#1ED760', '#F5A623', '#E85D75', '#4C6FFF', '#9B59B6', '#2EC4B6'];
  const songs = [
    ['Glass Horizon', 0, 'Afterglow', 214, 0, 12450],
    ['Static Bloom', 0, 'Afterglow', 198, 1, 8320],
    ['Paper Tide', 1, 'Slow Rooms', 231, 2, 15230],
    ['Low Light', 1, 'Slow Rooms', 187, 3, 6110],
    ['Concrete Halo', 2, 'Kill the Radio', 245, 4, 20110],
    ['Night Shift', 2, 'Kill the Radio', 202, 5, 9870],
    ['Salt Water', 3, 'Coral Static', 265, 0, 4210],
    ['Drift Mode', 3, 'Coral Static', 300, 1, 5010],
    ['Ledger Lines', 4, 'Open Roads', 176, 2, 13200],
    ['Quiet Fields', 4, 'Open Roads', 220, 3, 7890],
    ['Amber Static', 2, 'Kill the Radio', 190, 4, 3300],
    ['Neon Ledger', 0, 'Afterglow', 208, 5, 9100],
  ];
  for (const [title, artistIdx, album, dur, colorIdx, plays] of songs) {
    insertSong.run(title, artistIds[artistIdx], album, dur, palette[colorIdx], plays);
  }

  const demoHash = bcrypt.hashSync('password123', 8);
  db.prepare(
    'INSERT INTO users (email, password_hash, display_name, tier) VALUES (?, ?, ?, ?)'
  ).run('demo@spotify.local', demoHash, 'Demo Listener', 'FREE');
}

module.exports = db;
