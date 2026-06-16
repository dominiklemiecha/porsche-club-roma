'use client';
import { CarSilhouette } from '@/components/car-silhouette';
import { cn } from '@/lib/utils';
import type { ClassificaResponse } from '@/lib/types';

export function ClassificaDetail({ data, socioId, className }: { data: ClassificaResponse; socioId: number | null; className?: string }) {
  const riga = data.righe.find(r => r.socio.id === socioId) ?? data.righe[0];

  return (
    <div className={cn('card p-5', className)}>
      <h2 className="text-base font-semibold">Dettaglio punteggio</h2>

      {riga ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <CarSilhouette modello={riga.socio.modello_auto} className="h-10 shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold leading-tight">{riga.socio.nome} {riga.socio.cognome}</div>
              <div className="text-xs text-ink/55">Tessera {riga.socio.numero_tessera}</div>
            </div>
          </div>

          <div className="mt-4">
            {data.eventi.map(e => (
              <div key={e.id} className="flex items-center justify-between border-b border-line/60 py-2 text-sm last:border-0">
                <span className="min-w-0 truncate pr-2 text-ink/80">{e.titolo}</span>
                <span className="font-semibold tabular-nums">{riga.punti_per_evento[e.id] ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-sm font-semibold uppercase tracking-wide">Totale</span>
            <span><span className="text-2xl font-bold tabular-nums">{riga.totale}</span> <span className="text-xs text-ink/55">punti</span></span>
          </div>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-ink/45">Nessun socio in classifica.</p>
      )}
    </div>
  );
}
