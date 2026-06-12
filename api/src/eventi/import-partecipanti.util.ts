export interface SocioLite { id: number; nome: string; cognome: string; numero_tessera: number; }
export interface RigaFile { riga: number; testo: string; }

export interface MatchResult {
  trovati: { riga: number; testo: string; socio: SocioLite }[];
  non_trovati: { riga: number; testo: string }[];
  ambigui: { riga: number; testo: string; candidati: SocioLite[] }[];
}

const INTESTAZIONI = new Set([
  'cognome', 'nome', 'cognome nome', 'nome cognome',
  'cognome e nome', 'nome e cognome', 'partecipanti', 'partecipante', 'socio', 'soci',
]);

/** minuscole, senza accenti, virgole/punti e virgola come spazio, spazi compressi */
export function normalizza(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[,;]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Matcha le righe del file ("Cognome Nome" o "Nome Cognome", virgola opzionale)
 * contro l'anagrafica soci. Righe duplicate sullo stesso socio contano una volta.
 */
export function matchPartecipanti(righe: RigaFile[], soci: SocioLite[]): MatchResult {
  const byKey = new Map<string, SocioLite[]>();
  const add = (k: string, s: SocioLite) => {
    const arr = byKey.get(k) ?? [];
    if (!arr.some(x => x.id === s.id)) { arr.push(s); byKey.set(k, arr); }
  };
  for (const s of soci) {
    add(normalizza(`${s.cognome} ${s.nome}`), s);
    add(normalizza(`${s.nome} ${s.cognome}`), s);
  }

  const res: MatchResult = { trovati: [], non_trovati: [], ambigui: [] };
  const visti = new Set<number>();
  for (const r of righe) {
    const key = normalizza(r.testo);
    if (!key || INTESTAZIONI.has(key)) continue;
    const candidati = byKey.get(key) ?? [];
    if (candidati.length === 1) {
      const socio = candidati[0];
      if (!visti.has(socio.id)) {
        visti.add(socio.id);
        res.trovati.push({ riga: r.riga, testo: r.testo, socio });
      }
    } else if (candidati.length === 0) {
      res.non_trovati.push({ riga: r.riga, testo: r.testo });
    } else {
      res.ambigui.push({ riga: r.riga, testo: r.testo, candidati });
    }
  }
  return res;
}
