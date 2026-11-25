import { chiaveNome, normalizza } from '../eventi/import-partecipanti.util';

/** Riga dell'elenco soci letta dal file. numero_tessera null = mancante/non valida. */
export interface RigaSocio { riga: number; cognome: string; nome: string; numero_tessera: number | null; }

export interface SocioDb {
  id: number; numero_tessera: number; nome: string; cognome: string;
  disattivato_il: Date | null; partecipazioni: number;
  /** chiavi (chiaveNome) delle varianti del nome ricordate */
  alias: string[];
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
  /** stessa tessera ma nome scritto diversamente: si puo' ricordare come variante */
  nomi_diversi: { socio_id: number; riga: number; file: string; anagrafica: string }[];
  /** segnalazioni non bloccanti */
  avvisi: string[];
  /** tessere dei soci gia' in anagrafica che restano attivi: un nuovo socio non puo' usarle */
  tessere_occupate: number[];
}

/** Nome "lasco": senza accenti, spazi, apostrofi e trattini ("Gian Luca" = "Gianluca"). */
const chiave = (cognome: string, nome: string) => chiaveNome(`${cognome} ${nome}`);

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
 * La chiave e' il NUMERO TESSERA: un socio attivo con la stessa tessera e' lo stesso socio,
 * anche se nome/cognome sono scritti diversamente (si conserva il nome in anagrafica).
 * Il nome serve solo per: scegliere tra righe con tessera ripetuta nel file, riattivare un
 * socio disattivato, abbinare righe senza tessera utilizzabile. I soci attivi non abbinati escono.
 */
export function pianificaImport(righe: RigaSocio[], soci: SocioDb[]): Piano {
  const piano: Piano = {
    righe, invariati: 0, nuovi: [], rinumerati: [], riattivati: [], rimossi: [], errori: [], nomi_diversi: [], avvisi: [], tessere_occupate: [],
  };
  const usati = new Set<number>();
  const etichetta = (r: { cognome: string; nome: string }) => `${r.cognome} ${r.nome}`.trim();
  // stesso nome: in entrambi gli ordini o tra le varianti ricordate
  const stessoNome = (r: RigaSocio, s: SocioDb) => {
    const k = chiave(r.cognome, r.nome);
    return k === chiave(s.cognome, s.nome) || k === chiave(s.nome, s.cognome) || s.alias.includes(k);
  };
  const attivi = soci.filter(s => !s.disattivato_il);
  const disattivi = soci.filter(s => s.disattivato_il);

  const valide = righe.filter(r => {
    if (r.cognome && r.nome) return true;
    piano.errori.push(`Riga ${r.riga}: cognome o nome mancante (${etichetta(r) || 'vuota'})`);
    return false;
  });

  const abbinati: { r: RigaSocio; socio: SocioDb; tessera: number }[] = [];
  const daRisolvere: RigaSocio[] = [];
  const abbina = (r: RigaSocio, socio: SocioDb, tessera = socio.numero_tessera) => {
    usati.add(socio.id); abbinati.push({ r, socio, tessera });
  };

  // 1. per tessera
  const perTessera = new Map<number, RigaSocio[]>();
  for (const r of valide) {
    if (r.numero_tessera == null) { daRisolvere.push(r); continue; }
    perTessera.set(r.numero_tessera, [...(perTessera.get(r.numero_tessera) ?? []), r]);
  }
  for (const [t, gruppo] of perTessera) {
    const socio = attivi.find(s => s.numero_tessera === t && !usati.has(s.id));
    if (socio) {
      // tessera ripetuta nel file: la tiene la riga con il nome del socio in anagrafica
      const scelta = gruppo.length === 1 ? gruppo[0] : gruppo.find(r => stessoNome(r, socio));
      if (!scelta) {
        piano.errori.push(`Tessera ${t} ripetuta nel file (${gruppo.map(etichetta).join(', ')}) e nessuna riga corrisponde a ${etichetta(socio)}`);
        continue;
      }
      if (!stessoNome(scelta, socio)) {
        piano.nomi_diversi.push({ socio_id: socio.id, riga: scelta.riga, file: etichetta(scelta), anagrafica: etichetta(socio) });
      }
      abbina(scelta, socio);
      daRisolvere.push(...gruppo.filter(r => r !== scelta));
      continue;
    }
    // nessun attivo con questa tessera: socio disattivato che rientra (stessa tessera e stesso nome)
    for (const r of gruppo) {
      const vecchio = disattivi.find(s => s.numero_tessera === t && !usati.has(s.id) && stessoNome(r, s));
      if (vecchio) abbina(r, vecchio);
      else daRisolvere.push(r);
    }
  }

  // 2. righe senza tessera utilizzabile o con tessera non in anagrafica
  for (const r of daRisolvere.sort((a, b) => a.riga - b.riga)) {
    const ripetuta = r.numero_tessera != null && (perTessera.get(r.numero_tessera)?.length ?? 0) > 1;
    const omonimi = attivi.filter(s => !usati.has(s.id) && stessoNome(r, s));
    if (r.numero_tessera == null || ripetuta) {
      // senza tessera valida si abbina per nome, mantenendo la tessera in anagrafica
      if (omonimi.length === 1) {
        abbina(r, omonimi[0]);
        if (ripetuta) piano.avvisi.push(`Riga ${r.riga}: tessera ${r.numero_tessera} di ${etichetta(r)} è già di un altro socio, resta la tessera attuale #${omonimi[0].numero_tessera}`);
        continue;
      }
      if (omonimi.length > 1) {
        piano.errori.push(`Riga ${r.riga}: ${etichetta(r)} senza tessera valida e con più omonimi in anagrafica`);
        continue;
      }
      const vecchi = disattivi.filter(s => !usati.has(s.id) && stessoNome(r, s));
      if (vecchi.length === 1) { abbina(r, vecchi[0]); continue; }
      piano.nuovi.push(r);
      continue;
    }
    // tessera nuova: e' un socio nuovo; se un socio in uscita ha lo stesso nome lo segnalo
    piano.nuovi.push(r);
    if (omonimi.length) {
      piano.avvisi.push(`Riga ${r.riga}: ${etichetta(r)} (tessera ${r.numero_tessera}) ha lo stesso nome di #${omonimi.map(o => o.numero_tessera).join(', #')} che non è nel file: verrà creato come nuovo socio`);
    }
  }

  const finali = new Map<number, string[]>();
  for (const { r, socio, tessera } of abbinati) {
    finali.set(tessera, [...(finali.get(tessera) ?? []), etichetta(r)]);
    if (socio.disattivato_il) piano.riattivati.push({ id: socio.id, cognome: socio.cognome, nome: socio.nome, numero_tessera: tessera });
    else if (tessera !== socio.numero_tessera) piano.rinumerati.push({ id: socio.id, cognome: socio.cognome, nome: socio.nome, da: socio.numero_tessera, a: tessera });
    else piano.invariati++;
  }
  for (const [t, nomi] of finali) {
    if (nomi.length > 1) piano.errori.push(`Tessera ${t} assegnata a più soci: ${nomi.join(', ')}`);
  }
  piano.tessere_occupate = [...finali.keys()].sort((a, b) => a - b);

  for (const s of attivi) {
    if (usati.has(s.id)) continue;
    piano.rimossi.push({
      id: s.id, cognome: s.cognome, nome: s.nome, numero_tessera: s.numero_tessera,
      partecipazioni: s.partecipazioni, azione: s.partecipazioni > 0 ? 'disattiva' : 'elimina',
    });
  }
  piano.rimossi.sort((a, b) => a.cognome.localeCompare(b.cognome));
  return piano;
}
