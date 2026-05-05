'use client';
import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClassificaTable } from '@/components/classifica-table';
import { api, apiPdf } from '@/lib/api';
import type { Categoria, ClassificaResponse, Evento } from '@/lib/types';

type FilterMode = 'none' | 'year' | 'month' | 'range';
type PdfScope = 'turismo' | 'pista' | 'both';

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = `${CURRENT_YEAR}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;

function computeRange(mode: FilterMode, year: string, month: string, from: string, to: string) {
  if (mode === 'year' && year) {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
  if (mode === 'month' && month) {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
  }
  if (mode === 'range') {
    return { from: from || undefined, to: to || undefined };
  }
  return { from: undefined, to: undefined };
}

export default function ClassificaPage() {
  const [cat, setCat] = useState<Categoria>('turismo');
  const [data, setData] = useState<ClassificaResponse | null>(null);

  const [mode, setMode] = useState<FilterMode>('none');
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [allEventi, setAllEventi] = useState<Evento[]>([]);
  const [selectedEventi, setSelectedEventi] = useState<Set<number>>(new Set());
  const [eventoFilterOn, setEventoFilterOn] = useState(false);

  const [pdfScope, setPdfScope] = useState<PdfScope>('turismo');
  const [hasBoth, setHasBoth] = useState(false);

  const range = useMemo(() => computeRange(mode, year, month, from, to), [mode, year, month, from, to]);

  // load events of current categoria for the picker
  useEffect(() => {
    api<Evento[]>(`/eventi?categoria=${cat}`).then(rows => {
      setAllEventi(rows);
      setSelectedEventi(new Set(rows.map(r => r.id)));
    });
  }, [cat]);

  // detect if both categories have events (to enable "Entrambi")
  useEffect(() => {
    Promise.all([
      api<Evento[]>('/eventi?categoria=turismo'),
      api<Evento[]>('/eventi?categoria=pista'),
    ]).then(([t, p]) => setHasBoth(t.length > 0 && p.length > 0));
  }, []);

  useEffect(() => { setPdfScope(cat); }, [cat]);

  const eventiQuery = useMemo(() => {
    if (!eventoFilterOn) return undefined;
    if (selectedEventi.size === 0 || selectedEventi.size === allEventi.length) return undefined;
    return [...selectedEventi].join(',');
  }, [eventoFilterOn, selectedEventi, allEventi]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams({ categoria: cat });
    if (range.from) p.set('from', range.from);
    if (range.to) p.set('to', range.to);
    if (eventiQuery) p.set('eventi', eventiQuery);
    return p.toString();
  }, [cat, range, eventiQuery]);

  useEffect(() => {
    api<ClassificaResponse>(`/classifica?${queryString}`).then(setData);
  }, [queryString]);

  async function pdf() {
    const p = new URLSearchParams({ categoria: pdfScope });
    if (range.from) p.set('from', range.from);
    if (range.to) p.set('to', range.to);
    if (eventiQuery) p.set('eventi', eventiQuery);
    const blob = await apiPdf(`/pdf/classifica?${p.toString()}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classifica-${pdfScope}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleEvento(id: number) {
    const s = new Set(selectedEventi);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedEventi(s);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Classifica</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pdfScope}
            onChange={e => setPdfScope(e.target.value as PdfScope)}
            className="h-9 rounded-md border border-ink/30 bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche"
          >
            <option value="turismo">Turismo</option>
            <option value="pista">Pista</option>
            {hasBoth && <option value="both">Entrambi</option>}
          </select>
          <Button variant="outline" onClick={pdf}>Scarica PDF</Button>
        </div>
      </div>

      <div className="mb-4 rounded-md border border-ink/10 bg-paper p-3 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1">
            <Label>Filtro periodo</Label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value as FilterMode)}
              className="h-9 rounded-md border border-ink/30 bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche"
            >
              <option value="none">Nessuno</option>
              <option value="year">Anno</option>
              <option value="month">Mese</option>
              <option value="range">Intervallo</option>
            </select>
          </div>

          {mode === 'year' && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="year">Anno</Label>
              <Input id="year" type="number" min="2000" max="2100" value={year} onChange={e => setYear(e.target.value)} className="sm:w-32" />
            </div>
          )}
          {mode === 'month' && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="month">Mese</Label>
              <Input id="month" type="month" value={month} onChange={e => setMonth(e.target.value)} className="sm:w-48" />
            </div>
          )}
          {mode === 'range' && (
            <>
              <div className="flex flex-col gap-1">
                <Label htmlFor="from">Da</Label>
                <Input id="from" type="date" value={from} onChange={e => setFrom(e.target.value)} className="sm:w-44" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="to">A</Label>
                <Input id="to" type="date" value={to} onChange={e => setTo(e.target.value)} className="sm:w-44" />
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm sm:ml-auto">
            <input
              type="checkbox"
              checked={eventoFilterOn}
              onChange={e => setEventoFilterOn(e.target.checked)}
            />
            Filtra per eventi
          </label>
        </div>

        {eventoFilterOn && (
          <div className="border-t border-ink/10 pt-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Eventi {cat}:</span>
              <button
                type="button"
                onClick={() => setSelectedEventi(new Set(allEventi.map(e => e.id)))}
                className="text-xs text-porsche hover:underline"
              >
                Seleziona tutti
              </button>
              <button
                type="button"
                onClick={() => setSelectedEventi(new Set())}
                className="text-xs text-porsche hover:underline"
              >
                Nessuno
              </button>
              <span className="ml-auto text-xs text-ink/60">{selectedEventi.size}/{allEventi.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {allEventi.map(e => (
                <label key={e.id} className="flex items-center gap-2 text-sm rounded px-2 py-1 hover:bg-cream/30">
                  <input
                    type="checkbox"
                    checked={selectedEventi.has(e.id)}
                    onChange={() => toggleEvento(e.id)}
                  />
                  <span className="truncate">
                    <span className="text-ink/50 mr-1">{new Date(e.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</span>
                    {e.titolo}
                  </span>
                </label>
              ))}
              {allEventi.length === 0 && <span className="text-sm text-ink/50">Nessun evento</span>}
            </div>
          </div>
        )}
      </div>

      <Tabs value={cat} onValueChange={v => setCat(v as Categoria)}>
        <TabsList>
          <TabsTrigger value="turismo">Turismo</TabsTrigger>
          <TabsTrigger value="pista">Pista</TabsTrigger>
        </TabsList>
        <TabsContent value="turismo">{data && cat === 'turismo' && <ClassificaTable data={data} />}</TabsContent>
        <TabsContent value="pista">{data && cat === 'pista' && <ClassificaTable data={data} />}</TabsContent>
      </Tabs>
    </div>
  );
}
