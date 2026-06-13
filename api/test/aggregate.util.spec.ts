import { aggregaRighe, PartecipazioneLite } from '../src/classifica/aggregate.util';

const socioA = { id: 1, numero_tessera: 10, nome: 'Anna', cognome: 'Bianchi' };
const socioB = { id: 2, numero_tessera: 20, nome: 'Carlo', cognome: 'Verdi' };

describe('aggregaRighe', () => {
  it('somma i punti per socio e ordina per totale desc', () => {
    const parts: PartecipazioneLite[] = [
      { socio_id: 1, evento_key: 'e1', punteggio_totale: 10, socio: socioA },
      { socio_id: 1, evento_key: 'e2', punteggio_totale: 30, socio: socioA },
      { socio_id: 2, evento_key: 'e1', punteggio_totale: 25, socio: socioB },
    ];
    const righe = aggregaRighe(parts);
    expect(righe[0].socio.id).toBe(1);
    expect(righe[0].totale).toBe(40);
    expect(righe[0].posizione).toBe(1);
    expect(righe[0].punti_per_evento).toEqual({ e1: 10, e2: 30 });
    expect(righe[1].socio.id).toBe(2);
    expect(righe[1].totale).toBe(25);
    expect(righe[1].posizione).toBe(2);
  });

  it('a parità di totale ordina per cognome', () => {
    const parts: PartecipazioneLite[] = [
      { socio_id: 2, evento_key: 'e1', punteggio_totale: 10, socio: socioB },
      { socio_id: 1, evento_key: 'e1', punteggio_totale: 10, socio: socioA },
    ];
    const righe = aggregaRighe(parts);
    expect(righe[0].socio.cognome).toBe('Bianchi');
  });

  it('accumula punti dello stesso evento_key', () => {
    const parts: PartecipazioneLite[] = [
      { socio_id: 1, evento_key: 'k', punteggio_totale: 5, socio: socioA },
      { socio_id: 1, evento_key: 'k', punteggio_totale: 7, socio: socioA },
    ];
    const righe = aggregaRighe(parts);
    expect(righe[0].punti_per_evento).toEqual({ k: 12 });
    expect(righe[0].totale).toBe(12);
  });
});
