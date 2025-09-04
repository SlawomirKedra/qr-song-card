import React, { forwardRef, useMemo, useRef } from 'react';
import QRCode from 'qrcode';

const PAGE_W = 210;
const PAGE_H = 297;

function makeQRRects(text, sideMm, quietModules=2, ecl='M'){
  const model = QRCode.create(text, { errorCorrectionLevel: ecl });
  const size = model.modules.size;
  const data = model.modules.data;
  const usable = size + quietModules*2;
  const moduleMm = sideMm / usable;
  const rects = [];
  for (let y=0; y<size; y++){
    for (let x=0; x<size; x++){
      if (data[y*size + x]) {
        const rx = (x + quietModules) * moduleMm;
        const ry = (y + quietModules) * moduleMm;
        rects.push({ x: rx, y: ry, w: moduleMm, h: moduleMm });
      }
    }
  }
  return { rects, sideWithQuiet: moduleMm * usable };
}

function useMeasureCanvas() {
  const ref = useRef(null);
  if (!ref.current) ref.current = document.createElement('canvas');
  return ref.current.getContext('2d');
}
function fitLines(ctx, text, basePx, maxWidthPx, maxLines=2, fontWeight='700', fontStyle='normal') {
  let size = basePx;
  const tryWrap = (sz) => {
    ctx.font = `${fontStyle} ${fontWeight} ${sz}px Roboto, Arial, sans-serif`;
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = (cur ? cur + ' ' : '') + w;
      const width = ctx.measureText(next).width;
      if (width <= maxWidthPx) cur = next;
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const take = Math.ceil(lines.length/2);
      return { lines: [lines.slice(0,take).join(' '), lines.slice(take).join(' ')], size: sz };
    }
    return { lines, size: sz };
  };
  let wrapped = tryWrap(size);
  while (wrapped.lines.some(l => ctx.measureText(l).width > maxWidthPx) && size > 6) {
    size -= 0.5;
    wrapped = tryWrap(size);
  }
  return wrapped;
}

const CardSVG = forwardRef(function CardSVG({ song, face='front', columns=4 }, ref) {
  const margin = 4;
  const cols = 4;
  const availW = PAGE_W - margin * (cols + 1);
  const S = availW / cols;

  const text = song?.url || `${song?.title||''} - ${song?.artist||''}`;
  const qr = useMemo(() => makeQRRects(text, S*0.90, 3, 'M'), [text, S]);

  const ctx = useMeasureCanvas();
  const A = song?.artist || 'Artist';
  const Y = song?.year || '1991';
  const T = song?.title || 'Song Title';

  const pxPerMm = 3.78;
  const baseArtistPx = Math.max(12, S * 0.095 * pxPerMm);
  const baseYearPx   = Math.max(30, S * 0.30 * pxPerMm);
  const baseTitlePx  = Math.max(11, S * 0.09  * pxPerMm);

  const pad = S * 0.10;
  const maxTextWidthPx = (S - pad*2) * pxPerMm;

  const artistFit = fitLines(ctx, A, baseArtistPx, maxTextWidthPx, 2, '700', 'normal');
  const titleFit  = fitLines(ctx, T, baseTitlePx, maxTextWidthPx, 2, '500', 'italic');

  const artistBaseY = S * 0.28;
  const yearBaseY   = S * 0.52;
  const titleBaseY  = S * 0.75;

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={`${S}mm`} height={`${S}mm`} viewBox={`0 0 ${S} ${S}`}>
      <rect x="0.4" y="0.4" width={S-0.8} height={S-0.8} fill="white" stroke="black" strokeWidth="0.45" opacity="0.98" />
      {face==='back' && (<g>
        <rect x="1.4" y="1.4" width={S-2.8} height={S-2.8} fill="none" stroke="black" strokeWidth="0.25" opacity="0.35" rx="2" ry="2"/>
        {artistFit.lines.map((line, i) => (
          <text key={'a'+i} x={S/2} y={artistBaseY + i * (artistFit.size/pxPerMm * 1.15)}
            fontFamily="Roboto" fontWeight="700" fontSize={artistFit.size/pxPerMm} textAnchor="middle" fill="black">{line}</text>
        ))}
        <text x={S/2} y={yearBaseY} fontFamily="Roboto" fontWeight="700"
          fontSize={Math.min(baseYearPx, (S*0.56*pxPerMm)) / pxPerMm} textAnchor="middle" fill="black" letterSpacing="0.2">{Y}</text>
        {titleFit.lines.map((line, i) => (
          <text key={'t'+i} x={S/2} y={titleBaseY + i * (titleFit.size/pxPerMm * 1.2)}
            fontFamily="Roboto" fontStyle="italic" fontWeight="500" fontSize={titleFit.size/pxPerMm} textAnchor="middle" fill="black">{line}</text>
        ))}
      </g>)}
      {face==='front' && (<g>
        <g transform={`translate(${(S - qr.sideWithQuiet)/2}, ${(S - qr.sideWithQuiet)/2})`}>
          {qr.rects.map((r, i) => (<rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="black" />))}
        </g>
        <rect x="0.5" y="0.5" width={S-1} height={S-1} rx="2" ry="2" fill="none" stroke="black" strokeWidth="0.6"/>
      </g>)}
    </svg>
  );
});

export default CardSVG;
