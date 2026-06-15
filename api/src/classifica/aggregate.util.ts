export interface SocioLite { id: number; numero_tessera: number; nome: string; cognome: string; modello_auto?: string | null; }

export interface PartecipazioneLite {
  socio_id: number;
  evento_key: string;
  punteggio_totale: number;
  socio: SocioLite;
}

export interface Riga {
  posizione: number;
  socio: SocioLite;
  totale: number;
  punti_per_evento: Record<string, number>;
}

export function aggregaRighe(parts: PartecipazioneLite[]): Riga[] {
  const bySocio = new Map<number, Omit<Riga, 'posizione'>>();
  for (const p of parts) {
    const cur = bySocio.get(p.socio_id) ?? { socio: p.socio, totale: 0, punti_per_evento: {} };
    cur.totale += p.punteggio_totale;
    cur.punti_per_evento[p.evento_key] = (cur.punti_per_evento[p.evento_key] ?? 0) + p.punteggio_totale;
    bySocio.set(p.socio_id, cur);
  }
  return [...bySocio.values()]
    .sort((a, b) => b.totale - a.totale || a.socio.cognome.localeCompare(b.socio.cognome))
    .map((r, i) => ({ posizione: i + 1, ...r }));
}
