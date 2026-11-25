import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';
import { AliasItem } from './dto/import-soci.dto';
import { chiaveNome } from '../eventi/import-partecipanti.util';

@Injectable()
export class SociService {
  constructor(private prisma: PrismaService) {}

  private readonly listArgs = {
    orderBy: [{ cognome: 'asc' as const }, { nome: 'asc' as const }],
    include: {
      _count: { select: { partecipazioni: true } },
      alias: { select: { id: true, testo: true }, orderBy: { created_at: 'asc' as const } },
    },
  };

  /** Solo soci attivi: i disattivati restano visibili nello storico eventi e in classifica. */
  list(q?: string) {
    if (!q) {
      return this.prisma.socio.findMany({ where: { disattivato_il: null }, ...this.listArgs });
    }
    const tessera = Number.isFinite(+q) ? +q : undefined;
    const or: any[] = [
      { cognome: { contains: q, mode: 'insensitive' } },
      { nome:    { contains: q, mode: 'insensitive' } },
    ];
    if (tessera !== undefined) or.push({ numero_tessera: tessera });
    return this.prisma.socio.findMany({ where: { disattivato_il: null, OR: or }, ...this.listArgs });
  }

  /** La tessera deve essere univoca tra i soci attivi (i disattivati conservano quella storica). */
  private async assertTesseraLibera(numero_tessera: number, escludiId?: number) {
    const dup = await this.prisma.socio.findFirst({
      where: { numero_tessera, disattivato_il: null, ...(escludiId ? { id: { not: escludiId } } : {}) },
    });
    if (dup) throw new ConflictException('numero_tessera già esistente');
  }

  async create(dto: CreateSocioDto) {
    await this.assertTesseraLibera(dto.numero_tessera);
    return this.prisma.socio.create({ data: dto });
  }

  async update(id: number, dto: UpdateSocioDto) {
    const s = await this.prisma.socio.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    if (dto.numero_tessera !== undefined && !s.disattivato_il) await this.assertTesseraLibera(dto.numero_tessera, id);
    return this.prisma.socio.update({ where: { id }, data: dto });
  }

  /**
   * Ricorda varianti del nome (es. nome come scritto nel file d'iscrizione).
   * Ignora quelle uguali al nome in anagrafica (in entrambi gli ordini) o gia' presenti.
   */
  async aggiungiAlias(items: AliasItem[]) {
    const ids = [...new Set(items.map(i => i.socio_id))];
    const soci = await this.prisma.socio.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true, cognome: true } });
    const byId = new Map(soci.map(s => [s.id, s]));
    const data = items.flatMap(i => {
      const s = byId.get(i.socio_id);
      const testo = i.testo.trim().replace(/\s+/g, ' ');
      const chiave = chiaveNome(testo);
      if (!s || !chiave) return [];
      if (chiave === chiaveNome(`${s.cognome} ${s.nome}`) || chiave === chiaveNome(`${s.nome} ${s.cognome}`)) return [];
      return [{ socio_id: s.id, testo, chiave }];
    });
    if (data.length) await this.prisma.socioAlias.createMany({ data, skipDuplicates: true });
    return { aggiunti: data.length };
  }

  async eliminaAlias(id: number) {
    await this.prisma.socioAlias.deleteMany({ where: { id } });
    return { ok: true };
  }

  /** Con partecipazioni il socio viene disattivato (resta nello storico), altrimenti cancellato. */
  async remove(id: number) {
    const s = await this.prisma.socio.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    const count = await this.prisma.partecipazione.count({ where: { socio_id: id } });
    if (count > 0) {
      await this.prisma.socio.update({ where: { id }, data: { disattivato_il: new Date() } });
      return { ok: true, disattivato: true };
    }
    await this.prisma.socio.delete({ where: { id } });
    return { ok: true, disattivato: false };
  }
}
