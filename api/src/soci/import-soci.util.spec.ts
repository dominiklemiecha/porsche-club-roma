import { conflittiTessereNuovi, estraiElencoSoci, pianificaImport, RigaSocio, SocioDb } from './import-soci.util';

const s = (id: number, numero_tessera: number, cognome: string, nome: string, partecipazioni = 0, disattivato = false, alias: string[] = []): SocioDb =>
  ({ id, numero_tessera, cognome, nome, partecipazioni, disattivato_il: disattivato ? new Date() : null, alias });
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
    expect(p.avvisi).toEqual([]);
  });

  it('abbina per tessera anche se il nome e\' scritto diverso (Gian Luca / Gianluca), senza avviso', () => {
    const p = pianificaImport([r(2, "D'Angelo", 'Gian Luca', 5)], [s(1, 5, 'DAngelo', 'Gianluca', 2)]);
    expect(p.invariati).toBe(1);
    expect(p.nuovi).toEqual([]);
    expect(p.rimossi).toEqual([]);
    expect(p.avvisi).toEqual([]);
  });

  it('stessa tessera con nome diverso: stesso socio, proposto come variante da ricordare', () => {
    const p = pianificaImport([r(2, 'Rossi', 'Gianni', 790)], [s(1, 790, 'Rossi', 'Giovanni', 1)]);
    expect(p.invariati).toBe(1);
    expect(p.nuovi).toEqual([]);
    expect(p.rimossi).toEqual([]);
    expect(p.nomi_diversi).toEqual([{ socio_id: 1, riga: 2, file: 'Rossi Gianni', anagrafica: 'Rossi Giovanni' }]);
  });

  it('variante già ricordata: nessuna segnalazione e vale anche per abbinare righe senza tessera', () => {
    const alias = ['rossigianni', 'giannirossi'];
    const p = pianificaImport([r(2, 'Rossi', 'Gianni', 790)], [s(1, 790, 'Rossi', 'Giovanni', 1, false, alias)]);
    expect(p.nomi_diversi).toEqual([]);
    const senza = pianificaImport([r(2, 'Rossi', 'Gianni', null)], [s(1, 790, 'Rossi', 'Giovanni', 1, false, alias)]);
    expect(senza.invariati).toBe(1);
  });

  it('tessera nuova = socio nuovo anche se esiste un omonimo (che esce), con avviso', () => {
    const p = pianificaImport([r(2, 'Rossi', 'Mario', 50)], [s(1, 7, 'Rossi', 'Mario', 2)]);
    expect(p.nuovi).toEqual([r(2, 'Rossi', 'Mario', 50)]);
    expect(p.rimossi.map(x => [x.id, x.azione])).toEqual([[1, 'disattiva']]);
    expect(p.avvisi).toHaveLength(1);
  });

  it('tessera ripetuta nel file: la tiene chi corrisponde in anagrafica, l\'altra riga va per nome o e\' nuova', () => {
    const soci = [s(1, 790, 'Dimaiuta', 'Alessandro'), s(2, 796, 'Cimaglia', 'Dino')];
    const p = pianificaImport([r(2, 'Cimaglia', 'Dino', 790), r(3, 'Dimaiuta', 'Alessandro', 790)], soci);
    expect(p.errori).toEqual([]);
    expect(p.invariati).toBe(2);
    expect(p.avvisi).toHaveLength(1);

    const primoImport = pianificaImport([r(2, 'Cimaglia', 'Dino', 790), r(3, 'Dimaiuta', 'Alessandro', 790)], [soci[0]]);
    expect(primoImport.nuovi).toEqual([r(2, 'Cimaglia', 'Dino', 790)]);
    expect(primoImport.tessere_occupate).toEqual([790]);
    expect(conflittiTessereNuovi(primoImport.nuovi, primoImport.tessere_occupate)).toEqual(['Tessera 790 di Cimaglia Dino è già di un altro socio']);
  });

  it('tessera ripetuta nel file senza riga corrispondente: errore', () => {
    const p = pianificaImport([r(2, 'A', 'B', 1), r(3, 'C', 'D', 1)], [s(1, 1, 'X', 'Y')]);
    expect(p.errori[0]).toContain('Tessera 1 ripetuta nel file');
  });

  it('socio disattivato rientra solo con stessa tessera e stesso nome', () => {
    const disatt = [s(1, 4, 'Rossi', 'Mario', 1, true)];
    const ok = pianificaImport([r(2, 'Rossi', 'Mario', 4)], disatt);
    expect(ok.riattivati).toEqual([{ id: 1, cognome: 'Rossi', nome: 'Mario', numero_tessera: 4 }]);
    const altro = pianificaImport([r(2, 'Verdi', 'Ugo', 4)], disatt);
    expect(altro.riattivati).toEqual([]);
    expect(altro.nuovi).toEqual([r(2, 'Verdi', 'Ugo', 4)]);
    expect(altro.rimossi).toEqual([]);
  });

  it('tessera mancante: abbina per nome mantenendo la tessera in anagrafica, altrimenti nuovo', () => {
    const p = pianificaImport([r(2, 'Rossi', 'Mario', null), r(3, 'Neri', 'Ugo', null)], [s(1, 4, 'Rossi', 'Mario')]);
    expect(p.invariati).toBe(1);
    expect(p.nuovi).toEqual([r(3, 'Neri', 'Ugo', null)]);
    expect(conflittiTessereNuovi(p.nuovi, p.tessere_occupate)).toEqual(['Numero tessera mancante per Neri Ugo']);
  });

  it('conflitti tra nuovi: tessera ripetuta', () => {
    expect(conflittiTessereNuovi([r(2, 'A', 'B', 5), r(3, 'C', 'D', 5)], [])).toEqual(['Tessera 5 ripetuta: A B, C D']);
  });
});
