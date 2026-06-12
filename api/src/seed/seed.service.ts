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
    const ws = wb.worksheets[0];
    if (!ws) { this.log.warn('No sheet found in seed file'); return; }

    // Columns: A=N., B=Cognome, C=Nome, D=Tessera, E=Modello auto, F=Versione, G=Anno. Header on row 1, data from row 2.
    const created: { numero_tessera: number; nome: string; cognome: string; modello_auto: string | null }[] = [];
    const seen = new Set<number>();
    let skippedNoTessera = 0;

    ws.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx < 2) return;
      const cognome  = String(row.getCell(2).value ?? '').trim();
      const nome     = String(row.getCell(3).value ?? '').trim();
      const tessRaw  = row.getCell(4).value;
      const tess     = Number(tessRaw);
      const modello  = String(row.getCell(5).value ?? '').trim();
      const versione = String(row.getCell(6).value ?? '').trim();
      const anno     = String(row.getCell(7).value ?? '').trim();
      if (!cognome || !nome) return;
      if (!Number.isFinite(tess) || tess <= 0) { skippedNoTessera++; return; }
      if (seen.has(tess)) return;
      seen.add(tess);
      const auto = [modello, versione].filter(Boolean).join(' ') + (anno ? ` (${anno})` : '');
      created.push({ numero_tessera: tess, nome, cognome, modello_auto: auto.trim() || null });
    });

    if (created.length === 0) { this.log.warn('No soci rows found in Excel'); return; }

    await this.prisma.socio.createMany({ data: created, skipDuplicates: true });
    this.log.log(`Seeded ${created.length} soci (${skippedNoTessera} skipped: no tessera)`);
  }
}
