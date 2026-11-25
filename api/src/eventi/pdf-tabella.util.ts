import { normalizza, RigaFile, righeDaTabella, Tabella, trovaColonnaNomi } from './import-partecipanti.util';

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
 * Ricostruisce la tabella da pagine di item testuali con coordinate.
 * Intestazione: la riga con "Socio" (o un'intestazione nota tipo "Cognome e nome");
 * ogni intestazione definisce una colonna delimitata dai punti medi verso le adiacenti.
 * Le pagine successive senza intestazione riusano le colonne. null se nessuna intestazione.
 */
export function tabellaDaPagine(pagine: PdfTextItem[][]): Tabella | null {
  let colonne: { sx: number; dx: number }[] | null = null;
  let intestazioni: string[] | null = null;
  let colonna = 0;
  const righeOut: Tabella['righe'] = [];
  let riga = 0;
  for (const items of pagine) {
    const righe = righeDaItems(items);
    let start = 0;
    // intestazione: "socio" ovunque nella pagina, altrimenti un'intestazione nota nelle prime 5 righe
    let idx = righe.findIndex(r => r.some(it => normalizza(it.str) === 'socio'));
    if (idx < 0) idx = righe.slice(0, 5).findIndex(r => trovaColonnaNomi(r.map(it => it.str)) >= 0);
    if (idx >= 0) {
      const header = righe[idx];
      colonne = header.map((it, i) => ({
        sx: i > 0 ? (header[i - 1].x + it.x) / 2 : -Infinity,
        dx: i < header.length - 1 ? (it.x + header[i + 1].x) / 2 : Infinity,
      }));
      if (!intestazioni) {
        intestazioni = header.map(it => it.str.trim());
        colonna = Math.max(0, trovaColonnaNomi(intestazioni));
      }
      start = idx + 1;
    }
    if (!colonne) continue;
    const cols = colonne;
    for (let r = start; r < righe.length; r++) {
      riga++;
      const celle = cols.map(c => righe[r]
        .filter(it => it.x >= c.sx && it.x < c.dx)
        .map(it => it.str).join(' ').replace(/\s+/g, ' ').trim());
      righeOut.push({ riga, celle });
    }
  }
  return colonne ? { intestazioni, righe: righeOut, colonna, colonna2: null } : null;
}

/** Colonna proposta (di norma "Socio") dalle pagine del PDF. null se manca l'intestazione. */
export function estraiColonnaSocioDaPagine(pagine: PdfTextItem[][]): RigaFile[] | null {
  const t = tabellaDaPagine(pagine);
  return t ? righeDaTabella(t, t.colonna) : null;
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
