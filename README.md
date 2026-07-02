# Stream — Spotify Prototype

A working prototype for the FESE306 SDD: **React** (Vite) frontend, **Node.js + Express** backend,
**SQLite** database (via `better-sqlite3`).

## Why this stack
- **SQLite** — zero setup (no server/daemon to install), file-based, plenty for a class prototype,
  and swaps out for Postgres/MySQL later with almost no code change since all access goes through
  parameterized `better-sqlite3` calls.
- **Express** — thin, unopinionated, easy to map directly onto the sequence diagrams (`SubsCtrl`,
  `ContentSvc`, etc. correspond to route files).
- **Vite + React** — fast dev server, no build config needed.

## Project structure
```
spotify-prototype/
  server/
    server.js              Express app entrypoint
    db.js                  SQLite schema + seed data (5 artists, 12 songs, 1 demo user)
    middleware/auth.js      JWT auth guard
    routes/                 auth, songs, playlists, subscription
    patterns/                the 5 SDD design patterns, implemented for real
  client/
    src/
      App.jsx, api.js       app shell + fetch client
      components/           Login, Sidebar, TopBar, Browse, PlaylistView, Player, Premium, TrackRow
```

## Design pattern → code mapping
| Pattern | File | Role |
|---|---|---|
| Strategy | `server/patterns/PlaybackStrategy.js` | `FreePlaybackStrategy` vs `PremiumPlaybackStrategy` decide bitrate, ads, skip limits |
| Observer | `server/patterns/NotificationCenter.js` | `NotificationCenter` broadcasts events (playlist updated, upgraded) to two independent observers |
| Singleton | `server/patterns/StreamGateway.js` | One shared gateway tracks active streaming sessions process-wide |
| Adapter | `server/patterns/ContentAdapter.js` | Converts raw SQLite rows (snake_case, joined) into the DTO shape the frontend consumes |
| Chain of Responsibility | `server/patterns/ValidationChain.js` | Playlist-name validation runs through 3 independent handlers (non-empty → length → uniqueness) |

## Running it locally

**1. Install dependencies** (needs internet access, which this sandbox didn't have — run these on your machine):
```bash
cd server && npm install
cd ../client && npm install
```

**2. Start the backend** (creates & seeds `server/spotify.db` on first run):
```bash
cd server
npm run dev
# -> http://localhost:4000
```

**3. Start the frontend** in a second terminal:
```bash
cd client
npm run dev
# -> http://localhost:5173  (proxies /api to :4000)
```

**4. Log in** with the seeded demo account (pre-filled on the login screen):
```
email: demo@spotify.local
password: password123
```
Or just click "Sign up" to create your own.

## What you can do in the app
- Browse / search the seeded catalog (5 artists, 12 tracks)
- Play a track — the player bar shows bitrate, simulated ad breaks (free tier), and a progress bar
- Free tier: 6 skips/day enforced server-side, occasional ad banner, 128kbps
- Create playlists, add/remove tracks (name validation runs through the Chain of Responsibility)
- Upgrade/downgrade Premium — triggers an Observer-broadcast notification, shown via the bell icon
- Notifications persist in SQLite (`notifications` table) per user

## Notes for extending toward the full SDD
- Swap `better-sqlite3` for a Postgres client behind the same query shape to move toward production.
- `StreamGateway` currently lives in-process; in a real deployment it'd back onto Redis so it's shared
  across server instances.
- Payment in `routes/subscription.js` is stubbed (`paymentConfirmed = true`) — swap in a real
  `PaymentGW` call there.
