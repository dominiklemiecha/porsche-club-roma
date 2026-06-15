'use client';
import { cn } from '@/lib/utils';
import type { ClassificaResponse } from '@/lib/types';

interface Props {
  data: ClassificaResponse;
  selectedId?: number | null;
  onSelect?: (socioId: number) => void;
}

function evDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
}

export function ClassificaTable({ data, selectedId, onSelect }: Props) {
  return (
    <>
      {/* Mobile */}
      <div className="space-y-2 sm:hidden">
        {data.righe.map(r => (
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink/45">
              <th className="px-4 py-3 text-left font-semibold">Pos.</th>
              <th className="px-4 py-3 text-left font-semibold">Socio</th>
              <th className="px-3 py-3 text-center font-semibold">Totale<br />punti</th>
              {data.eventi.map(e => (
                <th key={e.id} className="px-2 py-3 text-center font-semibold" title={e.titolo}>
                  <div className="mx-auto max-w-[68px] truncate">{e.titolo}</div>
                  <div className="font-normal opacity-70">{evDate(e.data_evento)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.righe.map(r => (
              <tr
                key={r.socio.id}
                onClick={() => onSelect?.(r.socio.id)}
                className={cn('cursor-pointer border-b border-line/60 last:border-0 hover:bg-ink/[0.02]',
                  selectedId === r.socio.id && 'bg-cream hover:bg-cream')}
              >
                <td className="px-4 py-3 font-medium text-ink/70">{r.posizione}</td>
                <td className="px-4 py-3 font-semibold">{r.socio.nome} {r.socio.cognome}</td>
                <td className="px-3 py-3 text-center text-base font-bold tabular-nums">{r.totale}</td>
                {data.eventi.map(e => (
                  <td key={e.id} className="px-2 py-3 text-center tabular-nums text-ink/80">{r.punti_per_evento[e.id] ?? 0}</td>
                ))}
              </tr>
            ))}
            {data.righe.length === 0 && (
              <tr><td colSpan={3 + data.eventi.length} className="px-4 py-8 text-center text-ink/50">Nessun dato</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
