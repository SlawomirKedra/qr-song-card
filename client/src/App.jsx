import React, { useMemo, useRef, useState } from 'react';
import PlaylistInput from './components/PlaylistInput.jsx';
import Card from './components/Card.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function withIds(tracks){
  return tracks.map(t => ({ ...t, id: Math.random().toString(36).slice(2) }));
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [theme, setTheme] = useState('light'); // light | dark | neon
  const cardFrontRefs = useRef({});
  const cardBackRefs = useRef({});

  const apiBase = useMemo(() => (window.__API_BASE__ || ''), []);

  const loadPlaylist = async (playlistUrl) => {
    const r = await fetch(`${apiBase}/api/spotify/playlist?url=${encodeURIComponent(playlistUrl)}`);
    if (!r.ok) {
      const e = await r.json().catch(()=>({error:'Błąd'}));
      alert('Nie udało się załadować playlisty: ' + (e.error || r.status));
      return;
    }
    const data = await r.json();
    setSongs(withIds(data.tracks || []));
  };

  const exportPDF = async (face) => {
    const refs = face === 'front' ? cardFrontRefs.current : cardBackRefs.current;
    const images = [];
    for (const song of songs) {
      const el = refs[song.id];
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
      if (i !== 0 && col === 0 && row === 0) doc.addPage();

      const aspect = 86 / 120;
      let w = cellW, h = w / aspect;
      if (h > cellH) { h = cellH; w = h * aspect; }
      const x = margin + col * (cellW + margin) + (cellW - w) / 2;
      const y = margin + row * (cellH + margin) + (cellH - h) / 2;

      doc.addImage(img, 'PNG', x, y, w, h);
      i++;
    }

    doc.save(`qr-song-cards-${face}.pdf`);
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
            <button onClick={() => exportPDF('front')} className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white">
              PDF: Fronty (QR)
            </button>
            <button onClick={() => exportPDF('back')} className="px-3 py-2 rounded bg-sky-500 hover:bg-sky-600 text-white">
              PDF: Tyły (opis)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-24">
        <section className="no-print my-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Podaj link do playlisty Spotify</h2>
          <PlaylistInput onLoad={loadPlaylist} />
        </section>

        {songs.length > 0 ? (
          <section className="grid md:grid-cols-2 gap-6">
            {songs.map(song => (
              <div key={song.id} className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                <div className="text-sm opacity-70 mb-2">Podgląd (front i tył)</div>
                <div className="flex gap-4 justify-center flex-wrap">
                  <div ref={el => (cardFrontRefs.current[song.id] = el)}>
                    <Card song={song} theme={theme} face="front" />
                  </div>
                  <div ref={el => (cardBackRefs.current[song.id] = el)}>
                    <Card song={song} theme={theme} face="back" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="text-center opacity-60 mt-16">
            Wczytaj playlistę Spotify, aby wygenerować karty.
          </section>
        )}
      </main>
    </div>
  );
}
