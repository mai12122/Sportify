import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import Login from './components/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import Browse from './components/Browse.jsx';
import PlaylistView from './components/PlaylistView.jsx';
import Premium from './components/Premium.jsx';
import Player from './components/Player.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [view, setView] = useState('home');
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [skipDisabledReason, setSkipDisabledReason] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingSession(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setCheckingSession(false));
  }, []);

  const refreshPlaylists = useCallback(() => {
    api.playlists().then((data) => setPlaylists(data.playlists));
  }, []);

  useEffect(() => {
    if (user) refreshPlaylists();
  }, [user, refreshPlaylists]);

  function handleAuthed(u) {
    setUser(u);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
    setPlaylists([]);
    setCurrentTrack(null);
    setPlayback(null);
    setView('home');
  }

  async function handlePlay(track) {
    try {
      const data = await api.play(track.id);
      setCurrentTrack(data.track);
      setPlayback(data.playback);
      setSkipDisabledReason('');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSkip() {
    if (!currentTrack) return;
    try {
      const data = await api.skip(currentTrack.id);
      setPlayback((p) => (p ? { ...p, skipsRemaining: data.skipsRemaining } : p));
      setSkipDisabledReason('');
    } catch (err) {
      setSkipDisabledReason(err.message);
    }
  }

  async function handleCreatePlaylist(name) {
    await api.createPlaylist(name);
    refreshPlaylists();
  }

  async function handleAddToPlaylist(playlistId, songId) {
    await api.addToPlaylist(playlistId, songId);
    refreshPlaylists();
  }

  async function handleRemoveFromPlaylist(playlistId, songId) {
    await api.removeFromPlaylist(playlistId, songId);
    refreshPlaylists();
  }

  async function handleDeletePlaylist(playlistId) {
    await api.deletePlaylist(playlistId);
    setView('home');
    refreshPlaylists();
  }

  async function handleUpgrade() {
    const data = await api.upgrade();
    setUser(data.user);
  }

  async function handleDowngrade() {
    const data = await api.downgrade();
    setUser(data.user);
  }

  function handleRefreshNotifications() {
    api.notifications().then((data) => setNotifications(data.notifications));
  }

  if (checkingSession) return <div className="boot-screen">Loading Stream…</div>;
  if (!user) return <Login onAuthed={handleAuthed} />;

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || null;

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        setActivePlaylistId={setActivePlaylistId}
        onCreatePlaylist={handleCreatePlaylist}
      />

      <div className="main-col">
        <TopBar
          user={user}
          notifications={notifications}
          onLogout={handleLogout}
          onRefreshNotifications={handleRefreshNotifications}
        />

        <main className="main-content">
          {(view === 'home' || view === 'search') && (
            <Browse
              mode={view}
              currentTrack={currentTrack}
              onPlay={handlePlay}
              playlists={playlists}
              onAddToPlaylist={handleAddToPlaylist}
            />
          )}
          {view === 'playlist' && (
            <PlaylistView
              playlist={activePlaylist}
              currentTrack={currentTrack}
              onPlay={handlePlay}
              onRemove={handleRemoveFromPlaylist}
              onDelete={handleDeletePlaylist}
            />
          )}
          {view === 'premium' && <Premium user={user} onUpgrade={handleUpgrade} onDowngrade={handleDowngrade} />}
        </main>

        <Player track={currentTrack} playback={playback} onSkip={handleSkip} skipDisabledReason={skipDisabledReason} />
      </div>
    </div>
  );
}
