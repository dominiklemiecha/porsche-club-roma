export interface ScoreInput {
  punteggio_base: number;
  prova_abilita: boolean;
  scala_prova: number[] | null;
  posizione_prova: number | null;
}

export function calcolaPunteggio(i: ScoreInput): number {
  if (!i.prova_abilita && i.posizione_prova !== null) {
    throw new Error('posizione_prova cannot be set when prova_abilita is false');
  }
  if (!i.prova_abilita || i.posizione_prova === null || !i.scala_prova) {
    return i.punteggio_base;
  }
  const idx = i.posizione_prova - 1;
  if (idx < 0 || idx >= i.scala_prova.length) return i.punteggio_base;
  return i.punteggio_base + i.scala_prova[idx];
}
