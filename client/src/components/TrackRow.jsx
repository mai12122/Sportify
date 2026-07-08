import React, { useState } from 'react';
import { Play, Plus, X } from 'lucide-react';
import CoverArt from './CoverArt.jsx';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function TrackRow({ track, index, isPlaying, onPlay, playlists, onAddToPlaylist, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`track-row ${isPlaying ? 'playing' : ''}`}>
      {/* Track Index: Swaps between Number and Play Button on hover via CSS */}
      <div className="track-index">
        {isPlaying ? (
          <span className="playing-bars" aria-hidden="true">
            <i /><i /><i />
          </span>
        ) : (
          <>
            <span className="track-index-num">{index}</span>
            <button
              className="track-play-btn"
              onClick={() => onPlay(track)}
              aria-label={`Play ${track.title}`}
            >
              <Play size={14} fill="currentColor" strokeWidth={0} />
            </button>
          </>
        )}
      </div>

      <CoverArt
        as="button"
        className="track-cover"
        artist={track.artist}
        album={track.album}
        fallbackColor={track.coverColor}
        onClick={() => onPlay(track)}
        aria-label={`Play ${track.title}`}
      />

      <button
        type="button"
        className="track-meta"
        onClick={() => onPlay(track)}
        title={`Play ${track.title}`}
        aria-label={`Play ${track.title}`}
      >
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.artist}</div>
      </button>

      <div className="track-album">{track.album}</div>
      <div className="track-duration">{formatDuration(track.durationSec)}</div>

      <div className="track-actions">
        {playlists && (
          <div className="track-menu-wrap">
            <button className="icon-btn" onClick={() => setMenuOpen((o) => !o)} title="Add to playlist">
              <Plus size={16} strokeWidth={2.5} />
            </button>
            {menuOpen && (
              <div className="track-menu" onMouseLeave={() => setMenuOpen(false)}>
                {playlists.length === 0 && <div className="track-menu-empty">Create a playlist first</div>}
                {playlists.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onAddToPlaylist(p.id, track.id);
                      setMenuOpen(false);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {onRemove && (
          <button className="icon-btn" title="Remove from playlist" onClick={() => onRemove(track.id)}>
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}