import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Play } from 'lucide-react';
import TrackRow from './TrackRow.jsx';
import CoverArt from './CoverArt.jsx';
import ArtistAvatar from './ArtistAvatar.jsx';

export default function Browse({ mode, currentTrack, onPlay, playlists, onAddToPlaylist }) {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
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

  useEffect(() => {
    if (mode !== 'home') return;
    api.artists().then((data) => setArtists(data.artists));
  }, [mode]);

  // Split songs into featured (first 6) and the rest for home view
  const featuredSongs = songs.slice(0, 6);
  const recentSongs = songs.slice(6);

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

      {mode === 'home' && query && (
        <div className="filter-chip">
          <span>Showing songs by "{query}"</span>
          <button onClick={() => setQuery('')}>Clear</button>
        </div>
      )}

      {/* Artist avatar row */}
      {mode === 'home' && artists.length > 0 && (
        <>
          <div className="section-head">
            <h2>Artists</h2>
          </div>
          <div className="artist-row">
            {artists
              .filter((a) => a.songCount > 0)
              .map((a) => (
                <div className="artist-row-item" key={a.id}>
                  <ArtistAvatar name={a.name} size={96} onClick={() => setQuery(a.name)} />
                  <p className="artist-row-name">{a.name}</p>
                  <p className="artist-row-count">{a.songCount} songs</p>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Card grid for home view */}
      {mode === 'home' && !loading && songs.length > 0 && (
        <>
          <div className="section-head">
            <h2>Featured for you</h2>
          </div>
          <div className="card-grid">
            {featuredSongs.map((track) => (
              <div className="card" key={track.id} onClick={() => onPlay(track)}>
                <CoverArt
                  className="card-art"
                  artist={track.artist}
                  album={track.album}
                  fallbackColor={track.coverColor}
                >
                  <button
                    className="card-play"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(track);
                    }}
                  >
                    <Play size={18} fill="currentColor" strokeWidth={0} />
                  </button>
                </CoverArt>
                <p className="card-title">{track.title}</p>
                <p className="card-subtitle">{track.artist}</p>
              </div>
            ))}
          </div>

          {recentSongs.length > 0 && (
            <>
              <div className="section-head">
                <h2>Recently played</h2>
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
                {recentSongs.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i + 7}
                    isPlaying={currentTrack?.id === track.id}
                    onPlay={onPlay}
                    playlists={playlists}
                    onAddToPlaylist={onAddToPlaylist}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Track table for search view */}
      {mode === 'search' && (
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
      )}

      {/* Loading state for home view */}
      {mode === 'home' && loading && <div className="empty-hint">Loading tracks…</div>}
      {mode === 'home' && !loading && songs.length === 0 && (
        <div className="empty-hint">No tracks available yet.</div>
      )}
    </div>
  );
}