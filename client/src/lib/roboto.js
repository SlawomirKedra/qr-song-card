// client/src/lib/roboto.js
// Rejestruje Roboto w jsPDF z lokalnych plików z paczki "typeface-roboto".
// ZERO zewnętrznych URL-i => brak 404/CORS.

import robotoRegularUrl from 'typeface-roboto/files/roboto-latin-400.ttf?url';
import robotoBoldUrl    from 'typeface-roboto/files/roboto-latin-700.ttf?url';
import robotoItalicUrl  from 'typeface-roboto/files/roboto-latin-400-italic.ttf?url';

async function urlToBase64(url) {
  const r = await fetch(url);              // ten URL jest z tej samej domeny (dist), więc CORS ok
  const buf = await r.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function ensureRobotoForPDF(doc) {
  if (doc.getFontList?.().Roboto) return;  // już dodane

  const [reg, bold, italic] = await Promise.all([
    urlToBase64(robotoRegularUrl),
    urlToBase64(robotoBoldUrl),
    urlToBase64(robotoItalicUrl),
  ]);

  doc.addFileToVFS('Roboto-Regular.ttf', reg);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

  doc.addFileToVFS('Roboto-Bold.ttf', bold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.addFileToVFS('Roboto-Italic.ttf', italic);
  doc.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');
}
