// Rejestruje Roboto w jsPDF z LOKALNYCH plików w public/ (bez CDN).
async function urlToBase64(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Font fetch failed: ' + url);
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
  // jeśli już dodane – wyjdź
  const list = doc.getFontList?.() || {};
  if (list['Roboto']) return;

  const [reg, bold, italic] = await Promise.all([
    urlToBase64('/fonts/roboto/Roboto-Regular.ttf'),
    urlToBase64('/fonts/roboto/Roboto-Bold.ttf'),
    urlToBase64('/fonts/roboto/Roboto-Italic.ttf'),
  ]);

  doc.addFileToVFS('Roboto-Regular.ttf', reg);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

  doc.addFileToVFS('Roboto-Bold.ttf', bold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.addFileToVFS('Roboto-Italic.ttf', italic);
  doc.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');
}
