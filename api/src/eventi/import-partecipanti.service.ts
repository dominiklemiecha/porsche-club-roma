import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import {
  estraiColonnaSocio, matchPartecipanti, parseCsv, RigaFile, sniffFormato,
} from './import-partecipanti.util';
import { estraiColonnaSocioDaPagine, estraiPagineDaPdf } from './pdf-tabella.util';

@Injectable()
export class ImportPartecipantiService {
  constructor(private prisma: PrismaService) {}

  /** Estrae i nomi dal file (xlsx/csv/pdf) e restituisce l'anteprima del match (nessuna scrittura). */
  async preview(evento_id: number, buffer: Buffer) {
    const ev = await this.prisma.evento.findUnique({ where: { id: evento_id } });
    if (!ev) throw new NotFoundException('evento');

    const righe = await this.estraiRighe(buffer);
    if (righe.length === 0) throw new BadRequestException('Il file è vuoto');

    const soci = await this.prisma.socio.findMany({
      where: { disattivato_il: null },
      select: { id: true, nome: true, cognome: true, numero_tessera: true },
    });
    return matchPartecipanti(righe, soci);
  }

  private async estraiRighe(buffer: Buffer): Promise<RigaFile[]> {
    const formato = sniffFormato(buffer);
    if (formato === 'xlsx') return this.righeDaXlsx(buffer);
    if (formato === 'pdf') return this.righeDaPdf(buffer);
    return estraiColonnaSocio(parseCsv(buffer.toString('utf8')));
  }

  private async righeDaXlsx(buffer: Buffer): Promise<RigaFile[]> {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException('File Excel non valido');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Il file non contiene fogli');
    const matrice: string[][] = [];
    ws.eachRow({ includeEmpty: true }, row => {
      const celle: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        celle[col - 1] = String(cell.text ?? '').trim();
      });
      matrice.push(celle);
    });
    return estraiColonnaSocio(matrice);
  }

  private async righeDaPdf(buffer: Buffer): Promise<RigaFile[]> {
    let pagine;
    try {
      pagine = await estraiPagineDaPdf(buffer);
    } catch {
      throw new BadRequestException('File PDF non valido o illeggibile');
    }
    const righe = estraiColonnaSocioDaPagine(pagine);
    if (righe === null) throw new BadRequestException('PDF non riconosciuto: manca la colonna Socio');
    return righe;
  }
}
