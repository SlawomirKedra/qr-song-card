import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

function classNames(...xs){return xs.filter(Boolean).join(' ')}

// Helpers: inline SVG patterns as data URIs (vector-friendly for print)
const svgDataUri = (svg) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

const patterns = {
  'bw-dotgrid': svgDataUri(`
    <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'>
      <circle cx='1.5' cy='1.5' r='0.6' fill='black' fill-opacity='0.08'/>
    </svg>
  `),
  'bw-vinyl': svgDataUri(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
      <defs>
        <radialGradient id='g' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='black' stop-opacity='0.0'/>
          <stop offset='60%' stop-color='black' stop-opacity='0.05'/>
          <stop offset='100%' stop-color='black' stop-opacity='0.08'/>
        </radialGradient>
      </defs>
      <circle cx='100' cy='100' r='90' fill='url(#g)'/>
      <circle cx='100' cy='100' r='6' fill='black' fill-opacity='0.12'/>
      <g stroke='black' stroke-opacity='0.08' fill='none'>
        <circle cx='100' cy='100' r='20'/>
        <circle cx='100' cy='100' r='35'/>
        <circle cx='100' cy='100' r='50'/>
        <circle cx='100' cy='100' r='65'/>
        <circle cx='100' cy='100' r='80'/>
      </g>
    </svg>
  `),
  'bw-waveform': svgDataUri(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 120' preserveAspectRatio='none'>
      <path d='M0,60 C30,20 70,100 100,60 C130,20 170,100 200,60 C230,20 270,100 300,60 C330,20 370,100 400,60'
            stroke='black' stroke-opacity='0.18' stroke-width='3' fill='none'/>
      <path d='M0,70 C30,30 70,110 100,70 C130,30 170,110 200,70 C230,30 270,110 300,70 C330,30 370,110 400,70'
            stroke='black' stroke-opacity='0.10' stroke-width='2' fill='none'/>
    </svg>
  `)
};

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
        return { bg:'bg-white', border:'border-black/60', title:'text-black', subtle:'text-black/70', box:'bg-white border border-black/40', badge:'bg-black text-white', pattern:null, ticket:false };
      case 'bw-contrast':
        return { bg:'bg-white', border:'border-black', title:'text-black', subtle:'text-black', box:'bg-white border-2 border-black', badge:'bg-black text-white', pattern:null, ticket:false };
      case 'bw-dotgrid':
        return { bg:'bg-white', border:'border-black/50', title:'text-black', subtle:'text-black/70', box:'bg-white border border-black/40', badge:'bg-black text-white', pattern: patterns['bw-dotgrid'], ticket:false };
      case 'bw-halftone':
        return { bg:'bg-white', border:'border-black/40', title:'text-black', subtle:'text-black/70', box:'bg-white border border-black/30', badge:'bg-black text-white', pattern: patterns['bw-vinyl'], ticket:false };
      case 'bw-waveform':
        return { bg:'bg-white', border:'border-black/40', title:'text-black', subtle:'text-black/70', box:'bg-white border border-black/30', badge:'bg-black text-white', pattern: patterns['bw-waveform'], ticket:false, patternSize:'92% 40%', patternPos:'center' };
      case 'bw-ticket':
        return { bg:'bg-white', border:'border-black/50', title:'text-black', subtle:'text-black/70', box:'bg-white border border-black/40', badge:'bg-black text-white', pattern:null, ticket:true };
      case 'dark':
        return { bg:'bg-slate-900', border:'border-slate-700', title:'text-white', subtle:'text-slate-300', box:'bg-white border border-slate-600', badge:'bg-white text-black', pattern:null, ticket:false };
      case 'light':
        return { bg:'bg-white', border:'border-slate-300', title:'text-slate-900', subtle:'text-slate-700', box:'bg-white border border-slate-300', badge:'bg-black text-white', pattern:null, ticket:false };
      default: // bw-classic
        return { bg:'bg-white', border:'border-black/40', title:'text-black', subtle:'text-black/60', box:'bg-white border border-black/30', badge:'bg-black text-white', pattern:null, ticket:false };
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

  // BACK
  const bgStyle = themeCls.pattern ? {
    backgroundImage: themeCls.pattern,
    backgroundRepeat: (theme === 'bw-dotgrid') ? 'repeat' : 'no-repeat',
    backgroundSize: themeCls.patternSize || ((theme === 'bw-dotgrid') ? '12px 12px' : '140% 140%'),
    backgroundPosition: themeCls.patternPos || 'center',
  } : {};

  return (
    <div className={classNames('rounded-md shadow-sm overflow-hidden border relative px-2 py-2 text-center flex items-center justify-center', themeCls.bg, themeCls.border)} style={{...cardStyle, ...bgStyle}}>
      {/* inner frame */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={classNames('absolute inset-[1.2mm] rounded-[2mm] border', themeCls.border)} />
        {/* ticket perforation (left/right dotted lines) */}
        {themeCls.ticket && (
          <>
            <div className="absolute inset-y-[2mm] left-[1.6mm] w-[0.4mm]" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.38) 0 0.6mm, transparent 0.6mm 1.2mm)' }} />
            <div className="absolute inset-y-[2mm] right-[1.6mm] w-[0.4mm]" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.38) 0 0.6mm, transparent 0.6mm 1.2mm)' }} />
          </>
        )}
      </div>

      <div className="w-full relative">
        <div className={classNames('font-semibold leading-tight tracking-wide', themeCls.title)} style={{ fontSize: '10pt' }}>
          {song.artist || <span className="opacity-50">Wykonawca</span>}
        </div>
        <div className={classNames('font-extrabold', themeCls.title)} style={{ fontSize: '22pt', lineHeight: '1.1', marginTop: '2mm', marginBottom: '2mm', letterSpacing: '0.4pt' }}>
          {song.year || '1991'}
        </div>
        <div className={classNames('px-1', themeCls.subtle)} style={{ fontSize: '9pt' }}>
          {song.title || <span className="opacity-50">Tytuł utworu</span>}
        </div>
        <div className="mx-auto mt-2" style={{ width: '35%', height: '1px', backgroundColor: 'rgba(0,0,0,0.2)' }} />
      </div>

      <div className="absolute bottom-1 right-1 text-[7px] opacity-40">info</div>
    </div>
  );
}
