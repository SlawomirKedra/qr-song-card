import React, { useMemo, useRef, useState } from 'react';
import SongRow from './components/SongRow.jsx';
import Card from './components/Card.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const defaultSong = () => ({
  id: Math.random().toString(36).slice(2),
  title: '',
  artist: '',
  year: '',
  url: '',
  cover: '', // dataURL or remote URL
});

export default function App() {
  const [songs, setSongs] = useState([defaultSong()]);
  const [theme, setTheme] = useState('light'); // light | dark | neon
  const cardRefs = useRef({});

  const addSong = () => setSongs(s => [...s, defaultSong()]);
  const removeSong = (id) => setSongs(s => s.length > 1 ? s.filter(x => x.id !== id) : s);
  const updateSong = (id, patch) => setSongs(s => s.map(x => x.id === id ? { ...x, ...patch } : x));

  const exportPNG = async (id) => {
    const el = cardRefs.current[id];
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: null });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-card-${id}.png`;
    a.click();
  };

  const exportPDF = async () => {
    // Capture each card as image, place into A4 grid 3x2
    const images = [];
    for (const song of songs) {
      const el = cardRefs.current[song.id];
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      images.push(canvas.toDataURL('image/png'));
    }
    if (!images.length) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297;
    const cols = 2, rows = 3;
    const margin = 8;
    const cellW = (pageW - margin * (cols + 1)) / cols;
    const cellH = (pageH - margin * (rows + 1)) / rows;

    let i = 0;
    for (const img of images) {
      const col = i % cols;
      const row = Math.floor(i / cols) % rows;
      const pageIndex = Math.floor(i / (cols * rows));
      if (i !== 0 && col === 0 && row === 0) doc.addPage();

      // center image inside cell keeping aspect
      // assume card aspect ~ 86x120mm => r ~ 0.716
      const aspect = 86 / 120;
      let w = cellW, h = w / aspect;
      if (h > cellH) { h = cellH; w = h * aspect; }
      const x = margin + col * (cellW + margin) + (cellW - w) / 2;
      const y = margin + row * (cellH + margin) + (cellH - h) / 2;

      doc.addImage(img, 'PNG', x, y, w, h);
      i++;
    }

    doc.save('qr-song-cards.pdf');
  };

  const apiBase = useMemo(() => (window.__API_BASE__ || ''), []);

  const fetchOEmbed = async (url) => {
    if (!url) return null;
    try {
      const base = apiBase || '';
      const r = await fetch(`${base}/api/oembed?url=${encodeURIComponent(url)}`);
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-xl font-bold tracking-tight">QR Song Cards</div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
            >
              <option value="light">Motyw: Jasny</option>
              <option value="dark">Motyw: Ciemny</option>
              <option value="neon">Motyw: Neon</option>
            </select>
            <button onClick={exportPDF} className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white">
              Eksport PDF (A4)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-24">
        <section className="no-print my-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Lista utworów</h2>
            <button onClick={addSong} className="px-3 py-2 rounded bg-indigo-500 hover:bg-indigo-600">
              + Dodaj utwór
            </button>
          </div>
          <div className="space-y-3">
            {songs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                onChange={(patch) => updateSong(song.id, patch)}
                onRemove={() => removeSong(song.id)}
                onAuto={async (url) => {
                  const data = await fetchOEmbed(url);
                  if (data) {
                    updateSong(song.id, {
                      title: data.title || song.title,
                      artist: data.author || song.artist,
                      cover: data.thumbnail_url || song.cover,
                      url: data.url
                    });
                  }
                }}
              />
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          {songs.map(song => (
            <div key={song.id} className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-70">Podgląd karty</div>
                <button onClick={() => exportPNG(song.id)} className="no-print px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-600">
                  Zapisz PNG
                </button>
              </div>
              <div ref={el => (cardRefs.current[song.id] = el)} className="flex justify-center">
                <Card song={song} theme={theme} />
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
