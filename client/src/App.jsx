import React, { useMemo, useRef, useState } from 'react';
import PlaylistInput from './components/PlaylistInput.jsx';
import CardSVG from './components/CardSVG.jsx';
import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';

const PAGE_W = 210;
const PAGE_H = 297;

const sampleSong = {
  id: 'sample',
  title: 'Smells Like Teen Spirit',
  artist: 'Nirvana',
  year: '1991',
  url: 'https://open.spotify.com/track/5ghIJDpPoe3CfHMGu71E6T',
  cover: ''
};

function withIds(tracks){
  return tracks.map(t => ({ ...t, id: Math.random().toString(36).slice(2) }));
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [theme, setTheme] = useState('bw-contrast');
  const [intensity, setIntensity] = useState(50); // 0-100
  const [columns, setColumns] = useState(5); // 4 or 5

  const svgRefsFront = useRef({});
  const svgRefsBack = useRef({});
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

  const getCardSizeMM = () => {
    const margin = 4;
    const cols = Number(columns);
    const availW = PAGE_W - margin * (cols + 1);
    const w = availW / cols;       // mm per card
    const aspect = 37/52;
    const h = w / aspect;
    return { w, h, margin, cols };
  };

  const exportPDF = async (face) => {
    const items = songs.length ? songs : [sampleSong];
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { w, h, margin, cols } = getCardSizeMM();
    const rows = Math.max(1, Math.floor((PAGE_H - margin) / (h + margin)));

    let i = 0;
    for (const song of items) {
      const refMap = face === 'front' ? svgRefsFront.current : svgRefsBack.current;
      const svg = refMap[song.id];
      if (!svg) continue;

      const col = i % cols;
      const row = Math.floor(i / cols) % rows;
      if (i !== 0 && col === 0 && row === 0) doc.addPage();

      const x = margin + col * (w + margin);
      const y = margin + row * (h + margin);

      await svg2pdf(svg, doc, { x, y, width: w, height: h });
      i++;
    }

    doc.save(`qr-song-cards-${face}-${cols}col.pdf`);
  };

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="text-xl font-bold tracking-tight">QR Song Cards</div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="text-sm opacity-80">Motyw:</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
            >
              <option value="bw-classic">BW Classic</option>
              <option value="bw-minimal">BW Minimal</option>
              <option value="bw-contrast">BW Contrast</option>
              <option value="bw-dotgrid">BW DotGrid</option>
              <option value="bw-halftone">BW Halftone (Vinyl)</option>
              <option value="bw-waveform">BW Waveform</option>
              <option value="bw-ticket">BW Ticket (Perforation)</option>
              <option value="bw-hatch">BW Hatch (Diagonal)</option>
              <option value="bw-retro">BW Retro Corners</option>
            </select>

            <label className="text-sm opacity-80">Intensywność:</label>
            <input type="range" min="0" max="100" value={intensity} onChange={(e)=>setIntensity(Number(e.target.value))} />

            <label className="text-sm opacity-80">Kolumny:</label>
            <select value={columns} onChange={(e)=>setColumns(Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-3 py-2">
              <option value="5">5</option>
              <option value="4">4</option>
            </select>

            <button onClick={() => exportPDF('front')} className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white">PDF: Fronty</button>
            <button onClick={() => exportPDF('back')} className="px-3 py-2 rounded bg-sky-500 hover:bg-sky-600 text-white">PDF: Tyły</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-24">
        <section className="no-print my-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Podaj link do playlisty Spotify</h2>
          <PlaylistInput onLoad={loadPlaylist} />
          <div className="mt-6">
            <div className="text-sm opacity-70 mb-2">Podgląd przykładowej karty (front i tył) w wybranym motywie:</div>
            <div className="flex gap-4 justify-center flex-wrap">
              <CardSVG ref={(el)=>{ if (el) { svgRefsFront.current['sample']=el; }}} song={sampleSong} theme={theme} intensity={intensity} face="front" columns={columns} />
              <CardSVG ref={(el)=>{ if (el) { svgRefsBack.current['sample']=el; }}} song={sampleSong} theme={theme} intensity={intensity} face="back" columns={columns} />
            </div>
          </div>
        </section>

        {songs.length > 0 && (
          <section className="grid md:grid-cols-2 gap-6">
            {songs.map(song => (
              <div key={song.id} className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                <div className="text-sm opacity-70 mb-2">Podgląd (front i tył)</div>
                <div className="flex gap-4 justify-center flex-wrap">
                  <CardSVG ref={(el)=>{ if (el) { svgRefsFront.current[song.id]=el; }}} song={song} theme={theme} intensity={intensity} face="front" columns={columns} />
                  <CardSVG ref={(el)=>{ if (el) { svgRefsBack.current[song.id]=el; }}} song={song} theme={theme} intensity={intensity} face="back" columns={columns} />
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
