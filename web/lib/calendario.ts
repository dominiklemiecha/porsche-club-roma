import type { Categoria, Evento } from './types';

export type ContatoreBase = Record<Categoria, number>;

export function sommaBasePerCategoria(eventi: Evento[]): ContatoreBase {
  const out: ContatoreBase = { turismo: 0, pista: 0, istituzionale: 0 };
  for (const e of eventi) out[e.categoria] += e.punteggio_base;
  return out;
}
