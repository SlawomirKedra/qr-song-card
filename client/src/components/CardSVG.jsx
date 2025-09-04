import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';

const PAGE_W = 210;
const PAGE_H = 297;

function useMeasureCanvas() {
  const ref = useRef(null);
  if (!ref.current) ref.current = document.createElement('canvas');
  const ctx = ref.current.getContext('2d');
  return ctx;
}

function fitLines(ctx, text, basePx, maxWidthPx, maxLines=2, fontWeight='700', fontStyle='normal') {
  let size = basePx;
  const tryWrap = (sz) => {
    ctx.font = `${fontStyle} ${fontWeight} ${sz}px Helvetica, Arial, sans-serif`;
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = (cur ? cur + ' ' : '') + w;
      const width = ctx.measureText(next).width;
      if (width <= maxWidthPx) {
        cur = next;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const take = Math.ceil(lines.length/2);
      const l1 = lines.slice(0, take).join(' ');
      const l2 = lines.slice(take).join(' ');
      return { lines: [l1, l2].slice(0, maxLines), size: sz };
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

const CardSVG = forwardRef(function CardSVG({ song, face='front', columns=5 }, ref) {
  const margin = 4;
  const cols = Number(columns);
  const availW = PAGE_W - margin * (cols + 1);
  const S = availW / cols;   // square side in mm

  const [qrInner, setQrInner] = useState('');
  const ctx = useMeasureCanvas();

  useEffect(() => {
    const text = song?.url || `${song?.title||''} - ${song?.artist||''}`;
    let cancelled = false;
    QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 0 })
      .then(svg => {
        if (cancelled) return;
        const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '');
        setQrInner(inner);
      })
      .catch(()=>{});
    return () => { cancelled = true; };
  }, [song?.url, song?.title, song?.artist]);

  const pxPerMm = 3.78;
  const baseArtistPx = Math.max(12, S * 0.10 * pxPerMm);
  const baseYearPx   = Math.max(30, S * 0.30 * pxPerMm);
  const baseTitlePx  = Math.max(11, S * 0.09 * pxPerMm);

  const A = song?.artist || 'Artist';
  const Y = song?.year || '1991';
  const T = song?.title || 'Song Title';

  const contentPad = S * 0.10;
  const maxTextWidthPx = (S - contentPad*2) * pxPerMm;

  const artistFit = fitLines(ctx, A, baseArtistPx, maxTextWidthPx, 2, '700', 'normal');
  const titleFit  = fitLines(ctx, T, baseTitlePx, maxTextWidthPx, 2, '500', 'italic');

  const qrSide = S * 0.99;
  const qrX = (S - qrSide) / 2;
  const qrY = (S - qrSide) / 2;

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={`${S}mm`} height={`${S}mm`} viewBox={`0 0 ${S} ${S}`}>
      <rect x="0.4" y="0.4" width={S-0.8} height={S-0.8} fill="white" stroke="black" strokeWidth="0.45" opacity="0.98" />
      {face==='back' && (<g>
        <rect x="1.4" y="1.4" width={S-2.8} height={S-2.8} fill="none" stroke="black" strokeWidth="0.25" opacity="0.35" rx="2" ry="2"/>
        {artistFit.lines.map((line, i) => (
          <text key={'a'+i}
            x={S/2} y={S*0.30 + i * (artistFit.size/pxPerMm * 1.10)}
            fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize={artistFit.size/pxPerMm}
            textAnchor="middle" fill="black">{line}</text>
        ))}
        <text
          x={S/2} y={S*0.52}
          fontFamily="Helvetica, Arial, sans-serif" fontWeight="800"
          fontSize={Math.min(baseYearPx, (S*0.55*pxPerMm)) / pxPerMm}
          textAnchor="middle" fill="black" letterSpacing="0.2">{Y}</text>
        {titleFit.lines.map((line, i) => (
          <text key={'t'+i}
            x={S/2} y={S*0.70 + i * (titleFit.size/pxPerMm * 1.15)}
            fontFamily="Helvetica, Arial, sans-serif" fontStyle="italic" fontWeight="500" fontSize={titleFit.size/pxPerMm}
            textAnchor="middle" fill="black">{line}</text>
        ))}
      </g>)}
      {face==='front' && (<g>
        <rect x={qrX} y={qrY} width={qrSide} height={qrSide} fill="white" stroke="black" strokeWidth="0.45" rx="1" ry="1"/>
        <g transform={`translate(${qrX}, ${qrY}) scale(${qrSide/100})`} dangerouslySetInnerHTML={{__html: qrInner}}/>
      </g>)}
    </svg>
  );
});

export default CardSVG;
