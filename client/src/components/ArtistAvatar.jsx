import React from 'react';

// We deliberately don't hotlink real photos of real people here (rights +
// reliability), so each artist gets a distinct, deterministic gradient
// avatar with their initials instead — same idea as Slack/Google avatars.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function ArtistAvatar({ name, size = 96, className = '', onClick }) {
  const h = hashString(name || '');
  const hue1 = h % 360;
  const hue2 = (hue1 + 55) % 360;
  const gradient = `linear-gradient(135deg, hsl(${hue1}, 70%, 45%), hsl(${hue2}, 70%, 30%))`;

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={`artist-avatar ${className}`}
      style={{ width: size, height: size, background: gradient, fontSize: size * 0.34 }}
      onClick={onClick}
      title={name}
    >
      {initials(name)}
    </Tag>
  );
}
