import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import UserProfile from './UserProfile.jsx';

export default function TopBar({ user, notifications, onLogout, onRefreshNotifications, onUpdateUser }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  function handleLogout() {
    setProfileOpen(false);
    onLogout();
  }

  return (
    <div className="topbar">
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <div className="notif-wrap">
          <button
            className="notif-btn"
            title="Notifications"
            onClick={() => {
              setNotifOpen((o) => !o);
              if (!notifOpen) onRefreshNotifications();
            }}
          >
            <Bell size={18} />
            {notifications.length > 0 && <span className="notif-dot" />}
          </button>
          {notifOpen && (
            <div className="notif-panel" onMouseLeave={() => setNotifOpen(false)}>
              <div className="notif-panel-head">Notifications</div>
              {notifications.length === 0 && <div className="track-menu-empty">You're all caught up.</div>}
              {notifications.map((n) => (
                <div key={n.id} className="notif-item">
                  {n.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <span className={`tier-badge ${user.tier === 'PREMIUM' ? 'premium' : ''}`}>
          {user.tier === 'PREMIUM' ? 'Premium' : 'Free'}
        </span>
        <button
          className="user-pill"
          onClick={() => setProfileOpen((o) => !o)}
          title="View profile"
        >
          <span className="user-avatar">{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</span>
          <span className="user-name-text">{user.displayName}</span>
        </button>

        <UserProfile 
          user={user} 
          onLogout={handleLogout} 
          isOpen={profileOpen} 
          onClose={() => setProfileOpen(false)} 
          onUpdateUser={onUpdateUser}
        />
      </div>
    </div>
  );
}
