import React, { useState } from 'react';

const NAV = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'premium', label: 'Premium', icon: '✦' },
];

export default function Sidebar({ view, setView, playlists, activePlaylistId, setActivePlaylistId, onCreatePlaylist }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function submitCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setError('');
      await onCreatePlaylist(newName.trim());
      setNewName('');
      setCreating(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-dot" />
        Stream
      </div>

      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-divider" />

      <div className="playlists-head">
        <span>Your playlists</span>
        <button className="icon-btn" title="New playlist" onClick={() => setCreating((c) => !c)}>
          +
        </button>
      </div>

      {creating && (
        <form className="new-playlist-form" onSubmit={submitCreate}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name"
          />
          {error && <div className="field-error">{error}</div>}
        </form>
      )}

      <div className="playlist-list">
        {playlists.length === 0 && <div className="empty-hint">No playlists yet.</div>}
        {playlists.map((p) => (
          <button
            key={p.id}
            className={`playlist-item ${view === 'playlist' && activePlaylistId === p.id ? 'active' : ''}`}
            onClick={() => {
              setActivePlaylistId(p.id);
              setView('playlist');
            }}
          >
            <span className="playlist-swatch" style={{ background: p.tracks[0]?.coverColor || '#3a3f3d' }} />
            <span className="playlist-name">{p.name}</span>
            <span className="playlist-count">{p.tracks.length}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
