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
      'relative flex min-w-0 flex-1 flex-col items-center text-center',
      lead
        ? 'overflow-hidden rounded-xl border border-line bg-paper px-2 pb-5 pt-3 shadow-card'
        : 'px-1 pb-3 pt-1',
    )}>
      <div className={cn('font-bold leading-none', lead ? 'text-3xl text-porsche' : 'text-xl text-ink/70')}>
        {row.posizione}
      </div>
      <CarSilhouette
        modello={row.modello_auto}
        className={cn('w-full text-ink', lead ? 'my-2.5 h-12 max-w-[110px]' : 'my-2 h-9 max-w-[86px]')}
      />
      <div className="w-full px-0.5 leading-tight" title={`${row.nome} ${row.cognome}`}>
        <div className="truncate text-[11px] font-semibold">{row.nome}</div>
        <div className="truncate text-[11px] font-semibold">{row.cognome}</div>
      </div>
      <div className={cn('mt-1.5 font-bold leading-none tabular-nums', lead ? 'text-2xl text-porsche' : 'text-xl text-ink')}>
        {row.punti}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-ink/45">punti</div>
      {lead && <span className="absolute inset-x-0 bottom-0 h-1 bg-porsche" />}
    </div>
  );
}

export function Podium({ rows }: { rows: PodiumRow[] }) {
  const byPos = (p: number) => rows.find(r => r.posizione === p);
  return (
    <div className="flex items-end gap-2 pt-2">
      <Cell row={byPos(2)} />
      <Cell row={byPos(1)} lead />
      <Cell row={byPos(3)} />
    </div>
  );
}
