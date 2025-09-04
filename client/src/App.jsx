import React, { useMemo, useRef, useState } from 'react';
import PlaylistInput from './components/PlaylistInput.jsx';
import Card from './components/Card.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CARD_W_MM = 37;
const CARD_H_MM = 52;
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
  const [theme, setTheme] = useState('bw-classic'); // default B/W
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
    const items = songs.length ? songs : [sampleSong]; // jeżeli ktoś nie wczytał, pozwól 1 podgląd
    for (const song of items) {
      const el = refs[song.id];
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      images.push(canvas.toDataURL('image/png'));
    }
    if (!images.length) return;

    const margin = 4;           // mm
    const cols = 5;
    const aspect = CARD_W_MM / CARD_H_MM;
    const rows = Math.max(1, Math.floor((PAGE_H - margin) / (CARD_H_MM + margin))); // zwykle 5

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const cellW = (PAGE_W - margin * (cols + 1)) / cols;
    const cellH = (PAGE_H - margin * (rows + 1)) / rows;

    const imgW = Math.min(cellW, cellH * aspect);
    const imgH = imgW / aspect;

    let i = 0;
    for (const img of images) {
      const col = i % cols;
      const row = Math.floor(i / cols) % rows;
      if (i !== 0 && col === 0 && row === 0) doc.addPage();

      const x = margin + col * (cellW + margin) + (cellW - imgW) / 2;
      const y = margin + row * (cellH + margin) + (cellH - imgH) / 2;

      doc.addImage(img, 'PNG', x, y, imgW, imgH);
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
              <option value="bw-classic">Motyw: BW Classic</option>
              <option value="bw-minimal">Motyw: BW Minimal</option>
              <option value="bw-contrast">Motyw: BW Contrast</option>
              <option value="light">Motyw: Jasny</option>
              <option value="dark">Motyw: Ciemny</option>
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
          <div className="mt-6">
            <div className="text-sm opacity-70 mb-2">Podgląd przykładowej karty (front i tył):</div>
            <div className="flex gap-4 justify-center flex-wrap">
              <div ref={el => (cardFrontRefs.current[sampleSong.id] = el)}>
                <Card song={sampleSong} theme={theme} face="front" />
              </div>
              <div ref={el => (cardBackRefs.current[sampleSong.id] = el)}>
                <Card song={sampleSong} theme={theme} face="back" />
              </div>
            </div>
          </div>
        </section>

        {songs.length > 0 && (
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
        )}
      </main>
    </div>
  );
}
