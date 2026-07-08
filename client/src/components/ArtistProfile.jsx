import React, { useEffect, useState } from 'react';
import { api } from '../api';
import CoverArt from './CoverArt.jsx';
import TrackRow from './TrackRow.jsx';

export default function ArtistProfile({ artistId, onClose, currentTrack, onPlay, playlists, onAddToPlaylist }) {
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([api.artist(artistId), api.artistSongs(artistId)])
      .then(([artistData, songsData]) => {
        if (!active) return;
        setArtist(artistData.artist || null);
        setSongs(songsData.songs);
      })
      .catch(() => {
        if (!active) return;
        setArtist(null);
        setSongs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [artistId]);

  if (loading) {
    return <div className="view"><div className="empty-hint">Loading artist profile…</div></div>;
  }

  if (!artist) {
    return (
      <div className="view">
        <div className="section-head">
          <button className="btn-ghost" onClick={onClose}>Back</button>
          <h2>Artist not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="view artist-profile-view">
      <div className="view-header artist-profile-header">
        <button className="btn-ghost" onClick={onClose}>Back</button>
        <div className="artist-profile-header-row">
          <CoverArt
            artist={artist.name}
            album={songs[0]?.album || artist.name}
            fallbackColor="#4C6FFF"
            className="artist-profile-header-art"
          />
          <div className="artist-profile-header-meta">
            <div className="eyebrow">Artist</div>
            <h1>{artist.name}</h1>
            <p className="artist-profile-bio">{artist.bio}</p>
            <p className="artist-profile-count">{songs.length} song{songs.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      </div>

      <div className="artist-profile-hero">
        <div className="artist-profile-hero-content">
          <h2>Top songs</h2>
          <p>Browse all tracks by {artist.name}.</p>
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
        {songs.length === 0 && <div className="empty-hint">No songs available for this artist.</div>}
        {songs.map((track, i) => (
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
