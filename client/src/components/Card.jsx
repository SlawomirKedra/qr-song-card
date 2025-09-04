import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

function classNames(...xs){return xs.filter(Boolean).join(' ')}

export default function Card({ song, theme='bw-classic', face='front' }) {
  const [qr, setQr] = useState(null);

  useEffect(() => {
    const text = song.url || `${song.title} - ${song.artist}`;
    let cancelled = false;
    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(text, {
          margin: 1,
          width: 1000,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        if (!cancelled) setQr(dataUrl);
      } catch (e) {
        console.error('QR error', e);
      }
    })();
    return () => { cancelled = true; };
  }, [song.url, song.title, song.artist]);

  const themeCls = useMemo(() => {
    switch(theme){
      case 'bw-minimal':
        return { bg:'bg-white', border:'border-black/60', title:'text-black', subtle:'text-black/70', box:'bg-white border border-black/40', badge:'bg-black text-white' };
      case 'bw-contrast':
        return { bg:'bg-white', border:'border-black', title:'text-black', subtle:'text-black', box:'bg-white border-2 border-black', badge:'bg-black text-white' };
      case 'dark':
        return { bg:'bg-slate-900', border:'border-slate-700', title:'text-white', subtle:'text-slate-300', box:'bg-white border border-slate-600', badge:'bg-white text-black' };
      case 'light':
        return { bg:'bg-white', border:'border-slate-300', title:'text-slate-900', subtle:'text-slate-700', box:'bg-white border border-slate-300', badge:'bg-black text-white' };
      default: // bw-classic
        return { bg:'bg-white', border:'border-black/40', title:'text-black', subtle:'text-black/60', box:'bg-white border border-black/30', badge:'bg-black text-white' };
    }
  }, [theme]);

  const cardStyle = { width: 'var(--card-w)', height: 'var(--card-h)', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' };

  if (face === 'front') {
    const qrBox = { width: 'calc(var(--card-w) * 0.8)', height: 'calc(var(--card-w) * 0.8)' };
    return (
      <div className={classNames('rounded-md shadow-sm overflow-hidden border relative flex items-center justify-center', themeCls.bg, themeCls.border)} style={cardStyle}>
        <div className={classNames('rounded p-0.5 flex items-center justify-center', themeCls.box)} style={qrBox}>
          {qr ? <img src={qr} alt="QR" style={{ width: '95%', height: '95%', objectFit: 'contain' }} /> : <div className="opacity-60 text-[8px]">QR…</div>}
        </div>
        <div className="absolute bottom-1 right-1 text-[7px] opacity-40">qr</div>
      </div>
    );
  }

  return (
    <div className={classNames('rounded-md shadow-sm overflow-hidden border relative px-2 py-2 text-center flex items-center justify-center', themeCls.bg, themeCls.border)} style={cardStyle}>
      <div className="w-full">
        <div className={classNames('font-semibold leading-tight', themeCls.title)} style={{ fontSize: '10pt' }}>
          {song.artist || <span className="opacity-50">Wykonawca</span>}
        </div>
        <div className={classNames('font-bold', themeCls.title)} style={{ fontSize: '22pt', lineHeight: '1.1', marginTop: '2mm', marginBottom: '2mm' }}>
          {song.year || '1991'}
        </div>
        <div className={classNames('', themeCls.subtle)} style={{ fontSize: '9pt' }}>
          {song.title || <span className="opacity-50">Tytuł utworu</span>}
        </div>
      </div>
      <div className="absolute bottom-1 right-1 text-[7px] opacity-40">info</div>
    </div>
  );
}
