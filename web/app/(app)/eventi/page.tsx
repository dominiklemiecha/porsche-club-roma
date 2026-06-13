'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventiTable } from '@/components/eventi-table';
import { EventoFormDialog } from '@/components/evento-form-dialog';
import { PartecipazioniDialog } from '@/components/partecipazioni-dialog';
import { api } from '@/lib/api';
import { useAnni } from '@/lib/anni';
import { sommaBasePerCategoria } from '@/lib/calendario';
import type { Evento, Partecipazione, Socio } from '@/lib/types';

type EventoDetail = Evento & { partecipazioni: (Partecipazione & { socio: Socio })[] };

export default function EventiPage() {
  const { anni, anno, setAnno, attivo, isStorico, aggiungiAnno } = useAnni();
  const [rows, setRows] = useState<Evento[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [partOpen, setPartOpen] = useState(false);
  const [partEvento, setPartEvento] = useState<EventoDetail | null>(null);
  const [search, setSearch] = useState('');

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
    setPartEvento(detail);
    setPartOpen(true);
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
    if (!q) return rows;
    return rows.filter(e =>
      e.titolo.toLowerCase().includes(q) ||
      e.categoria.toLowerCase().includes(q) ||
      new Date(e.data_evento).toLocaleDateString('it-IT').includes(q)
    );
  }, [rows, search]);

  const contatore = useMemo(() => sommaBasePerCategoria(rows), [rows]);
  const sbilanciato = contatore.turismo !== contatore.pista;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Eventi</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={anno ?? ''}
            onChange={e => setAnno(Number(e.target.value))}
            className="h-9 rounded-md border border-ink/30 bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche"
          >
            {anni.map(a => (
              <option key={a.anno} value={a.anno}>{a.anno}{a.attivo ? ' (attivo)' : ''}</option>
            ))}
          </select>
          <Button variant="outline" onClick={nuovoAnno}>+ Anno</Button>
          <Input
            placeholder="Cerca eventi…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="sm:w-56"
          />
          <Button onClick={() => { setEditing(null); setOpen(true); }} disabled={isStorico}>+ Nuovo evento</Button>
        </div>
      </div>

      {isStorico && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Anno {anno} in sola lettura (storico). Per modificarlo, attivalo dal pulsante “+ Anno” inserendo {anno}.
        </div>
      )}

      <EventiTable
        rows={filtered}
        readOnly={isStorico}
        onEdit={e => { setEditing(e); setOpen(true); }}
        onDelete={del}
        onAddPartecipanti={openPartecipanti}
      />

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-md border border-ink/10 bg-paper px-3 py-1.5 shadow-sm">
          Turismo (base a calendario): <b>{contatore.turismo}</b>
        </span>
        <span className="rounded-md border border-ink/10 bg-paper px-3 py-1.5 shadow-sm">
          Pista (base a calendario): <b>{contatore.pista}</b>
        </span>
        <span className="rounded-md border border-ink/10 bg-paper px-3 py-1.5 shadow-sm">
          Istituzionale: <b>{contatore.istituzionale}</b>
        </span>
        {sbilanciato && (
          <span className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-800 shadow-sm">
            ⚠ Turismo e Pista non equiparati (Δ {Math.abs(contatore.turismo - contatore.pista)})
          </span>
        )}
      </div>

      <EventoFormDialog open={open} onOpenChange={setOpen} evento={editing} anno={anno} onSaved={load} />
      {partEvento && (
        <PartecipazioniDialog
          open={partOpen}
          onOpenChange={setPartOpen}
          evento={partEvento}
          current={partEvento.partecipazioni}
          onSaved={load}
        />
      )}
    </div>
  );
}
