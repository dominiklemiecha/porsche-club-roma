import { ForbiddenException, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnniService implements OnApplicationBootstrap {
  private readonly log = new Logger('Anni');
  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    // 1. Backfill anno sugli eventi esistenti (default 0)
    await this.prisma.$executeRawUnsafe(
      `UPDATE "eventi" SET "anno" = EXTRACT(YEAR FROM "data_evento")::int WHERE "anno" = 0`,
    );
    // 2. Popola la tabella anni con gli anni distinti degli eventi
    const rows = await this.prisma.$queryRawUnsafe<{ anno: number }[]>(
      `SELECT DISTINCT "anno" FROM "eventi" WHERE "anno" > 0 ORDER BY "anno"`,
    );
    for (const r of rows) {
      await this.prisma.anno.upsert({
        where: { anno: r.anno },
        update: {},
        create: { anno: r.anno, attivo: false },
      });
    }
    // 3. Garantisci un anno attivo
    const attivi = await this.prisma.anno.count({ where: { attivo: true } });
    if (attivi === 0) {
      const max = await this.prisma.anno.findFirst({ orderBy: { anno: 'desc' } });
      const target = max?.anno ?? new Date().getFullYear();
      await this.prisma.anno.upsert({
        where: { anno: target },
        update: { attivo: true },
        create: { anno: target, attivo: true },
      });
      this.log.log(`Anno attivo impostato: ${target}`);
    }
  }

  list() {
    return this.prisma.anno.findMany({ orderBy: { anno: 'desc' } });
  }

  async getActiveYear(): Promise<number> {
    const a = await this.prisma.anno.findFirst({ where: { attivo: true } });
    if (a) return a.anno;
    const max = await this.prisma.anno.findFirst({ orderBy: { anno: 'desc' } });
    return max?.anno ?? new Date().getFullYear();
  }

  async create(anno: number) {
    await this.prisma.$transaction([
      this.prisma.anno.updateMany({ data: { attivo: false } }),
      this.prisma.anno.upsert({
        where: { anno },
        update: { attivo: true },
        create: { anno, attivo: true },
      }),
    ]);
    return this.prisma.anno.findUnique({ where: { anno } });
  }

  async attiva(anno: number) {
    await this.prisma.$transaction([
      this.prisma.anno.updateMany({ data: { attivo: false } }),
      this.prisma.anno.upsert({
        where: { anno },
        update: { attivo: true },
        create: { anno, attivo: true },
      }),
    ]);
    return this.prisma.anno.findUnique({ where: { anno } });
  }

  async assertAttivo(anno: number) {
    const a = await this.prisma.anno.findUnique({ where: { anno } });
    if (!a || !a.attivo) {
      throw new ForbiddenException(`Anno ${anno} in sola lettura (storico). Riattivalo per modificare.`);
    }
  }
}
