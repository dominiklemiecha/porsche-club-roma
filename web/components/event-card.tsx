'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Star, Users, Eye, UserPlus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { EventThumb } from '@/components/event-thumb';
import { CategoryTag } from '@/components/category-tag';
import type { Evento } from '@/lib/types';

interface Props {
  evento: Evento;
  readOnly?: boolean;
  onEdit: (e: Evento) => void;
  onDelete: (e: Evento) => void;
  onPartecipanti: (e: Evento) => void;
  onImmagine: (e: Evento) => void;
}

function dateLabel(e: Evento) {
  const f = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
  if (e.data_fine && e.data_fine.slice(0, 10) !== e.data_evento.slice(0, 10)) {
    return `${new Date(e.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()} – ${f(e.data_fine)}`;
  }
  return f(e.data_evento);
}

export function EventCard({ evento, readOnly = false, onEdit, onDelete, onPartecipanti, onImmagine }: Props) {
  const [menu, setMenu] = useState(false);

  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink/[0.04] disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className="card group relative flex flex-col overflow-hidden transition hover:shadow-card-hover">
      <Link href={`/eventi/${evento.id}`} className="block">
        <EventThumb immagine={evento.immagine} categoria={evento.categoria} className="h-36 w-full" />
      </Link>

      {/* menu */}
      <div className="absolute right-2 top-2">
        <button
          onClick={() => setMenu(v => !v)}
          aria-label="Azioni"
          className="grid h-8 w-8 place-items-center rounded-md bg-black/35 text-paper backdrop-blur-sm transition hover:bg-black/55"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menu && (
          <>
            <button className="fixed inset-0 z-10 cursor-default" aria-hidden onClick={() => setMenu(false)} />
            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-paper py-1 shadow-card-hover">
              <Link href={`/eventi/${evento.id}`} className={item}><Eye className="h-4 w-4" /> Vedi dettagli</Link>
              <button className={item} disabled={readOnly} onClick={() => { setMenu(false); onPartecipanti(evento); }}><UserPlus className="h-4 w-4" /> Partecipanti</button>
              <button className={item} disabled={readOnly} onClick={() => { setMenu(false); onImmagine(evento); }}><ImageIcon className="h-4 w-4" /> Immagine</button>
              <button className={item} disabled={readOnly} onClick={() => { setMenu(false); onEdit(evento); }}><Pencil className="h-4 w-4" /> Modifica</button>
              <button className={`${item} text-porsche`} disabled={readOnly} onClick={() => { setMenu(false); onDelete(evento); }}><Trash2 className="h-4 w-4" /> Elimina</button>
            </div>
          </>
        )}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-porsche">{dateLabel(evento)}</div>
        <Link href={`/eventi/${evento.id}`} className="mt-1 line-clamp-2 font-semibold leading-tight hover:underline">
          {evento.titolo}
        </Link>
        <div className="mt-2"><CategoryTag categoria={evento.categoria} /></div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <div className="text-xl font-bold leading-none tabular-nums">{evento.punteggio_base}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-ink/55"><Star className="h-3.5 w-3.5" /> Base punti</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold leading-none tabular-nums">{evento._count?.partecipazioni ?? 0}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-ink/55"><Users className="h-3.5 w-3.5" /> Partecipanti</div>
          </div>
        </div>
      </div>
    </div>
  );
}
