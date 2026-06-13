import Link from 'next/link';
import { ChevronRight, Star, Users } from 'lucide-react';
import { EventThumb } from '@/components/event-thumb';
import { CategoryTag } from '@/components/category-tag';
import type { DashboardEvento } from '@/lib/types';

function dayMonth(d: string) {
  const date = new Date(d);
  return {
    day: date.toLocaleDateString('it-IT', { day: '2-digit' }),
    month: date.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '').toUpperCase(),
  };
}

export function EventMini({ evento }: { evento: DashboardEvento }) {
  const { day, month } = dayMonth(evento.data_evento);
  return (
    <Link href={`/eventi/${evento.id}`} className="group flex items-center gap-3 py-3">
      <EventThumb immagine={evento.immagine} categoria={evento.categoria} className="h-14 w-16 shrink-0 rounded-lg" />
      <div className="w-8 shrink-0 text-center leading-none">
        <div className="text-lg font-bold text-porsche">{day}</div>
        <div className="mt-0.5 text-[10px] font-semibold tracking-wide text-ink/50">{month}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{evento.titolo}</div>
        <div className="mt-1"><CategoryTag categoria={evento.categoria} /></div>
        <div className="mt-1.5 flex items-center gap-4 text-xs text-ink/55">
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {evento.partecipanti} partecipanti</span>
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Base {evento.base} punti</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-ink/60" />
    </Link>
  );
}
