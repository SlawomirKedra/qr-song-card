import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

const PAGE_W = 210;
const PAGE_H = 297;

const themeDefs = (theme, intensity=50) => {
  const op = Math.max(0, Math.min(1, intensity/100));
  const strong = 0.2 + op*0.5;   // 0.2..0.7
  const light = 0.05 + op*0.25;  // 0.05..0.3
  const stroke = 0.3 + op*0.8;   // px

  switch(theme){
    case 'frame-art':        return { kind:'frame-art', stroke, opStrong: strong, opLight: light };
    case 'brackets':         return { kind:'brackets', stroke: stroke+0.6, opStrong: strong };
    case 'gradient-fade':    return { kind:'gradient', opLight: light, opStrong: strong };
    case 'eq-bars':          return { kind:'eq-bars', opStrong: strong };
    case 'cassette':         return { kind:'cassette', opStrong: strong, opLight: light };
    case 'bw-contrast':      return { kind:'none', border: 0.7 };
    case 'bw-minimal':       return { kind:'none', border: 0.3, subtle: true };
    case 'bw-classic':
    default:                 return { kind:'none', border: 0.45 };
  }
};

const CardSVG = forwardRef(function CardSVG({ song, theme='frame-art', intensity=60, face='front', columns=5 }, ref) {
  // Physical size based on column count (preview == PDF)
  const margin = 4; // mm outer margin used by PDF composer; we mirror for preview
  const cols = Number(columns);
  const availW = PAGE_W - margin * (cols + 1);
  const wmm = availW / cols;
  const aspect = 37/52;
  const hmm = wmm / aspect;

  const [qrSVG, setQrSVG] = useState('');

  useEffect(() => {
    const text = song?.url || `${song?.title||''} - ${song?.artist||''}`;
    let cancelled = false;
    QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 0 })
      .then(svg => { if (!cancelled) setQrSVG(svg); })
      .catch(()=>{});
    return () => { cancelled = true; };
  }, [song?.url, song?.title, song?.artist]);

  const defs = useMemo(() => themeDefs(theme, intensity), [theme, intensity]);

  // Helpers to render backgrounds
  const Bg = () => {
    const inset = 1.8;
    if (defs.kind === 'frame-art') {
      const r1=3, r2=2;
      return <g stroke='black' fill='none'>
        <rect x={inset} y={inset} width={wmm-2*inset} height={hmm-2*inset} rx={r1} ry={r1} strokeOpacity={defs.opStrong} strokeWidth='0.6'/>
        <rect x={inset+2} y={inset+2} width={wmm-2*(inset+2)} height={hmm-2*(inset+2)} rx={r2} ry={r2} strokeOpacity={defs.opLight} strokeWidth='0.45'/>
        {/* corner deco */}
        <g strokeOpacity={defs.opStrong} strokeWidth='0.6'>
          <path d={`M ${inset+4} ${inset+0.8} h 6`} />
          <path d={`M ${inset+0.8} ${inset+4} v 6`} />
          <path d={`M ${wmm-inset-10} ${inset+0.8} h 6`} />
          <path d={`M ${wmm-inset-0.8} ${inset+4} v 6`} />
          <path d={`M ${inset+0.8} ${hmm-inset-10} v -6`} />
          <path d={`M ${inset+4} ${hmm-inset-0.8} h 6`} />
          <path d={`M ${wmm-inset-0.8} ${hmm-inset-10} v -6`} />
          <path d={`M ${wmm-inset-10} ${hmm-inset-0.8} h 6`} />
        </g>
      </g>;
    }
    if (defs.kind === 'brackets') {
      const l=7; // bracket length
      return <g stroke='black' strokeWidth={1.2} strokeOpacity={defs.opStrong} fill='none'>
        {/* four corner L */}
        <path d={`M ${inset} ${inset+l} V ${inset} H ${inset+l}`} />
        <path d={`M ${wmm-inset-l} ${inset} H ${wmm-inset} V ${inset+l}`} />
        <path d={`M ${inset} ${hmm-inset-l} V ${hmm-inset} H ${inset+l}`} />
        <path d={`M ${wmm-inset-l} ${hmm-inset} H ${wmm-inset} V ${hmm-inset-l}`} />
      </g>;
    }
    if (defs.kind === 'gradient') {
      return <>
        <defs>
          <radialGradient id="fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="black" stopOpacity={defs.opLight}/>
            <stop offset="100%" stopColor="black" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={wmm} height={hmm} fill="url(#fade)" />
      </>;
    }
    if (defs.kind === 'eq-bars') {
      const bars=[];
      const step = 2.2;
      for(let x=1; x<wmm-1; x+=step){
        const h = (Math.sin(x*0.35)+1)/2 * (hmm*0.35) + hmm*0.15;
        bars.push(<rect key={x} x={x} y={hmm-h} width={step*0.6} height={h} fill="black" opacity={defs.opStrong}/>);
      }
      return <g>{bars}</g>;
    }
    if (defs.kind === 'cassette') {
      const bandH = hmm*0.18;
      return <g>
        <rect x="0" y={hmm*0.1} width={wmm} height={bandH} fill="black" opacity={defs.opLight}/>
        <rect x="0" y={hmm*0.72} width={wmm} height={bandH} fill="black" opacity={defs.opLight}/>
        {/* small reels icon */}
        <g opacity={defs.opStrong}>
          <circle cx={wmm*0.28} cy={hmm*0.2} r="1.6" fill="white" stroke="black" strokeWidth="0.4"/>
          <circle cx={wmm*0.72} cy={hmm*0.2} r="1.6" fill="white" stroke="black" strokeWidth="0.4"/>
          <circle cx={wmm*0.28} cy={hmm*0.2} r="0.5" fill="black"/><circle cx={wmm*0.72} cy={hmm*0.2} r="0.5" fill="black"/>
        </g>
      </g>;
    }
    return null;
  };

  const fontArtist = 3.6; // mm ~ 10pt
  const fontYear = 8.2;   // mm ~ 22pt
  const fontTitle = 3.2;  // mm ~ 9pt

  const A = song?.artist || 'Wykonawca';
  const Y = song?.year || '1991';
  const T = song?.title || 'Tytuł utworu';

  // QR box: 90% of the smaller card side => duży QR
  const qrSide = Math.min(wmm, hmm) * 0.9;
  const qrX = (wmm - qrSide) / 2;
  const qrY = (hmm - qrSide) / 2;

  return (
    <svg ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={`${wmm}mm`} height={`${hmm}mm`}
      viewBox={`0 0 ${wmm} ${hmm}`}
    >
      {/* border */}
      <rect x="0.4" y="0.4" width={wmm-0.8} height={hmm-0.8} fill="white" stroke="black" strokeWidth={defs.border || 0.5} opacity="0.98" />

      {face==='back' && (<g>
        <Bg/>
        {/* central stack */}
        <text x={wmm/2} y={hmm*0.36} fontFamily="Helvetica" fontWeight="700" fontSize={fontArtist} textAnchor="middle" fill="black">{A}</text>
        <text x={wmm/2} y={hmm*0.52} fontFamily="Helvetica" fontWeight="800" fontSize={fontYear} textAnchor="middle" fill="black" letterSpacing="0.2">{Y}</text>
        <text x={wmm/2} y={hmm*0.66} fontFamily="Helvetica" fontWeight="500" fontSize={fontTitle} textAnchor="middle" fill="black">{T}</text>
      </g>)}

      {face==='front' && (<g>
        <rect x={qrX} y={qrY} width={qrSide} height={qrSide} fill="white" stroke="black" strokeWidth="0.6" rx="1.2" ry="1.2"/>
        <g transform={`translate(${qrX+1}, ${qrY+1}) scale(${(qrSide-2)/100})`} dangerouslySetInnerHTML={{__html: qrSVG}}/>
      </g>)}
    </svg>
  );
});

export default CardSVG;
