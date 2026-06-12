import { matchPartecipanti, normalizza, SocioLite } from './import-partecipanti.util';

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
