import { carBodyType, type CarBody } from '@/lib/car-model';

/**
 * Silhouette auto come asset SVG drop-in in /public/cars/<famiglia>.svg.
 * Per cambiare le sagome basta sostituire il file SVG corrispondente (stessa viewBox 0 0 260 96),
 * senza toccare il codice. Tutte renderizzate alla stessa dimensione.
 */
export function CarSilhouette({ modello, body, className = '' }: { modello?: string | null; body?: CarBody; className?: string }) {
  const fam = body ?? carBodyType(modello);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/cars/${fam}.svg`} alt={modello ?? 'Porsche'} className={`object-contain ${className}`} />
  );
}
