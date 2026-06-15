import { cn } from '@/lib/utils';
import { carBodyType, type CarBody } from '@/lib/car-model';

/**
 * Immagine auto (PNG reale, sfondo trasparente, stesso verso) come asset drop-in in
 * /public/cars/<famiglia>.png, scelta dal modello del socio. Tutte renderizzate alla
 * stessa altezza (width automatica per mantenere le proporzioni).
 */
export function CarSilhouette({ modello, body, className = '' }: { modello?: string | null; body?: CarBody; className?: string }) {
  const fam = body ?? carBodyType(modello);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/cars/${fam}.png`} alt={modello ?? 'Porsche'} className={cn('inline-block w-auto max-w-full object-contain', className)} />
  );
}
