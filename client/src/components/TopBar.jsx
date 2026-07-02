import React, { useState } from 'react';

export default function TopBar({ user, notifications, onLogout, onRefreshNotifications }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="topbar">
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <div className="notif-wrap">
          <button
            className="icon-btn"
            title="Notifications"
            onClick={() => {
              setOpen((o) => !o);
              if (!open) onRefreshNotifications();
            }}
          >
            🔔{notifications.length > 0 && <span className="notif-dot" />}
          </button>
          {open && (
            <div className="notif-panel" onMouseLeave={() => setOpen(false)}>
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
        <span className="user-name">{user.displayName}</span>
        <button className="btn-ghost" onClick={onLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}
