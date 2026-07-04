import React, { useState } from 'react';
import { Home, Search, Star, Plus, Trash2 } from 'lucide-react';

const NAV = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'premium', label: 'Premium', icon: Star },
];

export default function Sidebar({ view, setView, playlists, activePlaylistId, setActivePlaylistId, onCreatePlaylist, onDeletePlaylist }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [hoveredPlaylist, setHoveredPlaylist] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  async function handleDelete(e, playlistId) {
    e.stopPropagation();
    if (!confirm('Delete this playlist? This cannot be undone.')) return;
    
    try {
      setDeletingId(playlistId);
      await onDeletePlaylist(playlistId);
    } catch (err) {
      alert('Failed to delete playlist: ' + err.message);
    } finally {
      setDeletingId(null);
      setHoveredPlaylist(null);
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="var(--accent)" />
          <rect x="9" y="15" width="3" height="8" rx="1.5" fill="var(--bg-base)" />
          <rect x="14.5" y="9" width="3" height="14" rx="1.5" fill="var(--bg-base)" />
          <rect x="20" y="12" width="3" height="11" rx="1.5" fill="var(--bg-base)" />
        </svg>
        <span>Stream</span>
      </div>

      <nav className="nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <span className="nav-icon">
                <Icon size={20} strokeWidth={2.5} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      <div className="playlists-head">
        <span>Playlists</span>
        <button className="icon-btn" title="New playlist" onClick={() => setCreating((c) => !c)}>
          <Plus size={16} strokeWidth={3} />
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
        {playlists.length === 0 && <div className="empty-hint">Create your first playlist</div>}
        {playlists.map((p) => (
          <div
            key={p.id}
            className="playlist-item-wrapper"
            onMouseEnter={() => setHoveredPlaylist(p.id)}
            onMouseLeave={() => setHoveredPlaylist(null)}
          >
            <button
              className={`playlist-item ${view === 'playlist' && activePlaylistId === p.id ? 'active' : ''}`}
              onClick={() => {
                setActivePlaylistId(p.id);
                setView('playlist');
              }}
            >
              <span className="playlist-swatch" style={{ background: p.tracks[0]?.coverColor || 'linear-gradient(135deg, #3a3a3a, #1a1a1a)' }} />
              <span className="playlist-name">{p.name}</span>
              <span className="playlist-count">{p.tracks.length}</span>
            </button>
            {hoveredPlaylist === p.id && (
              <button
                className="playlist-delete-btn"
                onClick={(e) => handleDelete(e, p.id)}
                disabled={deletingId === p.id}
                title="Delete playlist"
              >
                {deletingId === p.id ? '...' : <Trash2 size={14} />}
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}