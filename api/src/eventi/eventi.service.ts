import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnniService } from '../anni/anni.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { calcolaPunteggio } from './score.util';

@Injectable()
export class EventiService {
  constructor(private prisma: PrismaService, private anni: AnniService) {}

  list(anno?: number, categoria?: Categoria) {
    return this.prisma.evento.findMany({
      where: {
        ...(anno ? { anno } : {}),
        ...(categoria ? { categoria } : {}),
      },
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

  private validateScala(prova: boolean, scala?: number[] | null) {
    if (prova && (!scala || scala.length === 0)) {
      throw new BadRequestException('scala_prova richiesta quando prova_abilita=true');
    }
    if (!prova && scala && scala.length > 0) {
      throw new BadRequestException('scala_prova non valida senza prova_abilita');
    }
  }

  private validateDate(inizio: string, fine?: string) {
    if (fine && new Date(fine) < new Date(inizio)) {
      throw new BadRequestException('data_fine deve essere >= data_evento');
    }
  }

  async create(dto: CreateEventoDto) {
    this.validateScala(dto.prova_abilita, dto.scala_prova);
    this.validateDate(dto.data_evento, dto.data_fine);
    const anno = dto.anno ?? (await this.anni.getActiveYear());
    await this.anni.assertAttivo(anno);
    return this.prisma.evento.create({
      data: {
        titolo: dto.titolo,
        anno,
        data_evento: new Date(dto.data_evento),
        data_fine: dto.data_fine ? new Date(dto.data_fine) : null,
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
    await this.anni.assertAttivo(dto.anno ?? ex.anno);

    const newProvaAbilita = dto.prova_abilita ?? ex.prova_abilita;
    const newScalaProva = dto.scala_prova !== undefined ? dto.scala_prova : (ex.scala_prova as number[] | null);
    this.validateScala(newProvaAbilita, newScalaProva);

    const newInizio = dto.data_evento ?? ex.data_evento.toISOString().slice(0, 10);
    const newFine = dto.data_fine !== undefined
      ? dto.data_fine
      : (ex.data_fine ? ex.data_fine.toISOString().slice(0, 10) : undefined);
    this.validateDate(newInizio, newFine ?? undefined);

    const updated = await this.prisma.evento.update({
      where: { id },
      data: {
        ...dto,
        data_evento: dto.data_evento ? new Date(dto.data_evento) : undefined,
        data_fine: dto.data_fine !== undefined ? (dto.data_fine ? new Date(dto.data_fine) : null) : undefined,
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
    const ex = await this.prisma.evento.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException();
    await this.anni.assertAttivo(ex.anno);
    await this.prisma.evento.delete({ where: { id } });
    return { ok: true };
  }
}
