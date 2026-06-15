'use client';
import { useEffect, useMemo, useState } from 'react';
import { FileText, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClassificaTable } from '@/components/classifica-table';
import { ClassificaDetail } from '@/components/classifica-detail';
import { Podium } from '@/components/dashboard/podium';
import { api, apiPdf } from '@/lib/api';
import { useAnni } from '@/lib/anni';
import { cn } from '@/lib/utils';
import type { ClassificaResponse, Evento, Scope } from '@/lib/types';

type FilterMode = 'none' | 'month' | 'range';
const TABS: [Scope, string][] = [['turismo', 'Turismo'], ['pista', 'Pista'], ['totale', 'Totale'], ['istituzionale', 'Istituzionale']];

function computeRange(mode: FilterMode, month: string, from: string, to: string) {
  if (mode === 'month' && month) {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
  }
  if (mode === 'range') return { from: from || undefined, to: to || undefined };
  return { from: undefined, to: undefined };
}

export default function ClassificaPage() {
  const { anni, anno, setAnno } = useAnni();
  const [scope, setScope] = useState<Scope>('totale');
  const [data, setData] = useState<ClassificaResponse | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [mode, setMode] = useState<FilterMode>('none');
  const [month, setMonth] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [allEventi, setAllEventi] = useState<Evento[]>([]);
  const [selectedEventi, setSelectedEventi] = useState<Set<number>>(new Set());
  const [eventoFilterOn, setEventoFilterOn] = useState(false);

  const range = useMemo(() => computeRange(mode, month, from, to), [mode, month, from, to]);

  useEffect(() => { if (anno != null) api<Evento[]>(`/eventi?anno=${anno}`).then(setAllEventi); }, [anno]);

  const eventiForPicker = useMemo(() => {
    const cats: string[] = scope === 'totale' ? ['turismo', 'pista'] : [scope];
    return allEventi.filter(e => cats.includes(e.categoria))
      .sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime());
  }, [scope, allEventi]);

  useEffect(() => { setSelectedEventi(new Set(eventiForPicker.map(e => e.id))); }, [eventiForPicker]);

  const eventiQuery = useMemo(() => {
    if (!eventoFilterOn) return undefined;
    if (selectedEventi.size === 0 || selectedEventi.size === eventiForPicker.length) return undefined;
    return [...selectedEventi].join(',');
  }, [eventoFilterOn, selectedEventi, eventiForPicker]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams({ categoria: scope });
    if (anno != null) p.set('anno', String(anno));
    if (range.from) p.set('from', range.from);
    if (range.to) p.set('to', range.to);
    if (eventiQuery) p.set('eventi', eventiQuery);
    return p.toString();
  }, [scope, anno, range, eventiQuery]);

  useEffect(() => {
    if (anno == null) return;
    api<ClassificaResponse>(`/classifica?${queryString}`).then(d => { setData(d); setSelected(null); });
  }, [queryString, anno]);

  async function pdf() {
    const p = new URLSearchParams({ categoria: scope });
    if (anno != null) p.set('anno', String(anno));
    if (range.from) p.set('from', range.from);
    if (range.to) p.set('to', range.to);
    if (eventiQuery) p.set('eventi', eventiQuery);
    const blob = await apiPdf(`/pdf/classifica?${p.toString()}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `classifica-${scope}-${anno}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  function toggleEvento(id: number) {
    const s = new Set(selectedEventi); s.has(id) ? s.delete(id) : s.add(id); setSelectedEventi(s);
  }

  const podio = useMemo(() => (data?.righe ?? []).slice(0, 3).map(r => ({
    posizione: r.posizione, nome: r.socio.nome, cognome: r.socio.cognome, modello_auto: r.socio.modello_auto, punti: r.totale,
  })), [data]);

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classifica generale</h1>
          <p className="mt-1 text-sm text-ink/55">Stagione {anno ?? '—'}</p>
        </div>
        <select value={anno ?? ''} onChange={e => setAnno(Number(e.target.value))}
          className="h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche">
          {anni.map(a => <option key={a.anno} value={a.anno}>Stagione {a.anno}{a.attivo ? ' (attiva)' : ''}</option>)}
        </select>
      </div>

      {/* Tabs + filters toggle */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setScope(key)}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium transition',
              scope === key ? 'bg-ink text-paper' : 'border border-line bg-paper text-ink hover:bg-ink/[0.03]')}>
            {label}
          </button>
        ))}
        <Button variant="outline" onClick={() => setShowFilters(v => !v)} className="ml-auto gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Filtri
        </Button>
      </div>

      {showFilters && (
        <div className="mb-5 space-y-3 rounded-xl2 border border-line bg-paper p-3 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1">
              <Label>Periodo</Label>
              <select value={mode} onChange={e => setMode(e.target.value as FilterMode)}
                className="h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche">
                <option value="none">Nessuno</option><option value="month">Mese</option><option value="range">Intervallo</option>
              </select>
            </div>
            {mode === 'month' && (
              <div className="flex flex-col gap-1"><Label htmlFor="month">Mese</Label>
                <Input id="month" type="month" value={month} onChange={e => setMonth(e.target.value)} className="sm:w-48" /></div>
            )}
            {mode === 'range' && (<>
              <div className="flex flex-col gap-1"><Label htmlFor="from">Da</Label>
                <Input id="from" type="date" value={from} onChange={e => setFrom(e.target.value)} className="sm:w-44" /></div>
              <div className="flex flex-col gap-1"><Label htmlFor="to">A</Label>
                <Input id="to" type="date" value={to} onChange={e => setTo(e.target.value)} className="sm:w-44" /></div>
            </>)}
            <label className="flex items-center gap-2 text-sm sm:ml-auto">
              <input type="checkbox" checked={eventoFilterOn} onChange={e => setEventoFilterOn(e.target.checked)} /> Filtra per eventi
            </label>
          </div>
          {eventoFilterOn && (
            <div className="grid grid-cols-1 gap-1 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {eventiForPicker.map(e => (
                <label key={e.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-cream/40">
                  <input type="checkbox" checked={selectedEventi.has(e.id)} onChange={() => toggleEvento(e.id)} />
                  <span className="truncate">{e.titolo}</span>
                </label>
              ))}
              {eventiForPicker.length === 0 && <span className="text-sm text-ink/50">Nessun evento</span>}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {data && podio.length > 0 && <Podium rows={podio} carded />}
          {data && <ClassificaTable data={data} selectedId={selected ?? data.righe[0]?.socio.id ?? null} onSelect={setSelected} />}
          <button onClick={pdf} className="inline-flex items-center gap-2 text-sm font-semibold text-porsche hover:underline">
            <FileText className="h-4 w-4" /> Esporta classifica PDF
          </button>
        </div>
        {data && <ClassificaDetail data={data} socioId={selected} />}
      </div>
    </div>
  );
}
