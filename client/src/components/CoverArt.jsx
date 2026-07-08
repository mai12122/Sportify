import React from 'react';
import useAlbumArt from '../hooks/useAlbumArt.js';

// Renders a track/album cover: real artwork (fetched live from iTunes) on
// top of the existing gradient-color swatch as a fallback/loading state.
// `as` lets callers reuse this as a <button> (clickable covers) or <div>.
export default function CoverArt({
  artist,
  album,
  fallbackColor,
  as: Tag = 'div',
  className = '',
  imgClassName = '',
  children,
  ...rest
}) {
  const { url } = useAlbumArt(artist, album);

  return (
    <Tag
      className={`cover-art ${className}`}
      style={{ background: fallbackColor || 'linear-gradient(135deg, #3a3a3a, #1a1a1a)' }}
      {...rest}
    >
      {url && (
        <img
          className={`cover-art-img ${imgClassName}`}
          src={url}
          alt={album ? `${album} cover` : 'Album cover'}
          loading="lazy"
          draggable="false"
        />
      )}
      {children}
    </Tag>
  );
}
