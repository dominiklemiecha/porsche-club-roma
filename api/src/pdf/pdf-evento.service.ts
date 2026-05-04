import { Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PdfEventoService {
  constructor(private prisma: PrismaService) {}

  async stream(id: number, res: Response) {
    const ev = await this.prisma.evento.findUnique({
      where: { id },
      include: { partecipazioni: { include: { socio: true }, orderBy: { punteggio_totale: 'desc' } } },
    });
    if (!ev) throw new NotFoundException();

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=evento-${id}.pdf`);
    doc.pipe(res);

    const logo = path.join(__dirname, '..', '..', 'assets', 'porsche-logo.png');
    if (fs.existsSync(logo)) {
      try { doc.image(logo, 50, 40, { width: 60 }); } catch {}
    }

    doc.fontSize(14).font('Helvetica-Bold').text(ev.titolo, 130, 50);
    doc.fontSize(10).font('Helvetica').text(
      `${new Date(ev.data_evento).toLocaleDateString('it-IT')} · ${ev.categoria.toUpperCase()} · base ${ev.punteggio_base} pt`,
      130, 70,
    );
    if (ev.prova_abilita && ev.scala_prova) {
      doc.text(`Prova abilità: ${(ev.scala_prova as number[]).join(' / ')}`, 130, 85);
    }

    let y = 130;
    doc.fontSize(9).font('Helvetica-Bold');
    const cols = ['Pos', 'Tess.', 'Cognome', 'Nome', 'Base', 'Prova', 'Totale'];
    const w =    [30,    40,      100,        100,    40,     40,      40];
    let x = 50;
    cols.forEach((c, i) => { doc.text(c, x, y, { width: w[i] }); x += w[i]; });
    doc.font('Helvetica');
    y += 18;

    for (const p of ev.partecipazioni) {
      x = 50;
      const base = ev.punteggio_base;
      const bonus = p.punteggio_totale - base;
      const row: (string|number)[] = [
        p.posizione_prova ?? '',
        p.socio.numero_tessera,
        p.socio.cognome,
        p.socio.nome,
        base,
        bonus > 0 ? bonus : '',
        p.punteggio_totale,
      ];
      row.forEach((c, i) => { doc.text(String(c), x, y, { width: w[i] }); x += w[i]; });
      y += 16;
      if (y > doc.page.height - 50) { doc.addPage(); y = 50; }
    }

    doc.end();
  }
}
