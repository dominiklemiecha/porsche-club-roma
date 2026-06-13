'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, CalendarDays, Trophy, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { DashboardResponse } from '@/lib/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { Podium } from '@/components/dashboard/podium';
import { EventMini } from '@/components/dashboard/event-mini';
import { EventThumb } from '@/components/event-thumb';
import { CategoryTag } from '@/components/category-tag';

function dateLong(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
}

export default function DashboardPage() {
  const [d, setD] = useState<DashboardResponse | null>(null);
  useEffect(() => { api<DashboardResponse>('/dashboard').then(setD); }, []);

  const anno = d?.anno ?? new Date().getFullYear();
  const minor = d?.podio.filter(r => r.posizione >= 4 && r.posizione <= 7) ?? [];
  const ultimo = d?.ultimoEvento ?? null;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="animate-rise relative h-44 overflow-hidden rounded-xl2 bg-ink text-paper shadow-card sm:h-52">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero-track.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/35 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight drop-shadow sm:text-4xl">Porsche Club Roma</h1>
          <p className="mt-1 text-base text-paper/85 sm:text-lg">Campionato Sociale {anno}</p>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} iconClassName="text-porsche" value={d?.stats.soci ?? '—'} label="Soci iscritti" href="/soci" linkLabel="Vai ai soci" />
        <StatCard icon={CalendarDays} iconClassName="text-ink" value={d?.stats.eventi ?? '—'} label="Eventi in stagione" href="/eventi" linkLabel="Vai agli eventi" />
        <StatCard icon={Trophy} iconClassName="text-ink" value={d?.stats.puntiAssegnati ?? '—'} label="Punti assegnati" href="/classifica" linkLabel="Vai alla classifica" />
        <StatCard icon={Star} iconClassName="text-porsche" value={d?.stats.leader?.punti ?? '—'} label="Leader classifica" href="/classifica" linkLabel="Vai alla classifica" />
      </section>

      {/* THREE COLUMNS */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Classifica generale */}
        <div className="card flex min-w-0 flex-col overflow-hidden p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Classifica generale</h2>
            <Link href="/classifica" className="inline-flex items-center gap-1 text-xs font-medium text-porsche">
              Vedi classifica completa <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {d && d.podio.length > 0 ? (
            <>
              <Podium rows={d.podio} />
              {minor.length > 0 && (
                <div className="mt-5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink/45">
                        <th className="py-2 pr-2 font-semibold">Pos.</th>
                        <th className="py-2 font-semibold">Socio</th>
                        <th className="py-2 text-right font-semibold">Punti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {minor.map(r => (
                        <tr key={r.numero_tessera} className="border-b border-line/60 last:border-0">
                          <td className="py-2 pr-2 text-ink/60">{r.posizione}</td>
                          <td className="py-2">{r.nome} {r.cognome}</td>
                          <td className="py-2 text-right font-semibold tabular-nums">{r.punti}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Link href="/classifica" className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-medium text-porsche">
                Vedi classifica completa <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-ink/45">Nessun punteggio ancora.</p>
          )}
        </div>

        {/* Prossimi eventi */}
        <div className="card flex min-w-0 flex-col p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-base font-semibold">Prossimi eventi</h2>
            <Link href="/eventi" className="inline-flex items-center gap-1 text-xs font-medium text-porsche">
              Vedi tutti gli eventi <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {d?.prossimiEventi.map(e => <EventMini key={e.id} evento={e} />)}
            {d && d.prossimiEventi.length === 0 && (
              <p className="py-8 text-center text-sm text-ink/45">Nessun evento in programma.</p>
            )}
          </div>
        </div>

        {/* Ultimo evento */}
        <div className="card flex min-w-0 flex-col overflow-hidden">
          <div className="px-5 pt-5">
            <h2 className="text-base font-semibold">Ultimo evento</h2>
          </div>
          {ultimo ? (
            <div className="flex flex-1 flex-col p-5">
              <EventThumb immagine={ultimo.immagine} categoria={ultimo.categoria} className="h-40 w-full rounded-lg" />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{dateLong(ultimo.data_evento)}</span>
                <CategoryTag categoria={ultimo.categoria} />
              </div>
              <h3 className="mt-1 text-lg font-bold">{ultimo.titolo}</h3>
              <div className="mt-3 flex gap-8">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-ink/40" />
                  <div className="leading-none">
                    <div className="text-xl font-bold tabular-nums">{ultimo.partecipanti}</div>
                    <div className="mt-0.5 text-xs text-ink/55">Partecipanti</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-ink/40" />
                  <div className="leading-none">
                    <div className="text-xl font-bold tabular-nums">{ultimo.base}</div>
                    <div className="mt-0.5 text-xs text-ink/55">Base punti</div>
                  </div>
                </div>
              </div>
              <Link href={`/eventi/${ultimo.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-porsche">
                Vedi dettagli evento <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-ink/45">Nessun evento.</p>
          )}
        </div>
      </section>
    </div>
  );
}
