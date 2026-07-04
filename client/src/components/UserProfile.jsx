import React, { useState } from 'react';
import { LogOut, User, Music, Edit2, Check, X } from 'lucide-react';
import { api } from '../api';

export default function UserProfile({ user, onLogout, isOpen, onClose, onUpdateUser }) {
  if (!isOpen) return null;

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!displayName.trim()) return setError('Display name cannot be empty.');
    try {
      setError('');
      setLoading(true);
      const data = await api.updateProfile({ displayName: displayName.trim() });
      if (onUpdateUser) onUpdateUser(data.user);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setDisplayName(user.displayName || '');
    setEditing(false);
    setError('');
  }

  return (
    <>
      <div className="profile-overlay" onClick={onClose} />
      <div className="profile-panel">
        <div className="profile-header">
          <div className="profile-avatar">{(displayName || 'U').charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            {!editing ? (
              <div className="profile-name-row">
                <div className="profile-name">{user.displayName}</div>
                <button className="icon-btn" title="Edit profile" onClick={() => setEditing(true)}>
                  <Edit2 size={14} />
                </button>
              </div>
            ) : (
              <div className="profile-edit">
                <input
                  className="profile-edit-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                />
                <div className="profile-edit-actions">
                  <button className="icon-btn" onClick={save} disabled={loading} title="Save">
                    {loading ? '...' : <Check size={14} />}
                  </button>
                  <button className="icon-btn" onClick={cancel} disabled={loading} title="Cancel">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="profile-email">{user.email}</div>
            <div className={`profile-tier ${user.tier === 'PREMIUM' ? 'premium' : 'free'}`}>
              {user.tier === 'PREMIUM' ? '⭐ Premium' : 'Free Plan'}
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <Music size={16} />
            <div>
              <div className="stat-label">Playlists</div>
              <div className="stat-value">{user.playlistCount || 0}</div>
            </div>
          </div>
          <div className="stat-item">
            <User size={16} />
            <div>
              <div className="stat-label">Member Since</div>
              <div className="stat-value">{new Date(user.createdAt).getFullYear()}</div>
            </div>
          </div>
        </div>

        {error && <div className="field-error">{error}</div>}

        <button className="profile-logout" onClick={onLogout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </>
  );
}
