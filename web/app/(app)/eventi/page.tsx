'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/event-card';
import { EventoFormDialog } from '@/components/evento-form-dialog';
import { PartecipazioniDialog } from '@/components/partecipazioni-dialog';
import { api, apiUpload } from '@/lib/api';
import { useAnni } from '@/lib/anni';
import { sommaBasePerCategoria } from '@/lib/calendario';
import { cn } from '@/lib/utils';
import type { Categoria, Evento, Partecipazione, Socio } from '@/lib/types';

type EventoDetail = Evento & { partecipazioni: (Partecipazione & { socio: Socio })[] };
type Filtro = 'tutti' | Categoria;

const PILLS: [Filtro, string][] = [
  ['tutti', 'Tutti'], ['turismo', 'Turismo'], ['pista', 'Pista'], ['istituzionale', 'Istituzionale'],
];

export default function EventiPage() {
  const { anni, anno, setAnno, attivo, isStorico, aggiungiAnno } = useAnni();
  const [rows, setRows] = useState<Evento[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [partOpen, setPartOpen] = useState(false);
  const [partEvento, setPartEvento] = useState<EventoDetail | null>(null);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('tutti');

  const fileRef = useRef<HTMLInputElement>(null);
  const imgTarget = useRef<Evento | null>(null);

  async function load() {
    if (anno == null) return;
    setRows(await api<Evento[]>(`/eventi?anno=${anno}`));
  }
  useEffect(() => { load(); }, [anno]);

  async function del(e: Evento) {
    if (!confirm(`Eliminare evento "${e.titolo}"? Tutte le partecipazioni saranno rimosse.`)) return;
    await api(`/eventi/${e.id}`, { method: 'DELETE' }); load();
  }

  async function openPartecipanti(e: Evento) {
    const detail = await api<EventoDetail>(`/eventi/${e.id}`);
    setPartEvento(detail); setPartOpen(true);
  }

  function chooseImage(e: Evento) { imgTarget.current = e; fileRef.current?.click(); }
  async function onFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]; const e = imgTarget.current;
    ev.target.value = '';
    if (!file || !e) return;
    try { await apiUpload(`/eventi/${e.id}/immagine`, file); await load(); }
    catch (err: any) { alert(err.message); }
  }

  async function nuovoAnno() {
    const def = String((attivo ?? new Date().getFullYear()) + 1);
    const v = prompt('Nuovo anno da attivare:', def);
    if (!v) return;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 2000 || n > 2100) { alert('Anno non valido'); return; }
    await aggiungiAnno(n);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(e =>
      (filtro === 'tutti' || e.categoria === filtro) &&
      (!q || e.titolo.toLowerCase().includes(q) || new Date(e.data_evento).toLocaleDateString('it-IT').includes(q))
    );
  }, [rows, search, filtro]);

  const contatore = useMemo(() => sommaBasePerCategoria(rows), [rows]);
  const sbilanciato = contatore.turismo !== contatore.pista;

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />

      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventi</h1>
          <p className="mt-1 text-sm text-ink/55">{rows.length} eventi in stagione</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={anno ?? ''}
            onChange={e => setAnno(Number(e.target.value))}
            className="h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche"
          >
            {anni.map(a => <option key={a.anno} value={a.anno}>{a.anno}{a.attivo ? ' (attivo)' : ''}</option>)}
          </select>
          <Button variant="outline" onClick={nuovoAnno}>+ Anno</Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {PILLS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition',
                filtro === key ? 'bg-ink text-paper' : 'border border-line bg-paper text-ink hover:bg-ink/[0.03]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input placeholder="Cerca evento…" value={search} onChange={e => setSearch(e.target.value)} className="sm:w-64" />
          </div>
          <Button variant="dark" onClick={() => { setEditing(null); setOpen(true); }} disabled={isStorico}>+ Nuovo evento</Button>
        </div>
      </div>

      {isStorico && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Anno {anno} in sola lettura (storico). Per modificarlo, riattivalo con “+ Anno” inserendo {anno}.
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(e => (
            <EventCard
              key={e.id}
              evento={e}
              readOnly={isStorico}
              onEdit={ev => { setEditing(ev); setOpen(true); }}
              onDelete={del}
              onPartecipanti={openPartecipanti}
              onImmagine={chooseImage}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-ink/45">Nessun evento</div>
      )}

      {/* Contatore */}
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <span className="rounded-md border border-line bg-paper px-3 py-1.5 shadow-card">Turismo (base a calendario): <b>{contatore.turismo}</b></span>
        <span className="rounded-md border border-line bg-paper px-3 py-1.5 shadow-card">Pista (base a calendario): <b>{contatore.pista}</b></span>
        <span className="rounded-md border border-line bg-paper px-3 py-1.5 shadow-card">Istituzionale: <b>{contatore.istituzionale}</b></span>
        {sbilanciato && (
          <span className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-800 shadow-card">
            ⚠ Turismo e Pista non equiparati (Δ {Math.abs(contatore.turismo - contatore.pista)})
          </span>
        )}
      </div>

      <EventoFormDialog open={open} onOpenChange={setOpen} evento={editing} anno={anno} onSaved={load} />
      {partEvento && (
        <PartecipazioniDialog open={partOpen} onOpenChange={setPartOpen} evento={partEvento} current={partEvento.partecipazioni} onSaved={load} />
      )}
    </div>
  );
}
