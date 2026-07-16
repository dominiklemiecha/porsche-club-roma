import { normalizza, RigaFile } from './import-partecipanti.util';

export interface PdfTextItem { str: string; x: number; y: number; }

/** Raggruppa gli item per riga visiva (y simile) e ordina: righe dall'alto, item da sinistra. */
function righeDaItems(items: PdfTextItem[], tolleranza = 2): PdfTextItem[][] {
  // ordinamento per y decrescente (origine PDF in basso: y alto = riga in alto),
  // poi raggruppamento degli item consecutivi entro la tolleranza: O(n log n)
  const validi = items.filter(it => it.str.trim());
  validi.sort((a, b) => b.y - a.y);
  const righe: PdfTextItem[][] = [];
  let yRiga = Infinity;
  for (const it of validi) {
    if (righe.length === 0 || Math.abs(yRiga - it.y) > tolleranza) {
      righe.push([]);
      yRiga = it.y;
    }
    righe[righe.length - 1].push(it);
  }
  return righe.map(r => r.sort((a, b) => a.x - b.x));
}

/**
 * Estrae la colonna "Socio" da pagine di item testuali con coordinate.
 * L'intervallo x della colonna è delimitato dai punti medi verso le
 * intestazioni adiacenti. Ritorna null se nessuna pagina ha l'intestazione.
 */
export function estraiColonnaSocioDaPagine(pagine: PdfTextItem[][]): RigaFile[] | null {
  let range: { sx: number; dx: number } | null = null;
  const out: RigaFile[] = [];
  let riga = 0;
  for (const items of pagine) {
    const righe = righeDaItems(items);
    let start = 0;
    const idx = righe.findIndex(r => r.some(it => normalizza(it.str) === 'socio'));
    if (idx >= 0) {
      const header = righe[idx];
      const i = header.findIndex(it => normalizza(it.str) === 'socio');
      const sx = i > 0 ? (header[i - 1].x + header[i].x) / 2 : header[i].x - 20;
      const dx = i < header.length - 1 ? (header[i].x + header[i + 1].x) / 2 : Infinity;
      range = { sx, dx };
      start = idx + 1;
    }
    if (!range) continue;
    const rg = range;
    for (let r = start; r < righe.length; r++) {
      riga++;
      const testo = righe[r]
        .filter(it => it.x >= rg.sx && it.x < rg.dx)
        .map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
      if (!testo || /^\d+$/.test(testo)) continue;
      out.push({ riga, testo });
    }
  }
  return range ? out : null;
}

/** Legge un PDF e restituisce, per pagina, gli item testuali con coordinate. */
export async function estraiPagineDaPdf(buffer: Buffer): Promise<PdfTextItem[][]> {
  // build legacy CJS (le v4+ sono ESM-only); require dinamico per evitare costi a bootstrap
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfjs: any = require('pdfjs-dist/legacy/build/pdf.js');
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;
  try {
    const pagine: PdfTextItem[][] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      pagine.push(content.items.map((it: any) => ({
        str: String(it.str ?? ''),
        x: Number(it.transform?.[4] ?? 0),
        y: Number(it.transform?.[5] ?? 0),
      })));
    }
    return pagine;
  } finally {
    await doc.destroy();
  }
}
