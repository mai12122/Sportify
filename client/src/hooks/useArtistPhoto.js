import { useEffect, useState } from 'react';

const cache = new Map();
const inFlight = new Map();

function cacheKey(artist) {
  return `${(artist || '').toLowerCase()}`;
}

function upscaleArtwork(url, size = 600) {
  if (!url) return null;
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, `/${size}x${size}bb.$1`);
}

async function fetchArtistPhoto(artist) {
  const term = encodeURIComponent(artist);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('artist artwork lookup failed');
  const data = await res.json();
  const hit = data.results?.[0];
  return hit ? upscaleArtwork(hit.artworkUrl100) : null;
}

export default function useArtistPhoto(artist) {
  const key = cacheKey(artist);
  const [url, setUrl] = useState(cache.has(key) ? cache.get(key) : undefined);

  useEffect(() => {
    if (!artist) return;
    if (cache.has(key)) {
      setUrl(cache.get(key));
      return;
    }

    let active = true;
    if (!inFlight.has(key)) {
      inFlight.set(
        key,
        fetchArtistPhoto(artist)
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
  }, [artist, key]);

  return { url: url || null, loading: url === undefined };
}
