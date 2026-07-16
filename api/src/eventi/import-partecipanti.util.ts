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

/**
 * Estrae la colonna dei soci da una matrice di celle (csv o xlsx).
 * Se nelle prime 5 righe una cella è un'intestazione nota (es. "Socio"),
 * usa quella colonna dalle righe successive; altrimenti la prima colonna.
 * Scarta celle vuote o solo numeriche (es. riga dei totali).
 */
export function estraiColonnaSocio(matrice: string[][]): RigaFile[] {
  // "socio"/"soci" ha priorità sulle intestazioni generiche: negli export Forms
  // la colonna metadata "Nome" (il compilatore) precede la domanda "Socio"
  let col = 0, start = 0;
  outer:
  for (const chiavi of [new Set(['socio', 'soci']), INTESTAZIONI]) {
    for (let r = 0; r < Math.min(matrice.length, 5); r++) {
      for (let c = 0; c < (matrice[r]?.length ?? 0); c++) {
        if (chiavi.has(normalizza(matrice[r][c] ?? ''))) { col = c; start = r + 1; break outer; }
      }
    }
  }
  const righe: RigaFile[] = [];
  for (let r = start; r < matrice.length; r++) {
    const testo = String(matrice[r]?.[col] ?? '').trim();
    if (!testo || /^\d+$/.test(testo)) continue;
    righe.push({ riga: r + 1, testo });
  }
  return righe;
}
