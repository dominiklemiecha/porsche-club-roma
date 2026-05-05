import { Injectable } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type Scope = Categoria | 'generale';

interface SocioRow {
  socio: { id: number; numero_tessera: number; nome: string; cognome: string };
  totale: number;
  punti_per_evento: Record<string, number>;
}

@Injectable()
export class ClassificaService {
  constructor(private prisma: PrismaService) {}

  async build(scope: Scope, from?: Date, to?: Date, eventoIds?: number[]) {
    if (scope === 'generale') return this.buildGenerale(from, to, eventoIds);
    return this.buildSingleCategory(scope, from, to, eventoIds);
  }

  private async buildSingleCategory(categoria: Categoria, from?: Date, to?: Date, eventoIds?: number[]) {
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

    const bySocio = new Map<number, SocioRow>();
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

    return { categoria, eventi: eventi.map(e => ({ id: String(e.id), titolo: e.titolo, data_evento: e.data_evento })), righe };
  }

  private async buildGenerale(from?: Date, to?: Date, eventoIds?: number[]) {
    const dataFilter: any = {};
    if (from) dataFilter.gte = from;
    if (to) dataFilter.lte = to;
    const eventi = await this.prisma.evento.findMany({
      where: {
        ...(from || to ? { data_evento: dataFilter } : {}),
        ...(eventoIds && eventoIds.length > 0 ? { id: { in: eventoIds } } : {}),
      },
      orderBy: { data_evento: 'asc' },
      select: { id: true, titolo: true, data_evento: true, categoria: true },
    });

    // Group events by normalized titolo
    const groups = new Map<string, { titolo: string; data_evento: Date; ids: number[] }>();
    for (const e of eventi) {
      const key = e.titolo.trim().toLowerCase();
      const g = groups.get(key);
      if (g) {
        g.ids.push(e.id);
        if (e.data_evento < g.data_evento) g.data_evento = e.data_evento;
      } else {
        groups.set(key, { titolo: e.titolo, data_evento: e.data_evento, ids: [e.id] });
      }
    }

    const eventiOut = [...groups.entries()]
      .map(([key, g]) => ({ id: key, titolo: g.titolo, data_evento: g.data_evento }))
      .sort((a, b) => a.data_evento.getTime() - b.data_evento.getTime());

    const evIdToKey = new Map<number, string>();
    for (const e of eventi) evIdToKey.set(e.id, e.titolo.trim().toLowerCase());

    const allIds = eventi.map(e => e.id);
    const partecipazioni = allIds.length
      ? await this.prisma.partecipazione.findMany({
          where: { evento_id: { in: allIds } },
          include: { socio: true },
        })
      : [];

    const bySocio = new Map<number, SocioRow>();
    for (const p of partecipazioni) {
      const key = evIdToKey.get(p.evento_id)!;
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
      cur.punti_per_evento[key] = (cur.punti_per_evento[key] ?? 0) + p.punteggio_totale;
      bySocio.set(p.socio_id, cur);
    }

    const righe = [...bySocio.values()]
      .sort((a, b) => b.totale - a.totale || a.socio.cognome.localeCompare(b.socio.cognome))
      .map((r, i) => ({ posizione: i + 1, ...r }));

    return { categoria: 'generale' as const, eventi: eventiOut, righe };
  }
}
