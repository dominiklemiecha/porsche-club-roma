import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ClassificaService, Scope } from '../classifica/classifica.service';

@Injectable()
export class PdfClassificaService {
  constructor(private classifica: ClassificaService) {}

  async stream(scope: Scope, res: Response, from?: Date, to?: Date, eventoIds?: number[]) {
    const data = await this.classifica.build(scope, from, to, eventoIds);

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=classifica-${scope}.pdf`);
    doc.pipe(res);

    const logoPath = path.join(__dirname, '..', '..', 'assets', 'porsche-logo.png');
    if (fs.existsSync(logoPath)) {
      try { doc.image(logoPath, 30, 25, { width: 60 }); } catch {}
    }

    const titolo = scope === 'generale' ? 'GENERALE' : scope.toUpperCase();
    doc.fontSize(16).font('Helvetica-Bold').text(`Classifica ${titolo} — Porsche Club Roma`, 100, 35);
    doc.fontSize(9).font('Helvetica').text(`Generato: ${new Date().toLocaleString('it-IT')}`, 100, 55);

    const startY = 90;
    const colWidth = 50;
    const fixedCols = ['Pos', 'Tess.', 'Cognome', 'Nome'];
    const fixedW = [30, 35, 100, 100];
    let x = 30;
    doc.fontSize(8).font('Helvetica-Bold');
    fixedCols.forEach((c, i) => { doc.text(c, x, startY, { width: fixedW[i] }); x += fixedW[i]; });
    data.eventi.forEach(e => {
      const lbl = new Date(e.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
      doc.text(lbl, x, startY, { width: colWidth });
      x += colWidth;
    });
    doc.text('Tot', x, startY, { width: 35 });
    doc.font('Helvetica');

    let y = startY + 20;
    for (const r of data.righe) {
      x = 30;
      const cells = [r.posizione, r.socio.numero_tessera, r.socio.cognome, r.socio.nome];
      cells.forEach((c, i) => { doc.text(String(c), x, y, { width: fixedW[i] }); x += fixedW[i]; });
      data.eventi.forEach(e => {
        const v = r.punti_per_evento[String(e.id)];
        doc.text(v != null ? String(v) : '', x, y, { width: colWidth });
        x += colWidth;
      });
      doc.font('Helvetica-Bold').text(String(r.totale), x, y, { width: 35 }).font('Helvetica');
      y += 18;
      if (y > doc.page.height - 40) { doc.addPage(); y = 40; }
    }

    doc.end();
  }
}
