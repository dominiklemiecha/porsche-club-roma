import { cn } from '@/lib/utils';
import { imageUrl } from '@/lib/images';
import type { Categoria } from '@/lib/types';

const gradients: Record<Categoria, string> = {
  turismo:       'from-neutral-700 via-neutral-800 to-neutral-900',
  pista:         'from-porsche-dark via-porsche to-[#6f000f]',
  istituzionale: 'from-stone-500 via-stone-600 to-stone-700',
};

export function EventThumb({
  immagine, categoria, className, children,
}: {
  immagine?: string | null;
  categoria: Categoria;
  className?: string;
  children?: React.ReactNode;
}) {
  const src = imageUrl(immagine);
  return (
    <div className={cn('relative overflow-hidden bg-ink', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className={cn('h-full w-full bg-gradient-to-br', gradients[categoria])}>
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_0%,rgba(255,255,255,0.18),transparent_55%)]" />
        </div>
      )}
      {children}
    </div>
  );
}
