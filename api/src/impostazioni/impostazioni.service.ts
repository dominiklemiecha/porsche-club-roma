import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImpostazioniService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const rows = await this.prisma.setting.findMany();
    const map = Object.fromEntries(rows.map(r => [r.chiave, r.valore]));
    return { hero_immagine: map['hero_immagine'] ?? null };
  }

  async setHero(path: string) {
    await this.prisma.setting.upsert({
      where: { chiave: 'hero_immagine' },
      update: { valore: path },
      create: { chiave: 'hero_immagine', valore: path },
    });
    return { hero_immagine: path };
  }
}
