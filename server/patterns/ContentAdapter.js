// ContentAdapter.js — Adapter Pattern
//
// In the full SDD this sits between external distributor formats and the
// internal domain model. In this prototype it plays the same role between
// raw SQLite rows (snake_case, joined columns) and the shape the frontend
// actually consumes (camelCase DTOs), so nothing downstream cares how the
// data was stored.

function toTrackDTO(row) {
  return {
    id: row.id,
    title: row.title,
    album: row.album,
    artist: row.artist_name || row.artist,
    artistId: row.artist_id,
    durationSec: row.duration_sec,
    coverColor: row.cover_color,
    plays: row.plays,
  };
}

function toPlaylistDTO(row, tracks = []) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    tracks,
  };
}

module.exports = { toTrackDTO, toPlaylistDTO };
