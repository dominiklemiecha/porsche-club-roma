'use client';
import { Bell } from 'lucide-react';

export function Topbar() {
  return (
    <header className="hidden lg:flex items-center justify-end gap-4 px-6 lg:px-8 pt-5">
      <button
        aria-label="Notifiche"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-ink/70 transition hover:text-ink hover:shadow-card"
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-porsche ring-2 ring-paper" />
      </button>

      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">
          A
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Amministratore</div>
          <div className="text-xs text-ink/50">Porsche Club Roma</div>
        </div>
      </div>
    </header>
  );
}
