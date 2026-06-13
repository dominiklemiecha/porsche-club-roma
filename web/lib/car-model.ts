export type CarBody = 'sport911' | 'sport718' | 'suv' | 'sedan';

/**
 * Mappa la stringa modello_auto del socio alla famiglia di carrozzeria Porsche,
 * così la sagoma riflette il modello reale (911, 718, SUV, berlina).
 */
export function carBodyType(modello?: string | null): CarBody {
  const m = (modello ?? '').toLowerCase();
  // Sportive mid-engine: 718 / Cayman / Boxster (prima di "911" per gestire stringhe miste)
  if (/\b718\b|cayman|boxster/.test(m)) return 'sport718';
  // SUV
  if (/cayenne|macan/.test(m)) return 'suv';
  // Berline 4 porte
  if (/panamera|taycan/.test(m)) return 'sedan';
  // 911 e tutte le sigle 9xx / classiche / denominazioni sportive
  if (/911|9[0-9]{2}\b|carrera|targa|turbo|gt[23]|\b930\b|\b964\b|speedster/.test(m)) return 'sport911';
  return 'sport911';
}
