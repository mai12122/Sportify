import React from 'react';
import TrackRow from './TrackRow.jsx';

export default function PlaylistView({ playlist, currentTrack, onPlay, onRemove, onDelete }) {
  if (!playlist) return null;
  return (
    <div className="view">
      <div className="playlist-hero">
        <div className="playlist-hero-art" style={{ background: playlist.tracks[0]?.coverColor || '#3a3f3d' }} />
        <div>
          <div className="eyebrow">Playlist</div>
          <h1>{playlist.name}</h1>
          <p className="playlist-hero-sub">{playlist.tracks.length} tracks</p>
          <button className="btn-ghost-danger" onClick={() => onDelete(playlist.id)}>
            Delete playlist
          </button>
        </div>
      </div>

      <div className="track-table">
        <div className="track-table-head">
          <span>#</span>
          <span />
          <span>Title</span>
          <span>Album</span>
          <span>Time</span>
          <span />
        </div>
        {playlist.tracks.length === 0 && (
          <div className="empty-hint">Empty for now — add songs from Home or Search.</div>
        )}
        {playlist.tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i + 1}
            isPlaying={currentTrack?.id === track.id}
            onPlay={onPlay}
            onRemove={(songId) => onRemove(playlist.id, songId)}
          />
        ))}
      </div>
    </div>
  );
}
