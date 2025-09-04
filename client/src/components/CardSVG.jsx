import React, { forwardRef, useMemo, useRef } from 'react';
import QRCode from 'qrcode';

const PAGE_W = 210;
const PAGE_H = 297;

// --- QR jako wektorowe prostokąty (identyczny w podglądzie i PDF) ---
function makeQRRects(text, sideMm, quietModules = 2, ecl = 'M') {
  const model = QRCode.create(text, { errorCorrectionLevel: ecl });
  const size = model.modules.size;
  const data = model.modules.data;
  const usable = size + quietModules * 2;
  const moduleMm = sideMm / usable;
  const rects = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) {
        rects.push({
          x: (x + quietModules) * moduleMm,
          y: (y + quietModules) * moduleMm,
          w: moduleMm,
          h: moduleMm,
        });
      }
    }
  }
  return { rects, sideWithQuiet: moduleMm * usable };
}

// --- Pomiar tekstu i dopasowanie ---
function useMeasureCanvas() {
  const ref = useRef(null);
  if (!ref.current) ref.current = document.createElement('canvas');
  return ref.current.getContext('2d');
}

function wrapToLines(ctx, text, fontPx, maxWidthPx) {
  ctx.font = `700 ${fontPx}px Roboto, Arial, sans-serif`; // waga nadpisujemy wyżej przy wywołaniu
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = (cur ? cur + ' ' : '') + w;
    if (ctx.measureText(next).width <= maxWidthPx) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Dopasuj blok tekstu do maksymalnych:
 * - szerokości (px),
 * - wysokości (mm),
 * - liczby linii (np. 2).
 * Zmniejsza font stopniowo aż wszystkie warunki będą spełnione.
 */
function fitBlock(ctx, text, {
  basePx,
  maxWidthPx,
  maxHeightMm,
  maxLines = 2,
  weight = '700',
  italic = false,
  pxPerMm = 3.78,
}) {
  const lineGap = 1.15; // mnożnik odstępu między wierszami (em)
  let sizePx = basePx;

  const make = (px) => {
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${px}px Roboto, Arial, sans-serif`;
    let lines = wrapToLines(ctx, text, px, maxWidthPx);
    // ogranicz do maxLines, jeśli jest więcej — rozbijamy na 2 sensowne części
    if (lines.length > maxLines) {
      const take = Math.ceil(lines.length / 2);
      lines = [lines.slice(0, take).join(' '), lines.slice(take).join(' ')].slice(0, maxLines);
    }
    const lineH_mm = (px / pxPerMm) * lineGap;
    const blockH_mm = lineH_mm * lines.length;
    const tooWide = lines.some(l => ctx.measureText(l).width > maxWidthPx);
    const tooTall = blockH_mm > maxHeightMm;
    return { lines, px, lineH_mm, blockH_mm, tooWide, tooTall };
  };

  let r = make(sizePx);
  while ((r.tooWide || r.tooTall) && sizePx > 7) {
    sizePx -= 0.5;
    r = make(sizePx);
  }
  return r; // {lines, px, lineH_mm, blockH_mm}
}

const CardSVG = forwardRef(function CardSVG({ song, face = 'front' }, ref) {
  // stałe: 4 kolumny
  const margin = 4;
  const cols = 4;
  const availW = PAGE_W - margin * (cols + 1);
  const S = availW / cols; // bok kwadratu (mm)

  const text = song?.url || `${song?.title || ''} - ${song?.artist || ''}`;
  const qr = useMemo(() => makeQRRects(text, S * 0.92, 2, 'M'), [text, S]);

  const A = song?.artist || 'Artist';
  const Y = song?.year || '1991';
  const T = song?.title || 'Song Title';

  const ctx = useMeasureCanvas();
  const pxPerMm = 3.78;

  // Obszary na stronie (wszystko w mm, żeby PDF = preview)
  const pad = S * 0.10;       // wewnętrzny margines ramki
  const gap = S * 0.03;       // przerwa między blokami

  const topAreaH    = S / 2 - pad - gap; // na artystę
  const bottomAreaH = S / 2 - pad - gap; // na tytuł

  const maxWidthPx = (S - pad * 2) * pxPerMm;

  // Propozycje bazowych rozmiarów
  const baseArtistPx = Math.max(12, S * 0.10 * pxPerMm);
  const baseTitlePx  = Math.max(11, S * 0.09  * pxPerMm);
  const baseYearPx   = Math.max(28, S * 0.30 * pxPerMm);

  // Dopasuj artystę i tytuł tak, by NA PEWNO zmieściły się w swoich obszarach
  const artist = fitBlock(ctx, A, {
    basePx: baseArtistPx, maxWidthPx, maxHeightMm: topAreaH, maxLines: 2, weight: '700', italic: false, pxPerMm
  });
  const title = fitBlock(ctx, T, {
    basePx: baseTitlePx, maxWidthPx, maxHeightMm: bottomAreaH, maxLines: 2, weight: '500', italic: true, pxPerMm
  });

  // Ile miejsca zostaje na rok między nimi?
  const availableCenterH_mm = (S - pad*2) - artist.blockH_mm - title.blockH_mm - gap*2;
  // Rozmiar roku = min(baza, dostępna wysokość * współczynnik)
  const yearSize_mm = Math.max(6, Math.min(baseYearPx / pxPerMm, availableCenterH_mm * 0.9));
  const yearSize_px = yearSize_mm * pxPerMm;

  // Pozycje Y (baseline) — bez nachodzenia
  // ARTYSTA: zaczyna od pad + first line baseline
  const artistFirstBaselineY = pad + artist.lineH_mm * 0.9; // lekkie podniesienie, żeby optycznie centrowało
  // dolna krawędź bloku artysty:
  const artistBottom = pad + artist.blockH_mm;

  // TYTUŁ: dosuwamy od dołu
  const titleTop = S - pad - title.blockH_mm;
  const titleFirstBaselineY = titleTop + title.lineH_mm * 0.9;

  // ROK: dokładnie w środku dostępnego pasa
  const yearTop = artistBottom + gap;
  const yearBottom = titleTop - gap;
  const yearCenter = (yearTop + yearBottom) / 2;
  // baseline roku (alfabetyczna) jest nieco poniżej środka, więc korygujemy ~0.32 em
  const yearBaselineY = yearCenter + yearSize_mm * 0.32;

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={`${S}mm`} height={`${S}mm`} viewBox={`0 0 ${S} ${S}`}>
      {/* zewnętrzna ramka */}
      <rect x="0.4" y="0.4" width={S-0.8} height={S-0.8} fill="white" stroke="black" strokeWidth="0.45" opacity="0.98" />

      {face === 'back' && (
        <g>
          <rect x="1.4" y="1.4" width={S-2.8} height={S-2.8} fill="none" stroke="black" strokeWidth="0.25" opacity="0.35" rx="2" ry="2"/>
          {/* ARTYSTA */}
          {artist.lines.map((line, i) => (
            <text key={'a'+i}
              x={S/2}
              y={artistFirstBaselineY + i * artist.lineH_mm}
              fontFamily="Roboto"
              fontWeight="700"
              fontSize={artist.px / pxPerMm}
              textAnchor="middle"
              fill="black">{line}</text>
          ))}

          {/* ROK (waga 700 – brak ostrzeżeń o '800') */}
          <text
            x={S/2}
            y={yearBaselineY}
            fontFamily="Roboto"
            fontWeight="700"
            fontSize={yearSize_mm}
            textAnchor="middle"
            fill="black"
            letterSpacing="0.2">{Y}</text>

          {/* TYTUŁ */}
          {title.lines.map((line, i) => (
            <text key={'t'+i}
              x={S/2}
              y={titleFirstBaselineY + i * title.lineH_mm}
              fontFamily="Roboto"
              fontStyle="italic"
              fontWeight="500"
              fontSize={title.px / pxPerMm}
              textAnchor="middle"
              fill="black">{line}</text>
          ))}
        </g>
      )}

      {face === 'front' && (
        <g>
          {/* QR z „oddechem” i quiet zone 2 moduły */}
          <g transform={`translate(${(S - qr.sideWithQuiet)/2}, ${(S - qr.sideWithQuiet)/2})`}>
            {qr.rects.map((r, i) => (<rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="black" />))}
          </g>
          {/* delikatna ramka nad QR */}
          <rect x="0.5" y="0.5" width={S-1} height={S-1} rx="2" ry="2" fill="none" stroke="black" strokeWidth="0.6"/>
        </g>
      )}
    </svg>
  );
});

export default CardSVG;
