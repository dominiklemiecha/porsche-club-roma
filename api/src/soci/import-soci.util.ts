import { normalizza } from '../eventi/import-partecipanti.util';

/** Riga dell'elenco soci letta dal file. numero_tessera null = mancante/non valida. */
export interface RigaSocio { riga: number; cognome: string; nome: string; numero_tessera: number | null; }

export interface SocioDb {
  id: number; numero_tessera: number; nome: string; cognome: string;
  disattivato_il: Date | null; partecipazioni: number;
}

export interface Piano {
  righe: RigaSocio[];
  invariati: number;
  nuovi: RigaSocio[];
  rinumerati: { id: number; cognome: string; nome: string; da: number; a: number }[];
  riattivati: { id: number; cognome: string; nome: string; numero_tessera: number }[];
  /** azione: 'disattiva' se ha partecipazioni (resta nello storico), altrimenti 'elimina' */
  rimossi: { id: number; cognome: string; nome: string; numero_tessera: number; partecipazioni: number; azione: 'disattiva' | 'elimina' }[];
  errori: string[];
  /** segnalazioni non bloccanti */
  avvisi: string[];
  /** tessere dei soci gia' in anagrafica che restano attivi: un nuovo socio non puo' usarle */
  tessere_occupate: number[];
}

const chiave = (cognome: string, nome: string) => normalizza(`${cognome} ${nome}`);

function tessera(v: string): number | null {
  const t = v.replace(/\s/g, '');
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n > 0 && n <= 2_147_483_647 ? n : null;
}

/**
 * Individua l'intestazione (colonne Cognome, Nome, Tessera) nelle prime 15 righe
 * e restituisce le righe dati. null se l'intestazione non viene trovata.
 */
export function estraiElencoSoci(matrice: string[][]): RigaSocio[] | null {
  for (let h = 0; h < Math.min(matrice.length, 15); h++) {
    const head = (matrice[h] ?? []).map(c => normalizza(c ?? ''));
    const iCognome = head.findIndex(c => c === 'cognome');
    const iNome = head.findIndex(c => c === 'nome');
    const iTessera = head.findIndex(c => c.includes('tessera'));
    if (iCognome < 0 || iNome < 0 || iTessera < 0) continue;

    const out: RigaSocio[] = [];
    for (let r = h + 1; r < matrice.length; r++) {
      const row = matrice[r] ?? [];
      const cognome = (row[iCognome] ?? '').trim().replace(/\s+/g, ' ');
      const nome = (row[iNome] ?? '').trim().replace(/\s+/g, ' ');
      if (!cognome && !nome) continue;
      out.push({ riga: r + 1, cognome, nome, numero_tessera: tessera(row[iTessera] ?? '') });
    }
    return out;
  }
  return null;
}

/**
 * Tessere dei nuovi soci non utilizzabili: gia' di un socio che resta attivo o ripetute
 * tra i nuovi. Restituisce i messaggi di errore (vuoto = ok).
 */
export function conflittiTessereNuovi(nuovi: RigaSocio[], occupate: number[]): string[] {
  const occ = new Set(occupate);
  const visti = new Map<number, string>();
  const out: string[] = [];
  for (const n of nuovi) {
    const chi = `${n.cognome} ${n.nome}`;
    if (n.numero_tessera == null) { out.push(`Numero tessera mancante per ${chi}`); continue; }
    if (occ.has(n.numero_tessera)) out.push(`Tessera ${n.numero_tessera} di ${chi} è già di un altro socio`);
    else if (visti.has(n.numero_tessera)) out.push(`Tessera ${n.numero_tessera} ripetuta: ${visti.get(n.numero_tessera)}, ${chi}`);
    else visti.set(n.numero_tessera, chi);
  }
  return out;
}

/**
 * Confronta l'elenco del file con l'anagrafica e calcola cosa cambia (nessuna scrittura).
 * Abbinamento in due passate: prima stessa tessera + stesso nome, poi solo stesso nome
 * (tessera rinumerata o socio disattivato che rientra). I soci attivi non abbinati escono.
 * Se la tessera del file per un socio abbinato solo per nome e' gia' di un altro socio
 * abbinato esattamente, si conserva la tessera attuale e si segnala un avviso.
 */
export function pianificaImport(righe: RigaSocio[], soci: SocioDb[]): Piano {
  const piano: Piano = {
    righe, invariati: 0, nuovi: [], rinumerati: [], riattivati: [], rimossi: [], errori: [], avvisi: [], tessere_occupate: [],
  };
  const usati = new Set<number>();
  const finali = new Map<number, string[]>(); // tessera -> soci esistenti che restano attivi
  const segnaTessera = (t: number, chi: string) => finali.set(t, [...(finali.get(t) ?? []), chi]);
  const etichetta = (r: RigaSocio) => `${r.cognome} ${r.nome}`.trim();

  const valide = righe.filter(r => {
    if (r.cognome && r.nome) return true;
    piano.errori.push(`Riga ${r.riga}: cognome o nome mancante (${etichetta(r) || 'vuota'})`);
    return false;
  });
  const liberi = (r: RigaSocio) => soci.filter(s => !usati.has(s.id) && chiave(s.cognome, s.nome) === chiave(r.cognome, r.nome));

  // 1a passata: stessa tessera + stesso nome
  const esatti = new Map<RigaSocio, SocioDb>();
  for (const r of valide) {
    if (r.numero_tessera == null) continue;
    const socio = liberi(r).find(s => s.numero_tessera === r.numero_tessera);
    if (socio) { usati.add(socio.id); esatti.set(r, socio); }
  }
  const tessereEsatte = new Set([...esatti.values()].map(s => s.numero_tessera));

  // 2a passata: solo stesso nome
  const abbinati: [RigaSocio, SocioDb][] = [];
  for (const r of valide) {
    const es = esatti.get(r);
    if (es) { abbinati.push([r, es]); continue; }
    const lib = liberi(r);
    const attivi = lib.filter(s => !s.disattivato_il);
    const candidati = attivi.length > 0 ? attivi : lib;
    if (candidati.length > 1) {
      piano.errori.push(`Riga ${r.riga}: ${etichetta(r)} corrisponde a più soci in anagrafica (${candidati.map(c => `#${c.numero_tessera}`).join(', ')})`);
      continue;
    }
    if (candidati.length === 0) { piano.nuovi.push(r); continue; }
    usati.add(candidati[0].id);
    abbinati.push([r, candidati[0]]);
  }

  for (const [r, socio] of abbinati) {
    let t = r.numero_tessera ?? socio.numero_tessera;
    if (t !== socio.numero_tessera && tessereEsatte.has(t)) {
      piano.avvisi.push(`Riga ${r.riga}: tessera ${t} di ${etichetta(r)} è già di un altro socio, resta la tessera attuale #${socio.numero_tessera}`);
      t = socio.numero_tessera;
    }
    segnaTessera(t, etichetta(r));
    if (socio.disattivato_il) {
      piano.riattivati.push({ id: socio.id, cognome: socio.cognome, nome: socio.nome, numero_tessera: t });
    } else if (t !== socio.numero_tessera) {
      piano.rinumerati.push({ id: socio.id, cognome: socio.cognome, nome: socio.nome, da: socio.numero_tessera, a: t });
    } else {
      piano.invariati++;
    }
  }

  for (const s of soci) {
    if (s.disattivato_il || usati.has(s.id)) continue;
    piano.rimossi.push({
      id: s.id, cognome: s.cognome, nome: s.nome, numero_tessera: s.numero_tessera,
      partecipazioni: s.partecipazioni, azione: s.partecipazioni > 0 ? 'disattiva' : 'elimina',
    });
  }

  for (const [t, nomi] of finali) {
    if (nomi.length > 1) piano.errori.push(`Tessera ${t} assegnata a più soci: ${nomi.join(', ')}`);
  }
  piano.tessere_occupate = [...finali.keys()].sort((a, b) => a - b);
  piano.rimossi.sort((a, b) => a.cognome.localeCompare(b.cognome));
  return piano;
}
