import React, { useMemo, useRef, useState } from 'react';
import PlaylistInput from './components/PlaylistInput.jsx';
import CardSVG from './components/CardSVG.jsx';
import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';

const PAGE_W = 210;
const PAGE_H = 297;

const sampleSong = {
  id: 'sample',
  title: 'Smooth Operator',
  artist: 'Sade',
  year: '1984',
  url: 'https://open.spotify.com/track/4Tyv7X6Y2P2fN0v9omwCWo'
};

function withIds(tracks){ return tracks.map(t => ({ ...t, id: Math.random().toString(36).slice(2) })); }

export default function App() {
  const [songs, setSongs] = useState([]);
  const [columns, setColumns] = useState(5);
  const [guides, setGuides] = useState(true);

  const svgRefsFront = useRef({});
  const svgRefsBack = useRef({});
  const apiBase = useMemo(() => (window.__API_BASE__ || ''), []);

  const loadPlaylist = async (playlistUrl) => {
    const r = await fetch(`${apiBase}/api/spotify/playlist?url=${encodeURIComponent(playlistUrl)}`);
    if (!r.ok) { alert('Nie udało się załadować playlisty'); return; }
    const data = await r.json();
    setSongs(withIds(data.tracks || []));
  };

  const getCardSizeMM = () => {
    const margin = 4;
    const cols = Number(columns);
    const availW = PAGE_W - margin * (cols + 1);
    const w = availW / cols; // square
    const h = w;
    const rows = Math.max(1, Math.floor((PAGE_H - margin) / (h + margin)));
    return { w, h, margin, cols, rows };
  };

  const drawGuides = (doc, margin, cols, rows, w, h) => {
    const outer = { x: margin/2, y: margin/2, w: PAGE_W - margin, h: PAGE_H - margin };
    doc.setDrawColor(150);
    doc.setLineWidth(0.1);
    doc.setLineDash([1, 1], 0);

    // Vertical guide lines (gutter centers + outer)
    const vXs = [outer.x];
    for (let c=1; c<cols; c++) vXs.push(margin/2 + c*(w+margin));
    vXs.push(PAGE_W - margin/2);
    for (const x of vXs) doc.line(x, outer.y, x, outer.y + outer.h);

    // Horizontal guide lines
    const hYs = [outer.y];
    for (let r=1; r<rows; r++) hYs.push(margin/2 + r*(h+margin));
    hYs.push(PAGE_H - margin/2);
    for (const y of hYs) doc.line(outer.x, y, outer.x + outer.w, y);

    // Crop marks (ticks)
    doc.setLineDash();
    const tick = 3;
    for (const x of vXs) {
      doc.line(x, outer.y - 0.01, x, outer.y - tick);
      doc.line(x, outer.y + outer.h + 0.01, x, outer.y + outer.h + tick);
    }
    for (const y of hYs) {
      doc.line(outer.x - 0.01, y, outer.x - tick, y);
      doc.line(outer.x + outer.w + 0.01, y, outer.x + outer.w + tick, y);
    }
  };

  const exportPDF = async (face) => {
    const items = songs.length ? songs : [sampleSong];
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { w, h, margin, cols, rows } = getCardSizeMM();

    let i = 0;
    const perPage = rows * cols;
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
      const endOfPage = (i % perPage === 0) || (i === items.length);
      if (guides && endOfPage) drawGuides(doc, margin, cols, rows, w, h);
    }

    doc.save(`qr-song-cards-${face}-${columns}col-square.pdf`);
  };

  return (
    <div style={{minHeight:'100vh'}}>
      <header style={{position:'sticky',top:0,zIndex:20,background:'rgba(15,23,42,.85)',backdropFilter:'blur(6px)',borderBottom:'1px solid #1e293b'}}>
        <div style={{maxWidth:960,margin:'0 auto',padding:'12px 16px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{fontWeight:800,fontSize:18}}>QR Song Cards</div>
          <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
            <label style={{opacity:.85,fontSize:14}}>Kolumny:</label>
            <select value={columns} onChange={(e)=>setColumns(Number(e.target.value))} style={{background:'#0b1220',border:'1px solid #334155',borderRadius:8,padding:'8px 10px',color:'#e2e8f0'}}>
              <option value="5">5</option>
              <option value="4">4</option>
            </select>
            <label style={{display:'flex',alignItems:'center',gap:6,opacity:.85,fontSize:14}}>
              <input type="checkbox" checked={guides} onChange={(e)=>setGuides(e.target.checked)} /> Linie cięcia
            </label>
            <button onClick={() => exportPDF('front')} style={{padding:'8px 10px',borderRadius:8,background:'#10b981',color:'#fff',border:'0'}}>PDF: Fronty</button>
            <button onClick={() => exportPDF('back')} style={{padding:'8px 10px',borderRadius:8,background:'#0ea5e9',color:'#fff',border:'0'}}>PDF: Tyły</button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:960,margin:'0 auto',padding:'0 16px 80px'}}>
        <section style={{margin:'24px 0',background:'rgba(30,41,59,.5)',border:'1px solid #334155',borderRadius:12,padding:16}}>
          <h2 style={{fontWeight:600,margin:'4px 0 12px'}}>Podaj link do playlisty Spotify</h2>
          <PlaylistInput onLoad={loadPlaylist} />
          <div style={{marginTop:16}}>
            <div style={{opacity:.7,fontSize:14,marginBottom:8}}>Podgląd przykładowej karty (front i tył):</div>
            <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
              <CardSVG ref={(el)=>{ if (el) { svgRefsFront.current['sample']=el; }}} song={sampleSong} face="front" columns={columns} />
              <CardSVG ref={(el)=>{ if (el) { svgRefsBack.current['sample']=el; }}} song={sampleSong} face="back" columns={columns} />
            </div>
          </div>
        </section>

        {songs.length > 0 && (
          <section style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:24}}>
            {songs.map(song => (
              <div key={song.id} style={{background:'rgba(30,41,59,.4)',border:'1px solid #334155',borderRadius:12,padding:12}}>
                <div style={{opacity:.7,fontSize:14,marginBottom:8}}>Podgląd (front i tył)</div>
                <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
                  <CardSVG ref={(el)=>{ if (el) { svgRefsFront.current[song.id]=el; }}} song={song} face="front" columns={columns} />
                  <CardSVG ref={(el)=>{ if (el) { svgRefsBack.current[song.id]=el; }}} song={song} face="back" columns={columns} />
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
