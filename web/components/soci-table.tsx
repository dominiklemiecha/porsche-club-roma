'use client';
import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { CarSilhouette } from '@/components/car-silhouette';
import { cn } from '@/lib/utils';
import type { Socio } from '@/lib/types';

interface Props {
  rows: Socio[];
  maxPart: number;
  onEdit: (s: Socio) => void;
  onDelete: (s: Socio) => void;
}

function RowMenu({ s, onEdit, onDelete }: { s: Socio; onEdit: (s: Socio) => void; onDelete: (s: Socio) => void }) {
  const [open, setOpen] = useState(false);
  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink/[0.04]';
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(v => !v)} aria-label="Azioni" className="grid h-8 w-8 place-items-center rounded-md text-ink/50 hover:bg-ink/[0.06] hover:text-ink">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-paper py-1 shadow-card-hover">
            <button className={item} onClick={() => { setOpen(false); onEdit(s); }}><Pencil className="h-4 w-4" /> Modifica</button>
            <button className={`${item} text-porsche`} onClick={() => { setOpen(false); onDelete(s); }}><Trash2 className="h-4 w-4" /> Elimina</button>
          </div>
        </>
      )}
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(4, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-porsche" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SociTable({ rows, maxPart, onEdit, onDelete }: Props) {
  return (
    <>
      {/* Mobile */}
      <div className="space-y-2 sm:hidden">
        {rows.map(s => (
          <div key={s.id} className="card flex items-center gap-3 p-3">
            <CarSilhouette modello={s.modello_auto} className="h-7 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{s.nome} {s.cognome}</div>
              <div className="truncate text-xs text-ink/60">#{s.numero_tessera} · {s.modello_auto ?? '—'}</div>
              <div className="mt-1 text-xs text-ink/60">{s._count?.partecipazioni ?? 0} partecipazioni</div>
            </div>
            <RowMenu s={s} onEdit={onEdit} onDelete={onDelete} />
          </div>
        ))}
        {rows.length === 0 && <div className="py-6 text-center text-ink/50">Nessun socio</div>}
      </div>

      {/* Desktop */}
      <div className="card hidden overflow-hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink/45">
              <th className="px-5 py-3 font-semibold">Tessera</th>
              <th className="px-5 py-3 font-semibold">Socio</th>
              <th className="px-5 py-3 font-semibold">Modello auto</th>
              <th className="px-5 py-3 font-semibold">Partecipazioni</th>
              <th className="px-5 py-3 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-ink/[0.02]">
                <td className="px-5 py-3 text-ink/70">{s.numero_tessera}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <CarSilhouette modello={s.modello_auto} className="h-6 shrink-0" />
                    <span className="font-semibold">{s.nome} {s.cognome}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink/70">{s.modello_auto ?? '—'}</td>
                <td className="px-5 py-3"><Bar value={s._count?.partecipazioni ?? 0} max={maxPart} /></td>
                <td className="px-5 py-3 text-right"><RowMenu s={s} onEdit={onEdit} onDelete={onDelete} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-ink/50">Nessun socio</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
