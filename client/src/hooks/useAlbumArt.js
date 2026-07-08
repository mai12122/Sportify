import { useEffect, useState } from 'react';

// Module-level cache so the same artist+album is only ever looked up once
// per page session, no matter how many track rows / cards reference it.
const cache = new Map();
const inFlight = new Map();

function cacheKey(artist, album) {
  return `${(artist || '').toLowerCase()}::${(album || '').toLowerCase()}`;
}

// iTunes Search API is a free, public, no-key-required endpoint that Apple
// explicitly serves for third-party apps to look up official artwork by
// artist/album/track name. Artwork URLs come back at 100x100 by default;
// bumping the filename segment gives us a much crisper image.
function upscaleArtwork(url, size = 600) {
  if (!url) return null;
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, `/${size}x${size}bb.$1`);
}

async function fetchArtwork(artist, album) {
  const term = encodeURIComponent(`${artist} ${album}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('artwork lookup failed');
  const data = await res.json();
  const hit = data.results && data.results[0];
  return hit ? upscaleArtwork(hit.artworkUrl100) : null;
}

// Returns { url, loading } for a given artist/album pair. Falls back to
// null (caller should render its own gradient) if artwork can't be found.
export default function useAlbumArt(artist, album) {
  const key = cacheKey(artist, album);
  const [url, setUrl] = useState(cache.has(key) ? cache.get(key) : undefined);

  useEffect(() => {
    if (!artist || !album) return;
    if (cache.has(key)) {
      setUrl(cache.get(key));
      return;
    }

    let active = true;
    if (!inFlight.has(key)) {
      inFlight.set(
        key,
        fetchArtwork(artist, album)
          .catch(() => null)
          .then((result) => {
            cache.set(key, result);
            inFlight.delete(key);
            return result;
          })
      );
    }
    inFlight.get(key).then((result) => {
      if (active) setUrl(result);
    });

    return () => {
      active = false;
    };
  }, [key, artist, album]);

  return { url: url || null, loading: url === undefined };
}
