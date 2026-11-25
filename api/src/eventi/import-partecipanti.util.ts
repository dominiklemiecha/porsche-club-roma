export interface SocioLite { id: number; nome: string; cognome: string; numero_tessera: number; }
/** Socio con le chiavi delle varianti del nome ricordate (vedi chiaveNome). */
export type SocioConAlias = SocioLite & { alias?: string[] };
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

/** Chiave di confronto nomi: solo lettere, senza accenti/spazi/apostrofi ("Gian Luca" = "Gianluca"). */
export function chiaveNome(s: string): string {
  return normalizza(s).replace(/[^a-z]/g, '');
}

/**
 * Matcha le righe del file ("Cognome Nome" o "Nome Cognome", virgola opzionale)
 * contro l'anagrafica soci. Righe duplicate sullo stesso socio contano una volta.
 */
export function matchPartecipanti(righe: RigaFile[], soci: SocioConAlias[]): MatchResult {
  const byKey = new Map<string, SocioLite[]>();
  const add = (k: string, { alias, ...s }: SocioConAlias) => {
    if (!k) return;
    const arr = byKey.get(k) ?? [];
    if (!arr.some(x => x.id === s.id)) { arr.push(s); byKey.set(k, arr); }
  };
  for (const s of soci) {
    add(chiaveNome(`${s.cognome} ${s.nome}`), s);
    add(chiaveNome(`${s.nome} ${s.cognome}`), s);
    for (const a of s.alias ?? []) add(a, s);
  }

  const res: MatchResult = { trovati: [], non_trovati: [], ambigui: [] };
  const visti = new Set<number>();
  for (const r of righe) {
    if (INTESTAZIONI.has(normalizza(r.testo))) continue;
    const key = chiaveNome(r.testo);
    if (!key) continue;
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

export function sniffFormato(buf: Buffer): 'xlsx' | 'pdf' | 'csv' {
  if (buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b) return 'xlsx'; // "PK" (zip)
  if (buf.slice(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  return 'csv';
}

/** Parser CSV RFC4180: BOM, campi quotati, sniffing separatore , vs ; */
export function parseCsv(testo: string): string[][] {
  const s = testo.replace(/^﻿/, '');
  const primaRiga = s.split(/\r?\n/).find(r => r.trim()) ?? '';
  let virgole = 0, puntiVirgola = 0, inQ = false;
  for (const ch of primaRiga) {
    if (ch === '"') inQ = !inQ;
    else if (!inQ && ch === ',') virgole++;
    else if (!inQ && ch === ';') puntiVirgola++;
  }
  const sep = puntiVirgola > virgole ? ';' : ',';

  const righe: string[][] = [];
  let campo = '', riga: string[] = [], quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { campo += '"'; i++; } else quoted = false;
      } else campo += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { riga.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      riga.push(campo); campo = '';
      righe.push(riga); riga = [];
    } else campo += c;
  }
  if (campo !== '' || riga.length > 0) { riga.push(campo); righe.push(riga); }
  return righe;
}

/** Tabella letta dal file: intestazioni (se riconosciute) e righe dati con numero di riga. */
export interface Tabella {
  intestazioni: string[] | null;
  righe: { riga: number; celle: string[] }[];
  /** colonna proposta per i nomi e, se il file ha Cognome e Nome separati, la seconda */
  colonna: number;
  colonna2: number | null;
}

export interface InfoColonna { indice: number; intestazione: string; esempi: string[]; }

/** Cerca nella riga una cella con intestazione nota: prima "socio", poi le generiche. */
export function trovaColonnaNomi(header: string[]): number {
  for (const chiavi of [new Set(['socio', 'soci']), INTESTAZIONI]) {
    const i = header.findIndex(c => chiavi.has(normalizza(c ?? '')));
    if (i >= 0) return i;
  }
  return -1;
}

/** Se la colonna scelta e' "Cognome" e c'e' "Nome" (o viceversa) propone di unirle. */
function colonnaComplementare(header: string[], col: number): number | null {
  const h = normalizza(header[col] ?? '');
  const altro = h === 'cognome' ? 'nome' : h === 'nome' ? 'cognome' : null;
  if (!altro) return null;
  const i = header.findIndex(c => normalizza(c ?? '') === altro);
  return i >= 0 ? i : null;
}

/**
 * Da matrice di celle (csv o xlsx) a tabella. Se nelle prime 5 righe c'e' un'intestazione
 * nota (es. "Socio", "Cognome e nome") quella riga fa da intestazione e propone la colonna;
 * altrimenti nessuna intestazione e prima colonna.
 */
export function tabellaDaMatrice(matrice: string[][]): Tabella {
  // "socio"/"soci" ha priorità sulle intestazioni generiche: negli export Forms
  // la colonna metadata "Nome" (il compilatore) precede la domanda "Socio"
  let headerRow = -1, col = 0;
  outer:
  for (const chiavi of [new Set(['socio', 'soci']), INTESTAZIONI]) {
    for (let r = 0; r < Math.min(matrice.length, 5); r++) {
      const c = (matrice[r] ?? []).findIndex(x => chiavi.has(normalizza(x ?? '')));
      if (c >= 0) { headerRow = r; col = c; break outer; }
    }
  }
  const intestazioni = headerRow >= 0 ? (matrice[headerRow] ?? []).map(x => String(x ?? '').trim()) : null;
  const righe: Tabella['righe'] = [];
  for (let r = headerRow + 1; r < matrice.length; r++) {
    righe.push({ riga: r + 1, celle: (matrice[r] ?? []).map(x => String(x ?? '').trim()) });
  }
  return { intestazioni, righe, colonna: col, colonna2: intestazioni ? colonnaComplementare(intestazioni, col) : null };
}

const lettera = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : `${String.fromCharCode(64 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`);

/** Elenco colonne non vuote con intestazione (o lettera) e qualche valore d'esempio. */
export function infoColonne(t: Tabella): InfoColonna[] {
  const n = Math.max(t.intestazioni?.length ?? 0, ...t.righe.map(r => r.celle.length), 0);
  const out: InfoColonna[] = [];
  for (let i = 0; i < n; i++) {
    const esempi = t.righe.map(r => r.celle[i] ?? '').filter(Boolean).slice(0, 3);
    const intest = t.intestazioni?.[i]?.trim();
    if (!esempi.length && !intest) continue;
    out.push({ indice: i, intestazione: intest || `Colonna ${lettera(i)}`, esempi });
  }
  return out;
}

/** Testi dei nomi dalla colonna scelta (eventualmente unita a una seconda). Scarta vuote e solo numeri. */
export function righeDaTabella(t: Tabella, col: number, col2: number | null = null): RigaFile[] {
  const out: RigaFile[] = [];
  for (const r of t.righe) {
    const parti = [r.celle[col] ?? '', col2 != null ? r.celle[col2] ?? '' : ''];
    const testo = parti.map(p => p.trim()).filter(Boolean).join(' ');
    if (!testo || /^\d+$/.test(testo)) continue;
    out.push({ riga: r.riga, testo });
  }
  return out;
}

/** Colonna proposta dalla tabella (compatibilità: usata da test e xlsx senza scelta). */
export function estraiColonnaSocio(matrice: string[][]): RigaFile[] {
  const t = tabellaDaMatrice(matrice);
  return righeDaTabella(t, t.colonna);
}
