import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';

const mm = (v) => v; // values in mm, used only for clarity

const themeDefs = (theme, intensity=50) => {
  // intensity 0..100 -> opacity/width multipliers
  const op = Math.max(0, Math.min(1, intensity/100));
  const strong = 0.15 + op*0.35;  // 0.15..0.5
  const light = 0.05 + op*0.20;   // 0.05..0.25
  const stroke = 0.2 + op*0.6;    // 0.2..0.8 px

  switch(theme){
    case 'bw-dotgrid':
      return { pattern: 'dotgrid', dotOpacity: strong };
    case 'bw-halftone':
      return { pattern: 'halftone', ringOpacity: light, coreOpacity: strong };
    case 'bw-waveform':
      return { pattern: 'wave', strokeOpacity: strong, strokeWidth: stroke };
    case 'bw-ticket':
      return { pattern: 'ticket', dotOpacity: 0.35 };
    case 'bw-hatch':
      return { pattern: 'hatch', strokeOpacity: strong, strokeWidth: stroke };
    case 'bw-retro':
      return { pattern: 'retro', strokeOpacity: strong };
    case 'bw-contrast':
      return { pattern: null, borderStrong: true };
    case 'bw-minimal':
      return { pattern: null, subtle: true };
    case 'bw-classic':
    default:
      return { pattern: null };
  }
};

const CardSVG = forwardRef(function CardSVG({ song, theme='bw-contrast', intensity=50, face='front', columns=5 }, ref) {
  // Compute physical size based on selected columns for perfect PDF+preview match
  const margin = 4; // mm outer margin for PDF (reference only)
  const pageW = 210, pageH = 297;
  const cols = Number(columns);
  const availW = pageW - margin * (cols + 1);
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

  // build background pattern groups
  const Bg = () => {
    if (defs.pattern === 'dotgrid') {
      const dots = [];
      const step = 2.5; // mm
      for (let y=step/2; y<hmm; y+=step) {
        for (let x=step/2; x<wmm; x+=step) {
          dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="0.35" fill="black" opacity={defs.dotOpacity}/>);
        }
      }
      return <g>{dots}</g>;
    }
    if (defs.pattern === 'halftone') {
      const cx=wmm/2, cy=hmm/2, R=Math.min(wmm,hmm)*0.48;
      const rings=[];
      for(let r=R*0.2;r<=R;r+=R*0.15){
        rings.push(<circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="black" strokeOpacity={defs.ringOpacity} strokeWidth="0.2"/>);
      }
      return <g>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="black" strokeOpacity={defs.ringOpacity} strokeWidth="0.3"/>
        <circle cx={cx} cy={cy} r={R*0.05} fill="black" opacity={defs.coreOpacity}/>
        {rings}
      </g>;
    }
    if (defs.pattern === 'wave') {
      const path = `M0 ${hmm*0.55}
        C ${wmm*0.08} ${hmm*0.2}, ${wmm*0.18} ${hmm*0.9}, ${wmm*0.28} ${hmm*0.55}
        S ${wmm*0.48} ${hmm*0.2}, ${wmm*0.58} ${hmm*0.55}
        S ${wmm*0.78} ${hmm*0.9}, ${wmm*0.88} ${hmm*0.55}`;
      return <g fill="none" stroke="black" strokeOpacity={defs.strokeOpacity} strokeWidth={defs.strokeWidth}>
        <path d={path}/>
        <path d={path.replaceAll('0.55','0.65')}/>
      </g>;
    }
    if (defs.pattern === 'hatch') {
      const lines=[];
      const step=3.5;
      for(let x=-hmm; x<wmm+hmm; x+=step){
        lines.push(<line key={x} x1={x} y1={0} x2={x+hmm} y2={hmm} stroke="black" strokeOpacity={defs.strokeOpacity} strokeWidth={defs.strokeWidth}/>);
      }
      return <g>{lines}</g>;
    }
    if (defs.pattern === 'retro') {
      const inset = 2; // mm
      const r = 3; // mm corner radius
      return <g stroke="black" strokeOpacity={defs.strokeOpacity} fill="none">
        <rect x={inset} y={inset} width={wmm-2*inset} height={hmm-2*inset} rx={r} ry={r} strokeWidth="0.6"/>
        <rect x={inset+2} y={inset+2} width={wmm-2*(inset+2)} height={hmm-2*(inset+2)} rx={r} ry={r} strokeWidth="0.4" opacity="0.6"/>
        <circle cx={inset+4} cy={inset+4} r="1.3" />
        <circle cx={wmm-inset-4} cy={hmm-inset-4} r="1.3" />
      </g>;
    }
    return null;
  };

  // text styles
  const fontArtist = 3.6; // mm ~ 10pt
  const fontYear = 8.2;   // mm ~ 22pt
  const fontTitle = 3.2;  // mm ~ 9pt

  // Build content
  const A = song?.artist || 'Wykonawca';
  const Y = song?.year || '1991';
  const T = song?.title || 'Tytuł utworu';

  return (
    <svg ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={`${wmm}mm`} height={`${hmm}mm`}
      viewBox={`0 0 ${wmm} ${hmm}`}
    >
      {/* border */}
      <rect x="0.4" y="0.4" width={wmm-0.8} height={hmm-0.8} fill="white" stroke="black" strokeWidth={defs.borderStrong?0.6:0.3} opacity="0.9" />

      {face==='back' && (<g>
        {/* pattern background */}
        <Bg/>
        {/* inner frame */}
        <rect x="1.2" y="1.2" width={wmm-2.4} height={hmm-2.4} fill="none" stroke="black" strokeOpacity="0.5" strokeWidth="0.3" rx="2" ry="2"/>
        {/* ticket perforation */}
        {defs.pattern==='ticket' && (
          <g opacity="0.6">
            <rect x="1.6" y="2" width="0.4" height={hmm-4} fill="url(#dots)"/>
            <rect x={wmm-2.0} y="2" width="0.4" height={hmm-4} fill="url(#dots)"/>
            <defs>
              <pattern id="dots" width="0.6" height="1.2" patternUnits="userSpaceOnUse">
                <rect width="0.6" height="0.6" fill="black"/>
                <rect y="0.6" width="0.6" height="0.6" fill="white"/>
              </pattern>
            </defs>
          </g>
        )}

        {/* artist */}
        <text x={wmm/2} y={hmm*0.36} fontFamily="Inter, Arial, sans-serif" fontWeight="700" fontSize={fontArtist} textAnchor="middle" fill="black">{A}</text>
        {/* year */}
        <text x={wmm/2} y={hmm*0.52} fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize={fontYear} textAnchor="middle" fill="black" letterSpacing="0.2">{Y}</text>
        {/* title */}
        <text x={wmm/2} y={hmm*0.66} fontFamily="Inter, Arial, sans-serif" fontWeight="500" fontSize={fontTitle} textAnchor="middle" fill="black">{T}</text>
      </g>)}

      {face==='front' && (<g>
        {/* QR box */}
        <rect x={(wmm*0.1)} y={(hmm*0.1)} width={wmm*0.8} height={wmm*0.8} fill="white" stroke="black" strokeWidth="0.3" rx="1.2" ry="1.2"/>
        {/* QR content */}
        <g transform={`translate(${wmm*0.1+1}, ${hmm*0.1+1}) scale(${(wmm*0.8-2)/100})`} dangerouslySetInnerHTML={{__html: qrSVG}}/>
      </g>)}
    </svg>
  );
});

export default CardSVG;
