import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

function classNames(...xs){return xs.filter(Boolean).join(' ')}

export default function Card({ song, theme='light' }) {
  const [qr, setQr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const text = song.url || `${song.title} - ${song.artist}`;
    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(text, {
          margin: 1,
          width: 700,
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
          panel: 'bg-slate-800/70',
          title: 'text-white',
          accent: 'bg-emerald-400',
        };
      case 'neon':
        return {
          bg: 'bg-black',
          panel: 'bg-fuchsia-500/20',
          title: 'text-fuchsia-300',
          accent: 'bg-fuchsia-400',
        };
      default:
        return {
          bg: 'bg-white',
          panel: 'bg-slate-100',
          title: 'text-slate-900',
          accent: 'bg-indigo-500',
        };
    }
  }, [theme]);

  return (
    <div
      className={classNames(
        'w-[86mm] h-[120mm] rounded-xl shadow-lg overflow-hidden border relative',
        theme === 'light' ? 'border-slate-200' : 'border-slate-700',
        themeCls.bg
      )}
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      {/* Cover */}
      <div className={classNames('h-[48mm] w-full object-cover flex items-center justify-center', themeCls.panel)}>
        {song.cover ? (
          <img src={song.cover} alt="Okładka" className="max-h-[48mm] w-full object-cover" />
        ) : (
          <div className="opacity-60 text-xs">Brak okładki</div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className={classNames('font-semibold leading-tight', themeCls.title)}>
              {song.title || <span className="opacity-50">Tytuł</span>}
            </div>
            <div className={classNames('text-sm opacity-80', themeCls.title)}>
              {song.artist || <span className="opacity-50">Wykonawca</span>}
              {song.year ? <span className="opacity-60"> • {song.year}</span> : null}
            </div>
          </div>
          <div className={classNames('px-2 py-1 rounded text-[10px] font-medium text-black', themeCls.accent)}>
            QR
          </div>
        </div>

        <div className="flex-1 mt-1 grid grid-cols-2 gap-2">
          <div className="col-span-1 rounded-lg border border-slate-300/30 bg-white p-1 flex items-center justify-center">
            {qr ? <img src={qr} className="w-full h-full object-contain" alt="QR" /> : <div className="text-xs opacity-60">QR...</div>}
          </div>
          <div className="col-span-1 text-[10px] opacity-80 leading-snug px-1">
            <div>🔗 {song.url ? shorten(song.url) : 'brak URL'}</div>
            <div className="mt-1 opacity-70">
              Zeskanuj QR w swojej aplikacji skanującej, aby odtworzyć utwór.
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 right-3 text-[8px] opacity-50">
        qrsong-cards
      </div>
    </div>
  );
}

function shorten(u){
  try {
    const url = new URL(u);
    const host = url.hostname.replace('www.', '');
    let path = url.pathname;
    if (path.length > 24) path = path.slice(0, 24) + '…';
    return host + path;
  } catch {
    return u?.slice(0, 28) + (u?.length > 28 ? '…' : '');
  }
}
