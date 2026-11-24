import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { parseCsv, sniffFormato } from '../eventi/import-partecipanti.util';
import { conflittiTessereNuovi, estraiElencoSoci, pianificaImport, Piano, RigaSocio } from './import-soci.util';
import { ConfermaImportSociDto } from './dto/import-soci.dto';

@Injectable()
export class ImportSociService {
  constructor(private prisma: PrismaService) {}

  /** Legge l'elenco (xlsx/csv) e restituisce il riepilogo delle modifiche (nessuna scrittura). */
  async preview(buffer: Buffer): Promise<Piano> {
    const righe = await this.estraiRighe(buffer);
    if (righe.length === 0) throw new BadRequestException('Il file non contiene soci');
    return pianificaImport(righe, await this.caricaSoci());
  }

  /** Ricalcola il piano sulle righe confermate e lo applica in un'unica transazione. */
  async conferma(dto: ConfermaImportSociDto) {
    const righe: RigaSocio[] = dto.righe.map(r => ({
      riga: r.riga, cognome: r.cognome.trim(), nome: r.nome.trim(), numero_tessera: r.numero_tessera ?? null,
    }));

    return this.prisma.$transaction(async tx => {
      const piano = pianificaImport(righe, await this.caricaSoci(tx));
      if (piano.errori.length) throw new BadRequestException(piano.errori.join(' · '));
      const conflitti = conflittiTessereNuovi(piano.nuovi, piano.tessere_occupate);
      if (conflitti.length) throw new BadRequestException(conflitti.join(' · '));
      const attesi = new Set(dto.rimuovi_ids);
      if (attesi.size !== piano.rimossi.length || piano.rimossi.some(r => !attesi.has(r.id))) {
        throw new ConflictException("L'anagrafica è cambiata dopo l'anteprima: ricarica il file");
      }

      const ora = new Date();
      const daEliminare = piano.rimossi.filter(r => r.azione === 'elimina').map(r => r.id);
      const daDisattivare = piano.rimossi.filter(r => r.azione === 'disattiva').map(r => r.id);
      if (daEliminare.length) await tx.socio.deleteMany({ where: { id: { in: daEliminare } } });
      if (daDisattivare.length) {
        await tx.socio.updateMany({ where: { id: { in: daDisattivare } }, data: { disattivato_il: ora } });
      }
      for (const r of piano.rinumerati) {
        await tx.socio.update({ where: { id: r.id }, data: { numero_tessera: r.a } });
      }
      for (const r of piano.riattivati) {
        await tx.socio.update({ where: { id: r.id }, data: { numero_tessera: r.numero_tessera, disattivato_il: null } });
      }
      if (piano.nuovi.length) {
        await tx.socio.createMany({
          data: piano.nuovi.map(n => ({ cognome: n.cognome, nome: n.nome, numero_tessera: n.numero_tessera! })),
        });
      }
      return {
        aggiunti: piano.nuovi.length, rinumerati: piano.rinumerati.length, riattivati: piano.riattivati.length,
        eliminati: daEliminare.length, disattivati: daDisattivare.length, invariati: piano.invariati,
      };
    }, { timeout: 60_000, maxWait: 10_000 });
  }

  private async caricaSoci(db: Pick<PrismaService, 'socio'> = this.prisma) {
    const soci = await db.socio.findMany({
      select: {
        id: true, numero_tessera: true, nome: true, cognome: true, disattivato_il: true,
        _count: { select: { partecipazioni: true } },
      },
    });
    return soci.map(({ _count, ...s }) => ({ ...s, partecipazioni: _count.partecipazioni }));
  }

  private async estraiRighe(buffer: Buffer): Promise<RigaSocio[]> {
    const formato = sniffFormato(buffer);
    if (formato === 'pdf') throw new BadRequestException("Per l'elenco soci carica un file Excel (.xlsx) o CSV");
    let matrice: string[][];
    if (formato === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      try { await wb.xlsx.load(buffer as any); } catch { throw new BadRequestException('File Excel non valido'); }
      const ws = wb.worksheets[0];
      if (!ws) throw new BadRequestException('Il file non contiene fogli');
      matrice = [];
      ws.eachRow({ includeEmpty: true }, (row, n) => {
        const celle: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell, col) => { celle[col - 1] = String(cell.text ?? '').trim(); });
        matrice[n - 1] = celle;
      });
    } else {
      matrice = parseCsv(buffer.toString('utf8'));
    }
    const righe = estraiElencoSoci(matrice);
    if (righe === null) throw new BadRequestException('Intestazione non trovata: servono le colonne Cognome, Nome e Tessera');
    return righe;
  }
}
