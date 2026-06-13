import { cn } from '@/lib/utils';
import { CarSilhouette } from '@/components/car-silhouette';

export interface PodiumRow {
  posizione: number;
  nome: string;
  cognome: string;
  modello_auto?: string | null;
  punti: number;
}

function Cell({ row, lead }: { row?: PodiumRow; lead?: boolean }) {
  if (!row) return <div className="flex-1" />;
  return (
    <div className={cn(
      'relative flex flex-1 flex-col items-center rounded-xl border bg-paper px-3 pb-4 pt-3 text-center',
      lead ? 'border-porsche/30 shadow-card -mt-2' : 'border-line',
    )}>
      <div className={cn('text-2xl font-bold leading-none', lead ? 'text-porsche' : 'text-ink/80')}>
        {row.posizione}
      </div>
      <CarSilhouette modello={row.modello_auto} className="my-2 h-9 w-[88px] text-ink" />
      <div className="text-sm font-semibold leading-tight">{row.nome} {row.cognome}</div>
      <div className={cn('mt-1 text-xl font-bold tabular-nums', lead && 'text-porsche')}>{row.punti}</div>
      <div className="text-[11px] uppercase tracking-wide text-ink/45">punti</div>
      {lead && <span className="absolute -bottom-px left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-porsche" />}
    </div>
  );
}

export function Podium({ rows }: { rows: PodiumRow[] }) {
  const byPos = (p: number) => rows.find(r => r.posizione === p);
  return (
    <div className="flex items-end gap-3">
      <Cell row={byPos(2)} />
      <Cell row={byPos(1)} lead />
      <Cell row={byPos(3)} />
    </div>
  );
}
