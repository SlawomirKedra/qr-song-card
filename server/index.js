import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// oEmbed proxy for YT/Spotify/SoundCloud (no auth)
app.get('/api/oembed', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Missing url param' });

    const lower = url.toLowerCase();
    let endpoint = null;

    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    } else if (lower.includes('open.spotify.com')) {
      endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    } else if (lower.includes('soundcloud.com')) {
      endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    } else {
      return res.status(400).json({ error: 'Unsupported provider for oEmbed' });
    }

    const r = await fetch(endpoint, { headers: { 'User-Agent': 'qr-song-cards/1.0' } });
    if (!r.ok) {
      return res.status(r.status).json({ error: `oEmbed fetch failed (${r.status})` });
    }
    const data = await r.json();
    // Normalize minimal response
    const payload = {
      title: data.title || null,
      author: data.author_name || null,
      provider: data.provider_name || null,
      thumbnail_url: data.thumbnail_url || null,
      url
    };
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
});

// --- Static build (client) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../client/dist');

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
