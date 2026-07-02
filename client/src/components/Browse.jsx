import React, { useEffect, useState } from 'react';
import { api } from '../api';
import TrackRow from './TrackRow.jsx';

export default function Browse({ mode, currentTrack, onPlay, playlists, onAddToPlaylist }) {
  const [songs, setSongs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .songs(query)
      .then((data) => active && setSongs(data.songs))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <div className="eyebrow">{mode === 'search' ? 'Search' : 'Home'}</div>
          <h1>{mode === 'search' ? 'Find something to play' : 'Good to have you back'}</h1>
        </div>
      </div>

      {mode === 'search' && (
        <input
          className="search-input"
          autoFocus
          placeholder="Songs, artists, albums…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      <div className="track-table">
        <div className="track-table-head">
          <span>#</span>
          <span />
          <span>Title</span>
          <span>Album</span>
          <span>Time</span>
          <span />
        </div>
        {loading && <div className="empty-hint">Loading tracks…</div>}
        {!loading && songs.length === 0 && <div className="empty-hint">No tracks match "{query}".</div>}
        {!loading &&
          songs.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i + 1}
              isPlaying={currentTrack?.id === track.id}
              onPlay={onPlay}
              playlists={playlists}
              onAddToPlaylist={onAddToPlaylist}
            />
          ))}
      </div>
    </div>
  );
}
