import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificaService } from '../classifica/classifica.service';
import { AnniService } from '../anni/anni.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private classifica: ClassificaService,
    private anni: AnniService,
  ) {}

  async get(annoParam?: number) {
    const anno = annoParam ?? (await this.anni.getActiveYear());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sociCount, eventiCount, puntiAgg, totale] = await Promise.all([
      this.prisma.socio.count(),
      this.prisma.evento.count({ where: { anno } }),
      this.prisma.partecipazione.aggregate({
        _sum: { punteggio_totale: true },
        where: { evento: { anno } },
      }),
      this.classifica.build('totale', anno),
    ]);

    // Podio (top 7) con modello auto del socio per la sagoma
    const topRows = totale.righe.slice(0, 7);
    const ids = topRows.map(r => r.socio.id);
    const modelli = ids.length
      ? await this.prisma.socio.findMany({ where: { id: { in: ids } }, select: { id: true, modello_auto: true } })
      : [];
    const modelloById = new Map(modelli.map(m => [m.id, m.modello_auto]));
    const podio = topRows.map(r => ({
      posizione: r.posizione,
      nome: r.socio.nome,
      cognome: r.socio.cognome,
      numero_tessera: r.socio.numero_tessera,
      modello_auto: modelloById.get(r.socio.id) ?? null,
      punti: r.totale,
    }));

    const mapEvento = (e: any) => ({
      id: e.id,
      titolo: e.titolo,
      data_evento: e.data_evento,
      data_fine: e.data_fine,
      categoria: e.categoria,
      immagine: e.immagine,
      base: e.punteggio_base,
      partecipanti: e._count?.partecipazioni ?? 0,
    });

    const prossimiRaw = await this.prisma.evento.findMany({
      where: { anno, data_evento: { gte: today } },
      orderBy: { data_evento: 'asc' },
      take: 4,
      include: { _count: { select: { partecipazioni: true } } },
    });

    const ultimoRaw =
      (await this.prisma.evento.findFirst({
        where: { anno, data_evento: { lte: today } },
        orderBy: { data_evento: 'desc' },
        include: { _count: { select: { partecipazioni: true } } },
      })) ??
      (await this.prisma.evento.findFirst({
        where: { anno },
        orderBy: { data_evento: 'desc' },
        include: { _count: { select: { partecipazioni: true } } },
      }));

    return {
      anno,
      stats: {
        soci: sociCount,
        eventi: eventiCount,
        puntiAssegnati: puntiAgg._sum.punteggio_totale ?? 0,
        leader: podio[0] ? { nome: podio[0].nome, cognome: podio[0].cognome, punti: podio[0].punti } : null,
      },
      podio,
      prossimiEventi: prossimiRaw.map(mapEvento),
      ultimoEvento: ultimoRaw ? mapEvento(ultimoRaw) : null,
    };
  }
}
