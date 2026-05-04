import { calcolaPunteggio } from '../src/eventi/score.util';

describe('calcolaPunteggio', () => {
  it('returns base points when no skill challenge', () => {
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: false,
      scala_prova: null,
      posizione_prova: null,
    })).toBe(10);
  });

  it('adds skill bonus when position is in scale', () => {
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: true,
      scala_prova: [30,25,20,15,10,5],
      posizione_prova: 1,
    })).toBe(40);
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: true,
      scala_prova: [30,25,20,15,10,5],
      posizione_prova: 6,
    })).toBe(15);
  });

  it('returns base only when position is null on prova_abilita event', () => {
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: true,
      scala_prova: [30,25,20],
      posizione_prova: null,
    })).toBe(10);
  });

  it('returns base only when position out of scale range', () => {
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: true,
      scala_prova: [30,25,20],
      posizione_prova: 5,
    })).toBe(10);
  });

  it('throws if posizione_prova set on non-prova event', () => {
    expect(() => calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: false,
      scala_prova: null,
      posizione_prova: 1,
    })).toThrow();
  });
});
