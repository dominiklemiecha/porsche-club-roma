import { conflittiTessereNuovi, estraiElencoSoci, pianificaImport, RigaSocio, SocioDb } from './import-soci.util';

const s = (id: number, numero_tessera: number, cognome: string, nome: string, partecipazioni = 0, disattivato = false): SocioDb =>
  ({ id, numero_tessera, cognome, nome, partecipazioni, disattivato_il: disattivato ? new Date() : null });
const r = (riga: number, cognome: string, nome: string, numero_tessera: number | null): RigaSocio =>
  ({ riga, cognome, nome, numero_tessera });

describe('estraiElencoSoci', () => {
  it('trova intestazione e colonne, salta righe vuote, tessera non numerica = null', () => {
    const m = [
      ['ELENCO SOCI'],
      ['N.', 'Cognome', 'Nome', 'Tessera club nr. '],
      ['1', 'Rossi', ' Mario ', '12'],
      [],
      ['2', 'Bianchi', 'Luca', ''],
      ['3', 'Verdi', 'Anna', 'abc'],
    ];
    expect(estraiElencoSoci(m)).toEqual([
      r(3, 'Rossi', 'Mario', 12), r(5, 'Bianchi', 'Luca', null), r(6, 'Verdi', 'Anna', null),
    ]);
  });
  it('null se manca la colonna tessera', () => {
    expect(estraiElencoSoci([['Cognome', 'Nome'], ['Rossi', 'Mario']])).toBeNull();
  });
});

describe('pianificaImport', () => {
  it('invariati, nuovi, rimossi con azione in base alle partecipazioni', () => {
    const p = pianificaImport(
      [r(2, 'Rossi', 'Mario', 1), r(3, 'Neri', 'Paolo', 9)],
      [s(1, 1, 'Rossi', 'Mario'), s(2, 2, 'Bianchi', 'Luca', 3), s(3, 3, 'Verdi', 'Anna')],
    );
    expect(p.invariati).toBe(1);
    expect(p.nuovi).toEqual([r(3, 'Neri', 'Paolo', 9)]);
    expect(p.rimossi.map(x => [x.id, x.azione])).toEqual([[2, 'disattiva'], [3, 'elimina']]);
    expect(p.errori).toEqual([]);
  });

  it('stessa persona con tessera diversa = rinumerata (match senza accenti/maiuscole)', () => {
    const p = pianificaImport([r(2, 'DALE', 'Fabrizio', 50)], [s(1, 7, 'Dalè', 'Fabrizio', 2)]);
    expect(p.rinumerati).toEqual([{ id: 1, cognome: 'Dalè', nome: 'Fabrizio', da: 7, a: 50 }]);
    expect(p.rimossi).toEqual([]);
  });

  it('nuovo con tessera di un socio che resta: non è errore del file, va corretta sul nuovo', () => {
    const p = pianificaImport(
      [r(2, 'Dimaiuta', 'Alessandro', 790), r(3, 'Cimaglia', 'Dino', 790)],
      [s(1, 790, 'Dimaiuta', 'Alessandro')],
    );
    expect(p.errori).toEqual([]);
    expect(p.tessere_occupate).toEqual([790]);
    expect(conflittiTessereNuovi(p.nuovi, p.tessere_occupate)).toEqual(['Tessera 790 di Cimaglia Dino è già di un altro socio']);
    expect(conflittiTessereNuovi([{ ...p.nuovi[0], numero_tessera: 796 }], p.tessere_occupate)).toEqual([]);
  });

  it('conflitti tra nuovi: tessera ripetuta o mancante', () => {
    expect(conflittiTessereNuovi([r(2, 'A', 'B', 5), r(3, 'C', 'D', 5), r(4, 'E', 'F', null)], [])).toEqual([
      'Tessera 5 ripetuta: A B, C D', 'Numero tessera mancante per E F',
    ]);
  });

  it("reimport con tessera duplicata nel file: chi la ha già la tiene, l'altro conserva la sua con avviso", () => {
    const p = pianificaImport(
      [r(2, 'Cimaglia', 'Dino', 790), r(3, 'Dimaiuta', 'Alessandro', 790)],
      [s(1, 790, 'Dimaiuta', 'Alessandro'), s(2, 796, 'Cimaglia', 'Dino')],
    );
    expect(p.errori).toEqual([]);
    expect(p.invariati).toBe(2);
    expect(p.rinumerati).toEqual([]);
    expect(p.avvisi).toHaveLength(1);
  });

  it('tessera riassegnata a un altro nome: esce il vecchio, entra il nuovo', () => {
    const p = pianificaImport([r(2, 'Cimaglia', 'Dino', 790)], [s(1, 790, 'Dimaiuta', 'Alessandro', 1)]);
    expect(p.nuovi).toEqual([r(2, 'Cimaglia', 'Dino', 790)]);
    expect(p.rimossi.map(x => [x.id, x.azione])).toEqual([[1, 'disattiva']]);
    expect(p.errori).toEqual([]);
  });

  it('socio disattivato che rientra viene riattivato; i disattivati non vengono rimossi di nuovo', () => {
    const p = pianificaImport(
      [r(2, 'Rossi', 'Mario', 5)],
      [s(1, 4, 'Rossi', 'Mario', 1, true), s(2, 8, 'Gialli', 'Ugo', 1, true)],
    );
    expect(p.riattivati).toEqual([{ id: 1, cognome: 'Rossi', nome: 'Mario', numero_tessera: 5 }]);
    expect(p.rimossi).toEqual([]);
  });

  it('tessera mancante su socio esistente: mantiene quella in anagrafica', () => {
    const p = pianificaImport([r(2, 'Rossi', 'Mario', null)], [s(1, 4, 'Rossi', 'Mario')]);
    expect(p.invariati).toBe(1);
  });

  it('segnala tessere duplicate e omonimi ambigui', () => {
    const dup = pianificaImport([r(2, 'A', 'B', 1), r(3, 'C', 'D', 1)], [s(1, 9, 'A', 'B'), s(2, 8, 'C', 'D')]);
    expect(dup.errori).toEqual(['Tessera 1 assegnata a più soci: A B, C D']);
    const omo = pianificaImport([r(2, 'Rossi', 'Mario', 9)], [s(1, 1, 'Rossi', 'Mario'), s(2, 2, 'Rossi', 'Mario')]);
    expect(omo.errori[0]).toContain('corrisponde a più soci');
  });
});
