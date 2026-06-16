'use client';
import { cn } from '@/lib/utils';
import type { ClassificaResponse } from '@/lib/types';

export const PAGE_SIZE = 9;

interface Props {
  data: ClassificaResponse;
  page: number;
  selectedId?: number | null;
  onSelect?: (socioId: number) => void;
}

function evDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
}

export function ClassificaTable({ data, page, selectedId, onSelect }: Props) {
  const pages = Math.max(1, Math.ceil(data.righe.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const righe = data.righe.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      {/* Mobile */}
      <div className="space-y-2 sm:hidden">
        {righe.map(r => (
          <button
            key={r.socio.id}
            onClick={() => onSelect?.(r.socio.id)}
            className={cn('card flex w-full items-center justify-between gap-3 p-3 text-left',
              selectedId === r.socio.id && 'ring-2 ring-porsche')}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-porsche">{r.posizione}</span>
              <div>
                <div className="font-semibold">{r.socio.nome} {r.socio.cognome}</div>
                <div className="text-xs text-ink/55">#{r.socio.numero_tessera}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold tabular-nums">{r.totale}</div>
              <div className="text-[10px] uppercase text-ink/45">punti</div>
            </div>
          </button>
        ))}
        {data.righe.length === 0 && <div className="py-6 text-center text-ink/50">Nessun dato</div>}
      </div>

      {/* Desktop */}
      <div className="card hidden overflow-x-auto sm:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-ink/45">
              <th className="sticky left-0 z-20 w-14 border-b border-line bg-paper px-4 py-3 text-left font-semibold">Pos.</th>
              <th className="sticky left-14 z-20 w-[180px] border-b border-line bg-paper px-4 py-3 text-left font-semibold">Socio</th>
              <th className="sticky left-[236px] z-20 w-20 border-b border-r border-line bg-paper px-3 py-3 text-center font-semibold shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)]">Totale<br />punti</th>
              {data.eventi.map(e => (
                <th key={e.id} className="border-b border-line px-2 py-3 text-center font-semibold" title={e.titolo}>
                  <div className="mx-auto max-w-[68px] truncate">{e.titolo}</div>
                  <div className="font-normal opacity-70">{evDate(e.data_evento)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {righe.map(r => {
              const active = selectedId === r.socio.id;
              const bg = active ? 'bg-cream' : 'bg-paper';
              return (
                <tr
                  key={r.socio.id}
                  onClick={() => onSelect?.(r.socio.id)}
                  className={cn('group cursor-pointer', active && 'text-ink')}
                >
                  <td className={cn('sticky left-0 z-10 border-b border-line/60 px-4 py-3 font-medium text-ink/70', bg)}>{r.posizione}</td>
                  <td className={cn('sticky left-14 z-10 border-b border-line/60 px-4 py-3 font-semibold', bg)}>{r.socio.nome} {r.socio.cognome}</td>
                  <td className={cn('sticky left-[236px] z-10 border-b border-r border-line/60 px-3 py-3 text-center text-base font-bold tabular-nums shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)]', bg)}>{r.totale}</td>
                  {data.eventi.map(e => (
                    <td key={e.id} className="border-b border-line/60 px-2 py-3 text-center tabular-nums text-ink/80 group-hover:bg-ink/[0.02]">{r.punti_per_evento[e.id] ?? 0}</td>
                  ))}
                </tr>
              );
            })}
            {data.righe.length === 0 && (
              <tr><td colSpan={3 + data.eventi.length} className="px-4 py-8 text-center text-ink/50">Nessun dato</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
