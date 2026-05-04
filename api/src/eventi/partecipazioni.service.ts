import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calcolaPunteggio } from './score.util';
import { SetPartecipantiDto } from './dto/partecipanti.dto';

@Injectable()
export class PartecipazioniService {
  constructor(private prisma: PrismaService) {}

  async setForEvento(evento_id: number, dto: SetPartecipantiDto) {
    const ev = await this.prisma.evento.findUnique({ where: { id: evento_id } });
    if (!ev) throw new NotFoundException('evento');

    const scala = (ev.scala_prova as number[] | null) ?? null;
    const seenSoci = new Set<number>();
    const seenPos  = new Set<number>();
    for (const p of dto.partecipanti) {
      if (seenSoci.has(p.socio_id)) throw new BadRequestException('socio duplicato');
      seenSoci.add(p.socio_id);
      if (p.posizione_prova !== undefined && p.posizione_prova !== null) {
        if (!ev.prova_abilita) throw new BadRequestException('posizione_prova non ammessa');
        if (seenPos.has(p.posizione_prova)) throw new BadRequestException('posizione duplicata');
        seenPos.add(p.posizione_prova);
      }
    }

    const rows = dto.partecipanti.map(p => ({
      evento_id,
      socio_id: p.socio_id,
      posizione_prova: p.posizione_prova ?? null,
      punteggio_totale: calcolaPunteggio({
        punteggio_base: ev.punteggio_base,
        prova_abilita: ev.prova_abilita,
        scala_prova: scala,
        posizione_prova: p.posizione_prova ?? null,
      }),
    }));

    await this.prisma.$transaction([
      this.prisma.partecipazione.deleteMany({ where: { evento_id } }),
      ...rows.map(r => this.prisma.partecipazione.create({ data: r })),
    ]);

    return { count: rows.length };
  }
}
