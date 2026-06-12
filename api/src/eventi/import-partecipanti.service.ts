import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { matchPartecipanti, RigaFile } from './import-partecipanti.util';

@Injectable()
export class ImportPartecipantiService {
  constructor(private prisma: PrismaService) {}

  /** Legge la prima colonna del primo foglio e restituisce l'anteprima del match (nessuna scrittura). */
  async preview(evento_id: number, buffer: Buffer) {
    const ev = await this.prisma.evento.findUnique({ where: { id: evento_id } });
    if (!ev) throw new NotFoundException('evento');

    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException('File non valido: caricare un file .xlsx');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Il file non contiene fogli');

    const righe: RigaFile[] = [];
    ws.eachRow({ includeEmpty: false }, (row, idx) => {
      const testo = String(row.getCell(1).text ?? '').trim();
      if (testo) righe.push({ riga: idx, testo });
    });
    if (righe.length === 0) throw new BadRequestException('Il file è vuoto');

    const soci = await this.prisma.socio.findMany({
      select: { id: true, nome: true, cognome: true, numero_tessera: true },
    });
    return matchPartecipanti(righe, soci);
  }
}
