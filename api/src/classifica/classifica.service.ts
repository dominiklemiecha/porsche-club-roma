import { Injectable } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassificaService {
  constructor(private prisma: PrismaService) {}

  async build(categoria: Categoria, from?: Date, to?: Date, eventoIds?: number[]) {
    const dataFilter: any = {};
    if (from) dataFilter.gte = from;
    if (to) dataFilter.lte = to;
    const eventi = await this.prisma.evento.findMany({
      where: {
        categoria,
        ...(from || to ? { data_evento: dataFilter } : {}),
        ...(eventoIds && eventoIds.length > 0 ? { id: { in: eventoIds } } : {}),
      },
      orderBy: { data_evento: 'asc' },
      select: { id: true, titolo: true, data_evento: true },
    });
    const ids = eventi.map(e => e.id);

    const partecipazioni = ids.length
      ? await this.prisma.partecipazione.findMany({
          where: { evento_id: { in: ids } },
          include: { socio: true },
        })
      : [];

    const bySocio = new Map<number, {
      socio: { id: number; numero_tessera: number; nome: string; cognome: string };
      totale: number;
      punti_per_evento: Record<string, number>;
    }>();

    for (const p of partecipazioni) {
      const cur = bySocio.get(p.socio_id) ?? {
        socio: {
          id: p.socio.id,
          numero_tessera: p.socio.numero_tessera,
          nome: p.socio.nome,
          cognome: p.socio.cognome,
        },
        totale: 0,
        punti_per_evento: {},
      };
      cur.totale += p.punteggio_totale;
      cur.punti_per_evento[String(p.evento_id)] = p.punteggio_totale;
      bySocio.set(p.socio_id, cur);
    }

    const righe = [...bySocio.values()]
      .sort((a, b) => b.totale - a.totale || a.socio.cognome.localeCompare(b.socio.cognome))
      .map((r, i) => ({ posizione: i + 1, ...r }));

    return { categoria, eventi, righe };
  }
}
