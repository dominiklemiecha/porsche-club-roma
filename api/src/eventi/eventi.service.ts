import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { calcolaPunteggio } from './score.util';

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

    const newProvaAbilita = dto.prova_abilita ?? ex.prova_abilita;
    const newScalaProva = dto.scala_prova !== undefined ? dto.scala_prova : (ex.scala_prova as number[] | null);
    if (newProvaAbilita && (!newScalaProva || newScalaProva.length === 0)) {
      throw new BadRequestException('scala_prova richiesta quando prova_abilita=true');
    }
    if (!newProvaAbilita && dto.scala_prova && dto.scala_prova.length > 0) {
      throw new BadRequestException('scala_prova non valida senza prova_abilita');
    }

    const updated = await this.prisma.evento.update({
      where: { id },
      data: {
        ...dto,
        data_evento: dto.data_evento ? new Date(dto.data_evento) : undefined,
        scala_prova: dto.scala_prova !== undefined
          ? (newProvaAbilita ? (dto.scala_prova as any) : null)
          : undefined,
      },
    });

    const scoringChanged =
      dto.punteggio_base !== undefined ||
      dto.prova_abilita !== undefined ||
      dto.scala_prova !== undefined;

    if (scoringChanged) {
      const parts = await this.prisma.partecipazione.findMany({ where: { evento_id: id } });
      const scala = (updated.scala_prova as number[] | null) ?? null;
      await this.prisma.$transaction(parts.map(p => {
        const posizione = updated.prova_abilita ? p.posizione_prova : null;
        const punteggio = calcolaPunteggio({
          punteggio_base: updated.punteggio_base,
          prova_abilita: updated.prova_abilita,
          scala_prova: scala,
          posizione_prova: posizione,
        });
        return this.prisma.partecipazione.update({
          where: { id: p.id },
          data: { posizione_prova: posizione, punteggio_totale: punteggio },
        });
      }));
    }

    return updated;
  }

  async remove(id: number) {
    await this.prisma.evento.delete({ where: { id } });
    return { ok: true };
  }
}
