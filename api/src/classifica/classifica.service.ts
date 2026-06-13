import { Injectable } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { aggregaRighe, PartecipazioneLite } from './aggregate.util';

export type Scope = Categoria | 'totale';

@Injectable()
export class ClassificaService {
  constructor(private prisma: PrismaService) {}

  async build(scope: Scope, anno?: number, from?: Date, to?: Date, eventoIds?: number[]) {
    const categorie: Categoria[] =
      scope === 'totale' ? ['turismo', 'pista'] : [scope];

    const dataFilter: any = {};
    if (from) dataFilter.gte = from;
    if (to) dataFilter.lte = to;

    const eventi = await this.prisma.evento.findMany({
      where: {
        categoria: { in: categorie },
        ...(anno ? { anno } : {}),
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

    const parts: PartecipazioneLite[] = partecipazioni.map(p => ({
      socio_id: p.socio_id,
      evento_key: String(p.evento_id),
      punteggio_totale: p.punteggio_totale,
      socio: {
        id: p.socio.id,
        numero_tessera: p.socio.numero_tessera,
        nome: p.socio.nome,
        cognome: p.socio.cognome,
      },
    }));

    return {
      categoria: scope,
      eventi: eventi.map(e => ({ id: String(e.id), titolo: e.titolo, data_evento: e.data_evento })),
      righe: aggregaRighe(parts),
    };
  }
}
