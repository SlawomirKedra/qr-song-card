import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());

// ---- Health ----
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ---- Spotify: client credentials + playlist tracks ----
const tokenCache = { access_token: null, expires_at: 0 };

async function getSpotifyToken() {
  const now = Date.now();
  if (tokenCache.access_token && tokenCache.expires_at - 10000 > now) {
    return tokenCache.access_token;
  }
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set');
  }
  const creds = Buffer.from(id + ':' + secret).toString('base64');
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error('Spotify token error: ' + txt);
  }
  const data = await r.json();
  tokenCache.access_token = data.access_token;
  tokenCache.expires_at = Date.now() + (data.expires_in * 1000);
  return tokenCache.access_token;
}

function extractPlaylistId(input) {
  if (!input) return null;
  const m = String(input).match(/playlist\/([a-zA-Z0-9]+)(?:[?&]|$)/);
  if (m) return m[1];
  const m2 = String(input).match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (m2) return m2[1];
  return null;
}

async function fetchPlaylistTracks(id) {
  const token = await getSpotifyToken();
  let url = `https://api.spotify.com/v1/playlists/${id}/tracks?offset=0&limit=100`;
  const tracks = [];
  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
    if (!r.ok) {
      const t = await r.text();
      throw new Error('Spotify playlist fetch error: ' + t);
    }
    const data = await r.json();
    for (const item of data.items || []) {
      const t = item.track;
      if (!t) continue;
      const year = (t.album && t.album.release_date) ? String(t.album.release_date).slice(0,4) : '';
      tracks.push({
        title: t.name || '',
        artist: (t.artists || []).map(a => a.name).join(', '),
        year,
        url: (t.external_urls && t.external_urls.spotify) || '',
        cover: (t.album && t.album.images && t.album.images[0] && t.album.images[0].url) || ''
      });
    }
    url = data.next;
  }
  return tracks;
}

app.get('/api/spotify/playlist', async (req, res) => {
  try {
    const { url, id } = req.query;
    const pid = id || extractPlaylistId(url);
    if (!pid) return res.status(400).json({ error: 'Provide ?url=<spotify playlist url> or ?id=<playlistId>' });
    const tracks = await fetchPlaylistTracks(pid);
    res.json({ playlistId: pid, count: tracks.length, tracks });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
});

// ---- Static client build ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../client/dist');

const fontsDir = path.resolve(__dirname, '../client/public/fonts');
app.use('/fonts', express.static(fontsDir, { maxAge: '365d', immutable: true }));

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
