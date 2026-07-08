const express = require('express');
const cors = require('cors');
const db = require('./db');
const { center, attachDefaultObservers } = require('./patterns/NotificationCenter');

attachDefaultObservers(center, db);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/artists', require('./routes/artists'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/subscription', require('./routes/subscription'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Spotify prototype API listening on http://localhost:${PORT}`);
});
