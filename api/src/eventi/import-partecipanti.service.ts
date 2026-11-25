import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import {
  infoColonne, matchPartecipanti, parseCsv, righeDaTabella, sniffFormato, Tabella, tabellaDaMatrice,
} from './import-partecipanti.util';
import { estraiPagineDaPdf, tabellaDaPagine } from './pdf-tabella.util';

@Injectable()
export class ImportPartecipantiService {
  constructor(private prisma: PrismaService) {}

  /**
   * Legge il file (xlsx/csv/pdf) e restituisce l'anteprima del match (nessuna scrittura).
   * colonna/colonna2: colonna dei nomi scelta dall'utente (default: proposta dal file),
   * colonna2 opzionale viene unita alla prima (es. Cognome + Nome separati).
   */
  async preview(evento_id: number, buffer: Buffer, colonna?: number, colonna2?: number | null) {
    const ev = await this.prisma.evento.findUnique({ where: { id: evento_id } });
    if (!ev) throw new NotFoundException('evento');

    const tabella = await this.leggiTabella(buffer);
    const colonne = infoColonne(tabella);
    if (colonne.length === 0) throw new BadRequestException('Il file è vuoto');
    const soci = (await this.prisma.socio.findMany({
      where: { disattivato_il: null },
      select: { id: true, nome: true, cognome: true, numero_tessera: true, alias: { select: { chiave: true } } },
    })).map(({ alias, ...s }) => ({ ...s, alias: alias.map(a => a.chiave) }));

    const valida = (c: number | null | undefined) => c != null && colonne.some(x => x.indice === c);
    let col = valida(colonna) ? colonna! : tabella.colonna;
    // senza intestazione riconosciuta e senza scelta dell'utente: la colonna con piu' soci riconosciuti
    if (!valida(colonna) && !tabella.intestazioni) {
      let best = -1;
      for (const c of colonne) {
        const n = matchPartecipanti(righeDaTabella(tabella, c.indice), soci).trovati.length;
        if (n > best) { best = n; col = c.indice; }
      }
    }
    const col2 = colonna2 === undefined ? tabella.colonna2 : valida(colonna2) && colonna2 !== col ? colonna2 : null;

    const match = matchPartecipanti(righeDaTabella(tabella, col, col2), soci);
    return { colonne, colonna: col, colonna2: col2, ...match };
  }

  private async leggiTabella(buffer: Buffer): Promise<Tabella> {
    const formato = sniffFormato(buffer);
    if (formato === 'xlsx') return tabellaDaMatrice(await this.matriceDaXlsx(buffer));
    if (formato === 'pdf') return this.tabellaDaPdf(buffer);
    return tabellaDaMatrice(parseCsv(buffer.toString('utf8')));
  }

  private async matriceDaXlsx(buffer: Buffer): Promise<string[][]> {
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
    return matrice;
  }

  private async tabellaDaPdf(buffer: Buffer): Promise<Tabella> {
    let pagine;
    try {
      pagine = await estraiPagineDaPdf(buffer);
    } catch {
      throw new BadRequestException('File PDF non valido o illeggibile');
    }
    const t = tabellaDaPagine(pagine);
    if (t === null) throw new BadRequestException('PDF non riconosciuto: manca un\'intestazione come "Socio" o "Cognome e nome"');
    return t;
  }
}
