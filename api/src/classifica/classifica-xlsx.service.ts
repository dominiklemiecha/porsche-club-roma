import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ClassificaService, Scope } from './classifica.service';

@Injectable()
export class ClassificaXlsxService {
  constructor(private classifica: ClassificaService) {}

  /**
   * Classifica in Excel: Posizione, Socio, Totale punti e una colonna per gara
   * (intestazione su due righe: titolo e data) con il punteggio ottenuto.
   */
  async build(scope: Scope, anno?: number, from?: Date, to?: Date, eventoIds?: number[]): Promise<Buffer> {
    const data = await this.classifica.build(scope, anno, from, to, eventoIds);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Classifica ${scope}`, { views: [{ state: 'frozen', xSplit: 3, ySplit: 2 }] });

    const fissi = ['Posizione', 'Socio', 'Totale punti'];
    ws.addRow([...fissi, ...data.eventi.map(e => e.titolo)]);
    ws.addRow(['', '', '', ...data.eventi.map(e => new Date(e.data_evento))]);
    fissi.forEach((_, i) => ws.mergeCells(1, i + 1, 2, i + 1));

    for (const r of data.righe) {
      ws.addRow([
        r.posizione,
        `${r.socio.cognome} ${r.socio.nome}`,
        r.totale,
        ...data.eventi.map(e => r.punti_per_evento[e.id] ?? null),
      ]);
    }

    ws.getColumn(1).width = 10;
    ws.getColumn(2).width = 30;
    ws.getColumn(3).width = 13;
    data.eventi.forEach((_, i) => {
      const col = ws.getColumn(4 + i);
      col.width = 16;
      col.alignment = { horizontal: 'center' };
    });
    for (const n of [1, 2]) {
      const row = ws.getRow(n);
      row.font = { bold: true };
      row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }
    ws.getRow(1).height = 32;
    ws.getRow(2).numFmt = 'dd/mm/yyyy';
    ws.getColumn(3).font = { bold: true };

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}
