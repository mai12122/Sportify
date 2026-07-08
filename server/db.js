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
    ['Frank Ocean', 'Genre-defining R&B singer-songwriter.'],
    ['Sabrina Carpenter', 'Pop artist with warm vocals and intimate storytelling.'],
    ['NewJeans', 'K-pop girl group known for fresh sound and strong visuals.'],
    ['SZA', 'R&B singer-songwriter blending soul, hip-hop, and alt-pop.'],
    ['Harry Styles', 'Pop-rock artist blending retro and modern sounds.'],
    ['Olivia Rodrigo', 'Pop-rock singer-songwriter known for confessional lyrics.'],
    ['Ariana Grande', 'Pop and R&B artist with a four-octave vocal range.'],
    ['Taylor Swift', 'Singer-songwriter spanning country, pop, and indie-folk eras.'],
    ['Stray Kids', 'South Korean boy group known for self-produced, high-energy tracks.'],
    ['ATEEZ', 'South Korean boy group known for pirate-themed concepts and powerful performances.'],
  ];
  const artistIds = artists.map((a) => insertArtist.run(...a).lastInsertRowid);

  const insertSong = db.prepare(
    'INSERT INTO songs (title, artist_id, album, duration_sec, cover_color, plays) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const palette = ['#1ED760', '#F5A623', '#E85D75', '#4C6FFF', '#9B59B6', '#2EC4B6'];
  const songs = [
    // Frank Ocean (index 0)
    ['Thinkin Bout You', 0, 'Channel Orange', 200, 0, 1500000],
    ['Pyramids', 0, 'Channel Orange', 592, 1, 800000],
    ['Pink + White', 0, 'Blonde', 184, 5, 2200000],

    // Sabrina Carpenter (index 1)
    ['Espresso', 1, "Emails I Can't Send", 175, 2, 2500000],
    ['Please Please Please', 1, "Emails I Can't Send", 186, 3, 2100000],

    // NewJeans (index 2)
    ['Hype Boy', 2, 'New Jeans', 179, 4, 1300000],
    ['Ditto', 2, 'New Jeans', 186, 5, 1700000],
    ['Super Shy', 2, 'Get Up', 154, 4, 1500000],

    // SZA (index 3)
    ['Kill Bill', 3, 'SOS', 153, 0, 2600000],
    ['Snooze', 3, 'SOS', 201, 1, 2100000],

    // Harry Styles (index 4)
    ['As It Was', 4, "Harry's House", 167, 2, 3100000],
    ['Watermelon Sugar', 4, 'Fine Line', 174, 3, 2400000],

    // ---- Olivia Rodrigo (index 5) — SOUR (2021) + GUTS (2023) ----
    ['drivers license', 5, 'SOUR', 242, 2, 2450000],
    ['good 4 u', 5, 'SOUR', 178, 3, 1890000],
    ['deja vu', 5, 'SOUR', 215, 4, 1230000],
    ['traitor', 5, 'SOUR', 229, 1, 1100000],
    ['brutal', 5, 'SOUR', 137, 0, 890000],
    ['1 step forward, 3 steps back', 5, 'SOUR', 176, 5, 610000],
    ['jealousy, jealousy', 5, 'SOUR', 174, 2, 720000],
    ['favorite crime', 5, 'SOUR', 176, 3, 590000],
    ['happier', 5, 'SOUR', 179, 4, 840000],
    ['enough for you', 5, 'SOUR', 210, 1, 560000],
    ['vampire', 5, 'GUTS', 219, 5, 980000],
    ['bad idea right?', 5, 'GUTS', 185, 0, 750000],
    ['get him back!', 5, 'GUTS', 211, 2, 640000],
    ['love is embarrassing', 5, 'GUTS', 172, 3, 520000],
    ['making the bed', 5, 'GUTS', 189, 4, 480000],
    ['all-american bitch', 5, 'GUTS', 174, 1, 700000],
    ['lacy', 5, 'GUTS', 148, 5, 430000],
    ['ballad of a homeschooled girl', 5, 'GUTS', 191, 0, 410000],
    ['pretty isn\u2019t pretty', 5, 'GUTS', 174, 2, 390000],
    ['teenage dream', 5, 'GUTS', 249, 3, 620000],

    // ---- Ariana Grande (index 6) — Sweetener, thank u next, Positions, eternal sunshine ----
    ['thank u, next', 6, 'thank u, next', 205, 3, 2100000],
    ['7 rings', 6, 'thank u, next', 178, 4, 1950000],
    ['imagine', 6, 'thank u, next', 197, 5, 1120000],
    ['NASA', 6, 'thank u, next', 185, 0, 640000],
    ['needy', 6, 'thank u, next', 202, 1, 590000],
    ['positions', 6, 'Positions', 172, 2, 1450000],
    ['34+35', 6, 'Positions', 173, 3, 1340000],
    ['pov', 6, 'Positions', 211, 4, 980000],
    ['motive', 6, 'Positions', 168, 5, 520000],
    ['off the table', 6, 'Positions', 220, 0, 470000],
    ['God is a woman', 6, 'Sweetener', 197, 1, 1180000],
    ['no tears left to cry', 6, 'Sweetener', 226, 2, 1520000],
    ['breathin', 6, 'Sweetener', 213, 3, 780000],
    ['successful', 6, 'Sweetener', 223, 4, 410000],
    ['R.E.M.', 6, 'Sweetener', 217, 5, 360000],
    ['yes, and?', 6, 'eternal sunshine', 227, 0, 900000],
    ['we can\u2019t be friends', 6, 'eternal sunshine', 231, 1, 1050000],
    ['the boy is mine', 6, 'eternal sunshine', 189, 2, 610000],
    ['true story', 6, 'eternal sunshine', 202, 3, 340000],
    ['supernatural', 6, 'eternal sunshine', 214, 4, 480000],

    // ---- Taylor Swift (index 7) — 1989, Lover, folklore, Midnights ----
    ['Welcome To New York', 7, '1989', 212, 3, 610000],
    ['Blank Space', 7, '1989', 231, 4, 2100000],
    ['Style', 7, '1989', 231, 5, 1980000],
    ['Shake It Off', 7, '1989', 219, 0, 2400000],
    ['Wildest Dreams', 7, '1989', 220, 1, 1750000],
    ['Cruel Summer', 7, 'Lover', 178, 2, 2350000],
    ['Lover', 7, 'Lover', 221, 3, 1200000],
    ['The Man', 7, 'Lover', 190, 4, 780000],
    ['Paper Rings', 7, 'Lover', 197, 5, 640000],
    ['Death By A Thousand Cuts', 7, 'Lover', 220, 0, 520000],
    ['cardigan', 7, 'folklore', 239, 1, 1450000],
    ['the 1', 7, 'folklore', 210, 2, 690000],
    ['august', 7, 'folklore', 261, 3, 980000],
    ['betty', 7, 'folklore', 294, 4, 720000],
    ['exile', 7, 'folklore', 285, 5, 860000],
    ['Anti-Hero', 7, 'Midnights', 200, 0, 2600000],
    ['Lavender Haze', 7, 'Midnights', 202, 1, 1100000],
    ['Karma', 7, 'Midnights', 205, 2, 940000],
    ['Snow On The Beach', 7, 'Midnights', 256, 3, 610000],
    ['Bejeweled', 7, 'Midnights', 194, 4, 700000],

    // ---- Stray Kids (index 8) — NOEASY, ODDINARY, MAXIDENT, 5-STAR ----
    ['Thunderous', 8, 'NOEASY', 175, 5, 1100000],
    ['Domino', 8, 'NOEASY', 197, 0, 890000],
    ['Silent Cry', 8, 'NOEASY', 210, 1, 520000],
    ['Ex', 8, 'NOEASY', 178, 2, 410000],
    ['Sunshine', 8, 'NOEASY', 191, 3, 380000],
    ['MANIAC', 8, 'ODDINARY', 165, 4, 1050000],
    ['Venom', 8, 'ODDINARY', 172, 5, 470000],
    ['Freeze', 8, 'ODDINARY', 188, 0, 360000],
    ['Muddy Water', 8, 'ODDINARY', 203, 1, 320000],
    ['Star Lost', 8, 'ODDINARY', 214, 2, 290000],
    ['CASE 143', 8, 'MAXIDENT', 168, 3, 980000],
    ['Charmer', 8, 'MAXIDENT', 179, 4, 420000],
    ['Lonely St.', 8, 'MAXIDENT', 195, 5, 350000],
    ['Slump', 8, 'MAXIDENT', 176, 3, 300000],
    ['Ssick', 8, 'MAXIDENT', 182, 4, 280000],
    ['S-Class', 8, '5-STAR', 173, 0, 1250000],
    ['Social Path', 8, '5-STAR', 184, 1, 610000],
    ['Topline', 8, '5-STAR', 198, 2, 470000],
    ['Church', 8, '5-STAR', 190, 5, 340000],
    ['Walkin On Water', 8, '5-STAR', 205, 0, 260000],

    // ---- ATEEZ (index 9) — TREASURE, ZERO: FEVER Pt.1 & Pt.3, THE WORLD EP.FIN ----
    ['Pirate King', 9, 'TREASURE EP.FIN : All To Action', 197, 1, 780000],
    ['Treasure', 9, 'TREASURE EP.FIN : All To Action', 210, 2, 520000],
    ['Wonderland', 9, 'TREASURE EP.FIN : All To Action', 185, 3, 610000],
    ['Say My Name', 9, 'TREASURE EP.FIN : All To Action', 199, 4, 470000],
    ['Hala Hala', 9, 'TREASURE EP.FIN : All To Action', 203, 5, 390000],
    ['Inception', 9, 'ZERO : FEVER Part.1', 213, 0, 890000],
    ['Answer', 9, 'ZERO : FEVER Part.1', 191, 1, 620000],
    ['Higher', 9, 'ZERO : FEVER Part.1', 204, 2, 480000],
    ['Deja Vu', 9, 'ZERO : FEVER Part.1', 187, 3, 350000],
    ['Guerrilla', 9, 'ZERO : FEVER Part.1', 196, 4, 410000],
    ['THANXX', 9, 'ZERO : FEVER Part.3', 176, 5, 1050000],
    ['BOUNCY (K-HOT CHILLI PEPPERS)', 9, 'ZERO : FEVER Part.3', 168, 0, 720000],
    ['Crazy Form', 9, 'ZERO : FEVER Part.3', 182, 1, 380000],
    ['Halazia', 9, 'ZERO : FEVER Part.3', 194, 2, 330000],
    ['Bad Cupid', 9, 'ZERO : FEVER Part.3', 179, 3, 460000],
    ['Set It Off', 9, 'THE WORLD EP.FIN : WILL', 208, 4, 690000],
    ['Lemon Drop', 9, 'THE WORLD EP.FIN : WILL', 190, 5, 410000],
    ['Ice On My Teeth', 9, 'THE WORLD EP.FIN : WILL', 201, 0, 380000],
    ['WORK', 9, 'THE WORLD EP.FIN : WILL', 174, 1, 290000],
    ['Wave', 9, 'THE WORLD EP.FIN : WILL', 197, 2, 260000],
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