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

export default function DashboardPage() {
  const [d, setD] = useState<DashboardResponse | null>(null);
  useEffect(() => { api<DashboardResponse>('/dashboard').then(setD); }, []);

  const anno = d?.anno ?? new Date().getFullYear();
  const minor = d?.podio.filter(r => r.posizione >= 4 && r.posizione <= 7) ?? [];
  const ultimo = d?.ultimoEvento ?? null;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="animate-rise relative overflow-hidden rounded-xl2 bg-ink text-paper shadow-card">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url('/hero-track.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-transparent" />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <div className="eyebrow text-porsche">Porsche Club Roma</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Campionato Sociale {anno}</h1>
          <p className="mt-2 max-w-md text-sm text-paper/70">
            Classifiche, eventi e soci del club in un colpo d'occhio.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} value={d?.stats.soci ?? '—'} label="Soci iscritti" href="/soci" linkLabel="Vai ai soci" />
        <StatCard icon={CalendarDays} value={d?.stats.eventi ?? '—'} label="Eventi in stagione" href="/eventi" linkLabel="Vai agli eventi" />
        <StatCard icon={Star} value={d?.stats.puntiAssegnati ?? '—'} label="Punti assegnati" href="/classifica" linkLabel="Vai alla classifica" />
        <StatCard icon={Trophy} value={d?.stats.leader?.punti ?? '—'} label="Leader classifica" href="/classifica" linkLabel="Vedi classifica" />
      </section>

      {/* THREE COLUMNS */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Classifica generale */}
        <div className="card flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Classifica generale</h2>
            <Link href="/classifica" className="inline-flex items-center gap-1 text-xs font-medium text-porsche">
              Vedi tutto <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {d && d.podio.length > 0 ? (
            <>
              <Podium rows={d.podio} />
              {minor.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-lg border border-line">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-canvas text-left text-[11px] uppercase tracking-wide text-ink/45">
                        <th className="px-3 py-2 font-semibold">Pos</th>
                        <th className="px-3 py-2 font-semibold">Socio</th>
                        <th className="px-3 py-2 text-right font-semibold">Punti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {minor.map(r => (
                        <tr key={r.numero_tessera} className="border-t border-line">
                          <td className="px-3 py-2 text-ink/60">{r.posizione}</td>
                          <td className="px-3 py-2">{r.nome} {r.cognome}</td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.punti}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-ink/45">Nessun punteggio ancora.</p>
          )}
        </div>

        {/* Prossimi eventi */}
        <div className="card flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Prossimi eventi</h2>
            <Link href="/eventi" className="inline-flex items-center gap-1 text-xs font-medium text-porsche">
              Vedi tutti <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {d?.prossimiEventi.map(e => <EventMini key={e.id} evento={e} />)}
            {d && d.prossimiEventi.length === 0 && (
              <p className="py-8 text-center text-sm text-ink/45">Nessun evento in programma.</p>
            )}
          </div>
        </div>

        {/* Ultimo evento */}
        <div className="card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-base font-semibold">Ultimo evento</h2>
          </div>
          {ultimo ? (
            <div className="mt-3 flex flex-1 flex-col">
              <EventThumb immagine={ultimo.immagine} categoria={ultimo.categoria} className="h-40 w-full">
                <div className="absolute left-3 top-3 rounded bg-paper/95 px-2 py-1 text-center leading-none shadow-sm">
                  <div className="text-base font-bold text-porsche">
                    {new Date(ultimo.data_evento).toLocaleDateString('it-IT', { day: '2-digit' })}
                  </div>
                  <div className="text-[9px] font-semibold tracking-wide text-ink/60">
                    {new Date(ultimo.data_evento).toLocaleDateString('it-IT', { month: 'short' }).replace('.', '').toUpperCase()}
                  </div>
                </div>
                <span className="absolute right-3 top-3"><CategoryTag categoria={ultimo.categoria} /></span>
              </EventThumb>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold">{ultimo.titolo}</h3>
                <div className="mt-3 flex gap-6">
                  <div>
                    <div className="text-xl font-bold tabular-nums">{ultimo.partecipanti}</div>
                    <div className="text-xs text-ink/55">Partecipanti</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold tabular-nums">{ultimo.base}</div>
                    <div className="text-xs text-ink/55">Base punti</div>
                  </div>
                </div>
                <Link href={`/eventi/${ultimo.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-porsche">
                  Vedi dettagli evento <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-ink/45">Nessun evento.</p>
          )}
        </div>
      </section>
    </div>
  );
}
