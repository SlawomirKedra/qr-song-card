import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

const PAGE_W = 210;
const PAGE_H = 297;

const CardSVG = forwardRef(function CardSVG({ song, face='front', columns=5 }, ref) {
  const margin = 4;
  const cols = Number(columns);
  const availW = PAGE_W - margin * (cols + 1);
  const S = availW / cols;   // square side

  const [qrSVG, setQrSVG] = useState('');

  useEffect(() => {
    const text = song?.url || `${song?.title||''} - ${song?.artist||''}`;
    let cancelled = false;
    QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 0 })
      .then(svg => { if (!cancelled) setQrSVG(svg); })
      .catch(()=>{});
    return () => { cancelled = true; };
  }, [song?.url, song?.title, song?.artist]);

  // Typography (relative to side)
  const fontArtist = Math.max(3.1, S * 0.095);
  const fontYear   = Math.max(9.0, S * 0.28);
  const fontTitle  = Math.max(2.8, S * 0.085);

  const A = song?.artist || 'Artist';
  const Y = song?.year || '1991';
  const T = song?.title || 'Song Title';

  function wrap(text, maxChars){
    const words = String(text).split(' ');
    let line = ''; const lines = [];
    for (const w of words){
      if ((line + ' ' + w).trim().length <= maxChars) line = (line + ' ' + w).trim();
      else { if (line) lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    if (lines.length > 2) {
      const first = lines.slice(0, Math.ceil(lines.length/2)).join(' ');
      const second = lines.slice(Math.ceil(lines.length/2)).join(' ');
      return [first, second];
    }
    return lines;
  }
  const A_lines = wrap(A, S < 43 ? 16 : 20);
  const T_lines = wrap(T, S < 43 ? 18 : 24);

  const qrSide = S * 0.96;
  const qrX = (S - qrSide) / 2;
  const qrY = (S - qrSide) / 2;

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={`${S}mm`} height={`${S}mm`} viewBox={`0 0 ${S} ${S}`}>
      <rect x="0.4" y="0.4" width={S-0.8} height={S-0.8} fill="white" stroke="black" strokeWidth="0.45" opacity="0.98" />
      {face==='back' && (<g>
        <rect x="1.4" y="1.4" width={S-2.8} height={S-2.8} fill="none" stroke="black" strokeWidth="0.25" opacity="0.4" rx="2" ry="2"/>
        {A_lines.map((line, i) => (
          <text key={i} x={S/2} y={S*0.30 + i*fontArtist*1.1} fontFamily="Helvetica" fontWeight="700" fontSize={fontArtist} textAnchor="middle" fill="black">{line}</text>
        ))}
        <text x={S/2} y={S*0.52} fontFamily="Helvetica" fontWeight="800" fontSize={fontYear} textAnchor="middle" fill="black" letterSpacing="0.2">{Y}</text>
        {T_lines.map((line, i) => (
          <text key={i} x={S/2} y={S*0.70 + i*fontTitle*1.15} fontFamily="Helvetica" fontStyle="italic" fontWeight="500" fontSize={fontTitle} textAnchor="middle" fill="black">{line}</text>
        ))}
      </g>)}
      {face==='front' && (<g>
        <rect x={qrX} y={qrY} width={qrSide} height={qrSide} fill="white" stroke="black" strokeWidth="0.6" rx="1.2" ry="1.2"/>
        <g transform={`translate(${qrX+1}, ${qrY+1}) scale(${(qrSide-2)/100})`} dangerouslySetInnerHTML={{__html: qrSVG}}/>
      </g>)}
    </svg>
  );
});

export default CardSVG;
