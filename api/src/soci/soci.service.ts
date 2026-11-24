import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';

@Injectable()
export class SociService {
  constructor(private prisma: PrismaService) {}

  private readonly listArgs = {
    orderBy: [{ cognome: 'asc' as const }, { nome: 'asc' as const }],
    include: { _count: { select: { partecipazioni: true } } },
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
