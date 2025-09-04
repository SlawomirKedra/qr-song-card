import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

function classNames(...xs){return xs.filter(Boolean).join(' ')}

export default function Card({ song, theme='light', face='front' }) {
  const [qr, setQr] = useState(null);

  useEffect(() => {
    const text = song.url || `${song.title} - ${song.artist}`;
    let cancelled = false;
    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(text, {
          margin: 1,
          width: 1000,
          errorCorrectionLevel: 'M'
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
      case 'dark':
        return {
          bg: 'bg-slate-900',
          panel: 'bg-slate-800',
          title: 'text-white',
          subtle: 'text-slate-300',
          border: 'border-slate-700',
          accent: 'bg-emerald-400',
        };
      case 'neon':
        return {
          bg: 'bg-black',
          panel: 'bg-fuchsia-500/10',
          title: 'text-fuchsia-300',
          subtle: 'text-fuchsia-100/70',
          border: 'border-fuchsia-700/60',
          accent: 'bg-fuchsia-400',
        };
      default:
        return {
          bg: 'bg-white',
          panel: 'bg-slate-50',
          title: 'text-slate-900',
          subtle: 'text-slate-600',
          border: 'border-slate-200',
          accent: 'bg-indigo-500',
        };
    }
  }, [theme]);

  if (face === 'front') {
    return (
      <div
        className={classNames(
          'w-[86mm] h-[120mm] rounded-xl shadow-lg overflow-hidden border relative flex items-center justify-center',
          themeCls.bg, themeCls.border
        )}
        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >
        <div className={classNames('w-[70mm] h-[70mm] rounded-lg bg-white flex items-center justify-center border', theme === 'light' ? 'border-slate-300' : 'border-slate-600')}>
          {qr ? <img src={qr} alt="QR" className="w-[66mm] h-[66mm] object-contain" /> : <div className="opacity-60 text-xs">QR...</div>}
        </div>
        <div className="absolute bottom-2 right-3 text-[8px] opacity-40">qr</div>
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'w-[86mm] h-[120mm] rounded-xl shadow-lg overflow-hidden border relative p-4',
        themeCls.bg, themeCls.border
      )}
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col">
          <div className={classNames('text-xs uppercase tracking-wide mb-1', themeCls.subtle)}>Utwór</div>
          <div className={classNames('text-lg font-semibold leading-tight', themeCls.title)}>
            {song.title || <span className="opacity-50">Tytuł</span>}
          </div>
          <div className={classNames('text-sm mt-1', themeCls.subtle)}>
            {song.artist || <span className="opacity-50">Wykonawca</span>}
            {song.year ? <span> • {song.year}</span> : null}
          </div>
        </div>

        <div className="mt-3">
          {song.cover ? (
            <img src={song.cover} alt="Okładka" className="w-full h-[48mm] object-cover rounded-lg border border-black/10" />
          ) : (
            <div className={classNames('w-full h-[48mm] rounded-lg flex items-center justify-center text-xs', themeCls.panel)}>
              Brak okładki
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-2 right-3 text-[8px] opacity-40">info</div>
    </div>
  );
}
