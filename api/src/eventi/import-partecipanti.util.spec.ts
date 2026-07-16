import { estraiColonnaSocio, matchPartecipanti, normalizza, parseCsv, sniffFormato, SocioLite } from './import-partecipanti.util';

const soci: SocioLite[] = [
  { id: 1, cognome: 'Rossi', nome: 'Mario', numero_tessera: 10 },
  { id: 2, cognome: 'Di Marco', nome: 'Luca', numero_tessera: 11 },
  { id: 3, cognome: 'Bianchi', nome: 'Anna', numero_tessera: 12 },
  { id: 4, cognome: 'Bianchi', nome: 'Marco', numero_tessera: 13 },
  { id: 5, cognome: 'Marco', nome: 'Bianchi', numero_tessera: 14 }, // omonimo invertito di id 4
];

describe('normalizza', () => {
  it('toglie accenti, virgole e spazi multipli', () => {
    expect(normalizza('  Nicolò,  D’Errico ')).toBe('nicolo d’errico');
    expect(normalizza('ROSSI ; Mario')).toBe('rossi mario');
  });
});

describe('matchPartecipanti', () => {
  it('matcha "Cognome Nome" e "Nome Cognome"', () => {
    const r = matchPartecipanti([
      { riga: 1, testo: 'Rossi Mario' },
      { riga: 2, testo: 'Anna Bianchi' },
    ], soci);
    expect(r.trovati.map(t => t.socio.id)).toEqual([1, 3]);
    expect(r.non_trovati).toHaveLength(0);
    expect(r.ambigui).toHaveLength(0);
  });

  it('gestisce virgola e cognomi composti', () => {
    const r = matchPartecipanti([
      { riga: 1, testo: 'Rossi, Mario' },
      { riga: 2, testo: 'Di Marco Luca' },
    ], soci);
    expect(r.trovati.map(t => t.socio.id)).toEqual([1, 2]);
  });

  it('salta intestazione e righe vuote, dedup sullo stesso socio', () => {
    const r = matchPartecipanti([
      { riga: 1, testo: 'Cognome Nome' },
      { riga: 2, testo: 'Rossi Mario' },
      { riga: 3, testo: '  ' },
      { riga: 4, testo: 'MARIO ROSSI' },
    ], soci);
    expect(r.trovati).toHaveLength(1);
    expect(r.non_trovati).toHaveLength(0);
  });

  it('segnala non trovati e ambigui', () => {
    const r = matchPartecipanti([
      { riga: 1, testo: 'Verdi Giuseppe' },
      { riga: 2, testo: 'Bianchi Marco' }, // id 4 (cognome nome) e id 5 (nome cognome)
    ], soci);
    expect(r.non_trovati).toEqual([{ riga: 1, testo: 'Verdi Giuseppe' }]);
    expect(r.ambigui).toHaveLength(1);
    expect(r.ambigui[0].candidati.map(c => c.id).sort()).toEqual([4, 5]);
  });
});

describe('sniffFormato', () => {
  it('riconosce xlsx (zip), pdf e fallback csv', () => {
    expect(sniffFormato(Buffer.from('PK\x03\x04resto'))).toBe('xlsx');
    expect(sniffFormato(Buffer.from('%PDF-1.7 resto'))).toBe('pdf');
    expect(sniffFormato(Buffer.from('Socio,Ospite\nRossi, Mario'))).toBe('csv');
  });
});

describe('parseCsv', () => {
  it('separatore virgola con campi quotati contenenti virgole', () => {
    const r = parseCsv('Number,Socio,Ospite\n1,"Rossi, Mario","Anna Verdi"\n2,"Bianchi, Anna",');
    expect(r).toEqual([
      ['Number', 'Socio', 'Ospite'],
      ['1', 'Rossi, Mario', 'Anna Verdi'],
      ['2', 'Bianchi, Anna', ''],
    ]);
  });

  it('separatore punto e virgola e BOM', () => {
    const r = parseCsv('﻿Number;Socio\n1;Rossi, Mario');
    expect(r).toEqual([['Number', 'Socio'], ['1', 'Rossi, Mario']]);
  });

  it('virgolette doppie escapate e CRLF', () => {
    const r = parseCsv('a,b\r\n"x ""y""",z\r\n');
    expect(r).toEqual([['a', 'b'], ['x "y"', 'z']]);
  });
});

describe('estraiColonnaSocio', () => {
  it('usa la colonna con intestazione "Socio" (struttura Forms)', () => {
    const r = estraiColonnaSocio([
      ['Number', 'Socio', 'Ospite', 'Targa'],
      ['1', 'Rossi, Mario', 'Anna Verdi', 'AB123CD'],
      ['2', 'Bianchi, Anna', '', ''],
      ['3', '', 'Solo, Ospite', ''],   // socio vuoto -> scartata
      ['', '74', '', ''],              // riga totale numerica -> scartata
    ]);
    expect(r).toEqual([
      { riga: 2, testo: 'Rossi, Mario' },
      { riga: 3, testo: 'Bianchi, Anna' },
    ]);
  });

  it('senza intestazione usa la prima colonna (retrocompatibile xlsx)', () => {
    const r = estraiColonnaSocio([['Rossi Mario'], ['Bianchi Anna'], ['']]);
    expect(r).toEqual([
      { riga: 1, testo: 'Rossi Mario' },
      { riga: 2, testo: 'Bianchi Anna' },
    ]);
  });

  it('trova l\'intestazione anche se non in prima riga', () => {
    const r = estraiColonnaSocio([
      ['Castello di Torre Alfina | Sabato 2 maggio 2026'],
      ['Number', 'Socio', 'Ospite'],
      ['1', 'Rossi, Mario', 'x'],
    ]);
    expect(r).toEqual([{ riga: 3, testo: 'Rossi, Mario' }]);
  });

  it('preferisce "Socio" alle colonne metadata Forms (es. "Nome" del compilatore)', () => {
    const r = estraiColonnaSocio([
      ['ID', 'Ora di inizio', 'Posta elettronica', 'Nome', 'Socio', 'Ospite'],
      ['1', '01/05/2026', 'segreteria@pcr.it', 'Segreteria PCR', 'Rossi, Mario', 'x'],
      ['2', '01/05/2026', 'segreteria@pcr.it', 'Segreteria PCR', 'Bianchi, Anna', ''],
    ]);
    expect(r).toEqual([
      { riga: 2, testo: 'Rossi, Mario' },
      { riga: 3, testo: 'Bianchi, Anna' },
    ]);
  });
});
