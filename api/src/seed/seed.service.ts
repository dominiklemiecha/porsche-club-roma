import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly log = new Logger('Seed');
  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.seedSoci();
    await this.backfillModelloAuto();
  }

  private async backfillModelloAuto() {
    const file = '/seed/soci.xlsx';
    if (!fs.existsSync(file)) return;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const top = wb.getWorksheet('TOP 20');
    if (!top) return;

    const modelliByName = new Map<string, string>();
    top.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx === 1) return;
      const cognome = String(row.getCell(2).value ?? '').trim().toLowerCase();
      const nome    = String(row.getCell(3).value ?? '').trim().toLowerCase();
      const modello = String(row.getCell(4).value ?? '').trim();
      if (cognome && nome && modello) modelliByName.set(`${cognome}|${nome}`, modello);
    });
    if (modelliByName.size === 0) return;

    const soci = await this.prisma.socio.findMany({ where: { modello_auto: null } });
    let updated = 0;
    for (const s of soci) {
      const key = `${s.cognome.toLowerCase()}|${s.nome.toLowerCase()}`;
      const m = modelliByName.get(key);
      if (!m) continue;
      await this.prisma.socio.update({ where: { id: s.id }, data: { modello_auto: m } });
      updated++;
    }
    if (updated > 0) this.log.log(`Backfill modello_auto: ${updated} soci aggiornati`);
  }

  private async seedAdmin() {
    const count = await this.prisma.adminUser.count();
    if (count > 0) return;
    const username = process.env.ADMIN_USER || 'admin';
    const pass     = process.env.ADMIN_PASS || 'admin123';
    await this.prisma.adminUser.create({
      data: { username, password_hash: await bcrypt.hash(pass, 10) },
    });
    this.log.log(`Admin user '${username}' created`);
  }

  private async seedSoci() {
    const count = await this.prisma.socio.count();
    if (count > 0) return;
    const file = '/seed/soci.xlsx';
    if (!fs.existsSync(file)) { this.log.warn(`Seed file ${file} not found, skipping`); return; }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const ws = wb.getWorksheet('Classifica PCR');
    if (!ws) { this.log.warn('Sheet "Classifica PCR" not found'); return; }

    const created: { numero_tessera: number; nome: string; cognome: string }[] = [];
    const seen = new Set<number>();
    ws.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx === 1) return;                       // header
      const tessRaw = row.getCell(1).value;
      const tess = Number(tessRaw);
      const cognome = String(row.getCell(3).value ?? '').trim();
      const nome    = String(row.getCell(4).value ?? '').trim();
      if (!Number.isFinite(tess) || tess <= 0) return;
      if (!cognome || !nome) return;
      if (seen.has(tess)) return;
      seen.add(tess);
      created.push({ numero_tessera: tess, nome, cognome });
    });

    if (created.length === 0) { this.log.warn('No soci rows found in Excel'); return; }

    const top = wb.getWorksheet('TOP 20');
    const modelliByName = new Map<string, string>();
    if (top) {
      top.eachRow({ includeEmpty: false }, (row, idx) => {
        if (idx === 1) return;
        const cognome = String(row.getCell(2).value ?? '').trim().toLowerCase();
        const nome    = String(row.getCell(3).value ?? '').trim().toLowerCase();
        const modello = String(row.getCell(4).value ?? '').trim();
        if (cognome && nome && modello) modelliByName.set(`${cognome}|${nome}`, modello);
      });
    }

    const enriched = created.map(s => ({
      ...s,
      modello_auto: modelliByName.get(`${s.cognome.toLowerCase()}|${s.nome.toLowerCase()}`) ?? null,
    }));

    await this.prisma.socio.createMany({ data: enriched, skipDuplicates: true });
    this.log.log(`Seeded ${enriched.length} soci (${enriched.filter(s => s.modello_auto).length} con modello auto)`);
  }
}
