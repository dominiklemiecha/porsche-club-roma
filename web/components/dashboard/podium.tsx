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
  if (!row) return <div className="min-w-0 flex-1" />;
  return (
    <div className={cn(
      'relative flex min-w-0 flex-1 flex-col items-center rounded-xl border bg-paper px-2 text-center',
      lead ? 'border-porsche/30 pb-5 pt-4 shadow-card sm:-mt-3' : 'border-line pb-4 pt-3',
    )}>
      <div className={cn('font-bold leading-none', lead ? 'text-3xl text-porsche' : 'text-2xl text-ink/80')}>
        {row.posizione}
      </div>
      <CarSilhouette modello={row.modello_auto} className={cn('w-full text-ink', lead ? 'my-2.5 h-11 max-w-[104px]' : 'my-2 h-9 max-w-[88px]')} />
      <div className="w-full truncate text-[13px] font-semibold leading-tight" title={`${row.nome} ${row.cognome}`}>
        {row.nome} {row.cognome}
      </div>
      <div className={cn('mt-1 font-bold tabular-nums', lead ? 'text-2xl text-porsche' : 'text-xl')}>{row.punti}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink/45">punti</div>
      {lead && <span className="absolute bottom-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-porsche" />}
    </div>
  );
}

export function Podium({ rows }: { rows: PodiumRow[] }) {
  const byPos = (p: number) => rows.find(r => r.posizione === p);
  return (
    <div className="flex items-end gap-2 pt-3">
      <Cell row={byPos(2)} />
      <Cell row={byPos(1)} lead />
      <Cell row={byPos(3)} />
    </div>
  );
}
