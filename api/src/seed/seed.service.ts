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
    await this.prisma.socio.createMany({ data: created, skipDuplicates: true });
    this.log.log(`Seeded ${created.length} soci`);
  }
}
