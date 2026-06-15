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

  list(q?: string) {
    if (!q) {
      return this.prisma.socio.findMany(this.listArgs);
    }
    const tessera = Number.isFinite(+q) ? +q : undefined;
    const or: any[] = [
      { cognome: { contains: q, mode: 'insensitive' } },
      { nome:    { contains: q, mode: 'insensitive' } },
    ];
    if (tessera !== undefined) or.push({ numero_tessera: tessera });
    return this.prisma.socio.findMany({ where: { OR: or }, ...this.listArgs });
  }

  async create(dto: CreateSocioDto) {
    try {
      return await this.prisma.socio.create({ data: dto });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('numero_tessera già esistente');
      throw e;
    }
  }

  async update(id: number, dto: UpdateSocioDto) {
    const s = await this.prisma.socio.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    try {
      return await this.prisma.socio.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('numero_tessera già esistente');
      throw e;
    }
  }

  async remove(id: number) {
    const count = await this.prisma.partecipazione.count({ where: { socio_id: id } });
    if (count > 0) throw new ConflictException('Socio ha partecipazioni, impossibile eliminare');
    await this.prisma.socio.delete({ where: { id } });
    return { ok: true };
  }
}
