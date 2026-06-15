import { cn } from '@/lib/utils';
import { CarSilhouette } from '@/components/car-silhouette';

export interface PodiumRow {
  posizione: number;
  nome: string;
  cognome: string;
  modello_auto?: string | null;
  punti: number;
}

function Cell({ row, lead, carded }: { row?: PodiumRow; lead?: boolean; carded?: boolean }) {
  if (!row) return <div className="min-w-0 flex-1" />;
  const boxed = lead || carded;
  return (
    <div className={cn(
      'relative flex min-w-0 flex-1 flex-col items-center text-center',
      boxed ? 'overflow-hidden rounded-xl border bg-paper shadow-card' : '',
      lead ? 'border-porsche/30 px-2 pb-5 pt-4 sm:-mt-3' : boxed ? 'border-line px-2 pb-4 pt-3' : 'px-1 pb-3 pt-1',
    )}>
      <div className={cn('font-bold leading-none', lead ? 'text-3xl text-porsche' : 'text-xl text-ink/70')}>
        {row.posizione}
      </div>
      <CarSilhouette
        modello={row.modello_auto}
        className={cn('w-full text-ink', lead ? 'my-2.5 h-12 max-w-[120px]' : 'my-2 h-9 max-w-[92px]')}
      />
      {carded ? (
        <div className="w-full truncate px-1 text-sm font-semibold leading-tight" title={`${row.nome} ${row.cognome}`}>
          {row.nome} {row.cognome}
        </div>
      ) : (
        <div className="w-full px-0.5 leading-tight" title={`${row.nome} ${row.cognome}`}>
          <div className="truncate text-[11px] font-semibold">{row.nome}</div>
          <div className="truncate text-[11px] font-semibold">{row.cognome}</div>
        </div>
      )}
      <div className={cn('mt-1.5 font-bold leading-none tabular-nums', lead ? 'text-2xl text-porsche' : 'text-xl text-ink')}>
        {row.punti}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-ink/45">punti</div>
      {lead && <span className="absolute inset-x-0 bottom-0 h-1 bg-porsche" />}
    </div>
  );
}

export function Podium({ rows, carded = false }: { rows: PodiumRow[]; carded?: boolean }) {
  const byPos = (p: number) => rows.find(r => r.posizione === p);
  return (
    <div className="flex items-end gap-2 pt-2 sm:gap-3">
      <Cell row={byPos(2)} carded={carded} />
      <Cell row={byPos(1)} lead carded={carded} />
      <Cell row={byPos(3)} carded={carded} />
    </div>
  );
}
