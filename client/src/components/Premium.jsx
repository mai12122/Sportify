import React, { useState } from 'react';

const PERKS = [
  { label: 'Ad-free listening', free: false, premium: true },
  { label: 'Unlimited skips', free: '6 / day', premium: true },
  { label: 'Audio quality', free: '128 kbps', premium: '320 kbps' },
  { label: 'Offline downloads', free: false, premium: true },
];

export default function Premium({ user, onUpgrade, onDowngrade }) {
  const [busy, setBusy] = useState(false);
  const isPremium = user.tier === 'PREMIUM';

  async function handleClick() {
    setBusy(true);
    try {
      isPremium ? await onDowngrade() : await onUpgrade();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="view premium-view">
      <div className="eyebrow">Membership</div>
      <h1>{isPremium ? "You're on Premium" : 'Go Premium'}</h1>
      <p className="playlist-hero-sub">
        {isPremium
          ? 'Ad-free, offline, 320kbps — enjoy the full catalog.'
          : 'Unlock ad-free, offline, and studio-quality streaming.'}
      </p>

      <table className="perk-table">
        <thead>
          <tr>
            <th />
            <th>Free</th>
            <th className="perk-premium-col">Premium</th>
          </tr>
        </thead>
        <tbody>
          {PERKS.map((p) => (
            <tr key={p.label}>
              <td>{p.label}</td>
              <td>{typeof p.free === 'boolean' ? (p.free ? '✓' : '—') : p.free}</td>
              <td className="perk-premium-col">{typeof p.premium === 'boolean' ? '✓' : p.premium}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn-primary btn-premium" onClick={handleClick} disabled={busy}>
        {busy ? 'Please wait…' : isPremium ? 'Switch back to Free' : 'Upgrade to Premium'}
      </button>
      <p className="auth-hint">Prototype checkout — no real payment is processed.</p>
    </div>
  );
}
