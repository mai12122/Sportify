import React from 'react';
import useArtistPhoto from '../hooks/useArtistPhoto.js';

// Each artist avatar first tries to render a real artist photo from the
// iTunes artwork lookup. If no image is available, it falls back to a
// deterministic gradient with initials.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.codePointAt(i);
    hash = Math.trunc(hash);
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
  const { url } = useArtistPhoto(name);
  const h = hashString(name || '');
  const hue1 = h % 360;
  const hue2 = (hue1 + 55) % 360;
  const gradient = `linear-gradient(135deg, hsl(${hue1}, 70%, 45%), hsl(${hue2}, 70%, 30%))`;

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={`artist-avatar ${className}`}
      style={{
        width: size,
        height: size,
        background: url ? `url(${url}) center/cover no-repeat` : gradient,
        fontSize: size * 0.34,
      }}
      onClick={onClick}
      title={name}
    >
      {!url && initials(name)}
    </Tag>
  );
}
