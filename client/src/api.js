const BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? authHeaders() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (email, password, displayName) =>
    request('/auth/register', { method: 'POST', body: { email, password, displayName } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me', { auth: true }),
  updateProfile: (data) => request('/auth/me', { method: 'PATCH', body: data, auth: true }),

  songs: (q = '') => request(`/songs${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  play: (songId) => request(`/songs/${songId}/play`, { method: 'POST', auth: true }),
  skip: (songId) => request(`/songs/${songId}/skip`, { method: 'POST', auth: true }),
  adapt: (songId) => request(`/songs/${songId}/adapt`, { method: 'POST', auth: true }),

  playlists: () => request('/playlists', { auth: true }),
  createPlaylist: (name) => request('/playlists', { method: 'POST', body: { name }, auth: true }),
  addToPlaylist: (playlistId, songId) =>
    request(`/playlists/${playlistId}/songs`, { method: 'POST', body: { songId }, auth: true }),
  removeFromPlaylist: (playlistId, songId) =>
    request(`/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE', auth: true }),
  deletePlaylist: (playlistId) => request(`/playlists/${playlistId}`, { method: 'DELETE', auth: true }),

  upgrade: () => request('/subscription/upgrade', { method: 'POST', auth: true }),
  downgrade: () => request('/subscription/downgrade', { method: 'POST', auth: true }),
  notifications: () => request('/subscription/notifications', { auth: true }),
};
