import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventiService {
  constructor(private prisma: PrismaService) {}

  list(categoria?: Categoria) {
    return this.prisma.evento.findMany({
      where: categoria ? { categoria } : undefined,
      orderBy: { data_evento: 'desc' },
      include: { _count: { select: { partecipazioni: true } } },
    });
  }

  async get(id: number) {
    const e = await this.prisma.evento.findUnique({
      where: { id },
      include: { partecipazioni: { include: { socio: true }, orderBy: { punteggio_totale: 'desc' } } },
    });
    if (!e) throw new NotFoundException();
    return e;
  }

  create(dto: CreateEventoDto) {
    if (dto.prova_abilita && (!dto.scala_prova || dto.scala_prova.length === 0)) {
      throw new BadRequestException('scala_prova richiesta quando prova_abilita=true');
    }
    if (!dto.prova_abilita && dto.scala_prova) {
      throw new BadRequestException('scala_prova non valida senza prova_abilita');
    }
    return this.prisma.evento.create({
      data: {
        titolo: dto.titolo,
        data_evento: new Date(dto.data_evento),
        categoria: dto.categoria,
        punteggio_base: dto.punteggio_base,
        prova_abilita: dto.prova_abilita,
        scala_prova: dto.prova_abilita ? (dto.scala_prova as any) : null,
      },
    });
  }

  async update(id: number, dto: UpdateEventoDto) {
    const ex = await this.prisma.evento.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException();
    return this.prisma.evento.update({
      where: { id },
      data: {
        ...dto,
        data_evento: dto.data_evento ? new Date(dto.data_evento) : undefined,
        scala_prova: dto.scala_prova as any,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.evento.delete({ where: { id } });
    return { ok: true };
  }
}
