// Fetch Roboto TTF at runtime and register in jsPDF.
export async function ensureRobotoForPDF(doc){
  const fontList = doc.getFontList?.() || {};
  if (fontList['Roboto']) return;

  async function fetchTTF(url){
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) throw new Error('Font fetch failed: ' + url);
    const buf = await r.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  const urls = {
    regular: [
      'https://cdn.jsdelivr.net/npm/typeface-roboto@0.0.75/files/roboto-latin-400.ttf',
      'https://cdn.jsdelivr.net/npm/typeface-roboto@0.0.54/files/roboto-latin-400.ttf'
    ],
    bold: [
      'https://cdn.jsdelivr.net/npm/typeface-roboto@0.0.75/files/roboto-latin-700.ttf',
      'https://cdn.jsdelivr.net/npm/typeface-roboto@0.0.54/files/roboto-latin-700.ttf'
    ],
    italic: [
      'https://cdn.jsdelivr.net/npm/typeface-roboto@0.0.75/files/roboto-latin-400-italic.ttf',
      'https://cdn.jsdelivr.net/npm/typeface-roboto@0.0.54/files/roboto-latin-400-italic.ttf'
    ]
  };

  async function firstWorking(list){
    for (const u of list){
      try { return await fetchTTF(u); } catch(_) {}
    }
    throw new Error('All Roboto font sources failed.');
  }

  const [reg, bold, italic] = await Promise.all([
    firstWorking(urls.regular),
    firstWorking(urls.bold),
    firstWorking(urls.italic)
  ]);

  doc.addFileToVFS('Roboto-Regular.ttf', reg);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', bold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.addFileToVFS('Roboto-Italic.ttf', italic);
  doc.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');
}
