/**
 * Sync soci dal file /seed/soci.xlsx verso il DB (idempotente).
 * Esecuzione: node dist/src/seed/sync-soci.js
 *
 * - upsert per numero_tessera (nome, cognome, modello_auto)
 * - i soci fuori lista senza partecipazioni vengono eliminati
 * - i soci fuori lista CON partecipazioni: se in lista esiste esattamente
 *   una persona con stesso cognome+nome (tessera rinumerata), le partecipazioni
 *   vengono spostate sulla riga nuova e la vecchia eliminata; altrimenti il
 *   socio viene mantenuto e segnalato.
 */
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';

const FILE = process.env.SEED_FILE || '/seed/soci.xlsx';

type Riga = { numero_tessera: number; nome: string; cognome: string; modello_auto: string | null };

async function leggiExcel(): Promise<Riga[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Nessun foglio nel file seed');

  // Colonne: A=N., B=Cognome, C=Nome, D=Tessera, E=Modello auto, F=Versione, G=Anno. Dati da riga 2.
  const righe: Riga[] = [];
  const seen = new Set<number>();
  ws.eachRow({ includeEmpty: false }, (row, idx) => {
    if (idx < 2) return;
    const cognome  = String(row.getCell(2).value ?? '').trim();
    const nome     = String(row.getCell(3).value ?? '').trim();
    const tess     = Number(row.getCell(4).value);
    const modello  = String(row.getCell(5).value ?? '').trim();
    const versione = String(row.getCell(6).value ?? '').trim();
    const anno     = String(row.getCell(7).value ?? '').trim();
    if (!cognome || !nome) return;
    if (!Number.isFinite(tess) || tess <= 0 || seen.has(tess)) return;
    seen.add(tess);
    const auto = ([modello, versione].filter(Boolean).join(' ') + (anno ? ` (${anno})` : '')).trim();
    righe.push({ numero_tessera: tess, nome, cognome, modello_auto: auto || null });
  });
  return righe;
}

async function main() {
  if (!fs.existsSync(FILE)) throw new Error(`File seed ${FILE} non trovato`);
  const righe = await leggiExcel();
  if (righe.length === 0) throw new Error('Nessun socio nel file seed');
  console.log(`Lista: ${righe.length} soci`);

  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async (tx) => {
      for (const r of righe) {
        await tx.socio.upsert({
          where:  { numero_tessera: r.numero_tessera },
          update: { nome: r.nome, cognome: r.cognome, modello_auto: r.modello_auto },
          create: r,
        });
      }

      const tessere = righe.map((r) => r.numero_tessera);
      const fuoriLista = await tx.socio.findMany({
        where: { numero_tessera: { notIn: tessere } },
        include: { partecipazioni: { select: { id: true } } },
      });

      let eliminati = 0, accorpati = 0;
      for (const vecchio of fuoriLista) {
        if (vecchio.partecipazioni.length === 0) {
          await tx.socio.delete({ where: { id: vecchio.id } });
          eliminati++;
          continue;
        }
        const omonimi = await tx.socio.findMany({
          where: {
            numero_tessera: { in: tessere },
            cognome: { equals: vecchio.cognome, mode: 'insensitive' },
            nome:    { equals: vecchio.nome,    mode: 'insensitive' },
          },
        });
        if (omonimi.length === 1) {
          await tx.partecipazione.updateMany({
            where: { socio_id: vecchio.id },
            data:  { socio_id: omonimi[0].id },
          });
          await tx.socio.delete({ where: { id: vecchio.id } });
          accorpati++;
          console.log(`Accorpato: ${vecchio.cognome} ${vecchio.nome} (tessera ${vecchio.numero_tessera} -> ${omonimi[0].numero_tessera})`);
        } else {
          console.warn(`MANTENUTO fuori lista (ha partecipazioni, nessun omonimo univoco): ${vecchio.cognome} ${vecchio.nome} (tessera ${vecchio.numero_tessera})`);
        }
      }
      console.log(`Upsert: ${righe.length} | Eliminati: ${eliminati} | Accorpati: ${accorpati}`);
    }, { timeout: 120_000, maxWait: 10_000 });

    const tot = await prisma.socio.count();
    console.log(`Totale soci a DB: ${tot}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
