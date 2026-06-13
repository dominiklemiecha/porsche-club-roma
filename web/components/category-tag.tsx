import { cn } from '@/lib/utils';
import type { Categoria } from '@/lib/types';

const styles: Record<Categoria, string> = {
  turismo:       'bg-ink text-paper',
  pista:         'bg-porsche text-paper',
  istituzionale: 'bg-paper text-ink ring-1 ring-ink/25',
};

export function CategoryTag({ categoria, className }: { categoria: Categoria; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
      styles[categoria], className,
    )}>
      {categoria}
    </span>
  );
}
