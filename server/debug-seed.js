const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'spotify-debug.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
const db = new Database(dbPath);

function init() {
  db.exec(`
CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bio TEXT
);
`);
}

init();
const insertArtist = db.prepare('INSERT INTO artists (name, bio) VALUES (?, ?)');
const artists = [
  ['Frank Ocean', 'Indie synth duo from Portland.'],
  ['Sabrina Carpenter', 'American Pop Star'],
  ['New Jeans', 'K-pop group known for their fresh sound and style.'],
  ['Sza', 'American singer-songwriter blending R&B, soul, and hip-hop influences.'],
  ['Harry Styles', 'Singer-songwriter, british pop-star.'],
  ['Olivia Rodrigo', 'Pop-rock singer-songwriter known for confessional lyrics.'],
  ['Ariana Grande', 'Pop and R&B artist with a four-octave vocal range.'],
  ['Taylor Swift', 'Singer-songwriter spanning country, pop, and indie-folk eras.'],
  ['Stray Kids', 'South Korean boy group known for self-produced, high-energy tracks.'],
  ['ATEEZ', 'South Korean boy group known for pirate-themed concepts and powerful performances.'],
];

for (const [index, a] of artists.entries()) {
  const result = insertArtist.run(...a);
  console.log('inserted', index + 1, a[0], result.lastInsertRowid);
}

const rows = db.prepare('SELECT id,name FROM artists ORDER BY id').all();
console.log('rows', rows.length);
console.log(rows.map(r => `${r.id}:${r.name}`).join('|'));

db.close();
