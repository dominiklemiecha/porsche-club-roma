import { estraiColonnaSocioDaPagine, estraiPagineDaPdf, PdfTextItem } from './pdf-tabella.util';
import PDFDocument from 'pdfkit';

// Coordinate PDF: origine in basso a sinistra, y decresce scendendo nella pagina.
const pagina: PdfTextItem[] = [
  // intestazione (y=700)
  { str: 'Number', x: 40, y: 700 }, { str: 'Socio', x: 120, y: 700 }, { str: 'Ospite', x: 300, y: 700 },
  // riga 1 (y=680)
  { str: '1', x: 40, y: 680 }, { str: 'Rossi, Mario', x: 120, y: 680 }, { str: 'Anna Verdi', x: 300, y: 680 },
  // riga 2 (y=660): cella socio spezzata in due item
  { str: '2', x: 40, y: 660 }, { str: 'Bianchi,', x: 120, y: 660 }, { str: 'Anna', x: 160, y: 660.5 },
  // riga 3 (y=640): socio vuoto, solo ospite
  { str: '3', x: 40, y: 640 }, { str: 'Solo, Ospite', x: 300, y: 640 },
  // riga totale (y=620): numerica
  { str: '74', x: 120, y: 620 },
];

describe('estraiColonnaSocioDaPagine', () => {
  it('estrae solo la colonna Socio, unisce frammenti, scarta vuote e numeriche', () => {
    const r = estraiColonnaSocioDaPagine([pagina]);
    expect(r).toEqual([
      { riga: 1, testo: 'Rossi, Mario' },
      { riga: 2, testo: 'Bianchi, Anna' },
    ]);
  });

  it('continua su pagine successive senza intestazione riusando il range', () => {
    const pagina2: PdfTextItem[] = [
      { str: '4', x: 40, y: 700 }, { str: 'Verdi, Luca', x: 120, y: 700 },
    ];
    const r = estraiColonnaSocioDaPagine([pagina, pagina2]);
    expect(r?.map(x => x.testo)).toEqual(['Rossi, Mario', 'Bianchi, Anna', 'Verdi, Luca']);
  });

  it('ritorna null se manca l\'intestazione Socio', () => {
    expect(estraiColonnaSocioDaPagine([[{ str: 'ciao', x: 10, y: 10 }]])).toBeNull();
  });
});

function creaPdfFixture(): Promise<Buffer> {
  return new Promise(resolve => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.fontSize(10);
    // pdfkit usa y dall'alto; pdfjs restituirà y in coordinate PDF (dal basso)
    doc.text('Number', 40, 50); doc.text('Socio', 120, 50); doc.text('Ospite', 300, 50);
    doc.text('1', 40, 70);      doc.text('Rossi, Mario', 120, 70); doc.text('Anna Verdi', 300, 70);
    doc.text('2', 40, 90);      doc.text('Bianchi, Anna', 120, 90);
    doc.text('3', 40, 110);     doc.text('Solo, Ospite', 300, 110); // socio vuoto
    doc.text('74', 120, 130);   // riga totale
    doc.end();
  });
}

describe('estraiPagineDaPdf (integrazione pdfjs)', () => {
  it('estrae item con coordinate da un PDF reale e la colonna Socio è corretta', async () => {
    const buf = await creaPdfFixture();
    const pagine = await estraiPagineDaPdf(buf);
    expect(pagine).toHaveLength(1);
    const righe = estraiColonnaSocioDaPagine(pagine);
    expect(righe?.map(r => r.testo)).toEqual(['Rossi, Mario', 'Bianchi, Anna']);
  });

  it('lancia su buffer non pdf', async () => {
    await expect(estraiPagineDaPdf(Buffer.from('non un pdf'))).rejects.toBeDefined();
  });
});
