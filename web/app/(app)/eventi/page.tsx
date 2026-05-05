'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventiTable } from '@/components/eventi-table';
import { EventoFormDialog } from '@/components/evento-form-dialog';
import { PartecipazioniDialog } from '@/components/partecipazioni-dialog';
import { api } from '@/lib/api';
import type { Evento, Partecipazione, Socio } from '@/lib/types';

type EventoDetail = Evento & { partecipazioni: (Partecipazione & { socio: Socio })[] };

export default function EventiPage() {
  const [rows, setRows] = useState<Evento[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [partOpen, setPartOpen] = useState(false);
  const [partEvento, setPartEvento] = useState<EventoDetail | null>(null);
  const [search, setSearch] = useState('');

  async function load() { setRows(await api<Evento[]>('/eventi')); }
  useEffect(() => { load(); }, []);

  async function del(e: Evento) {
    if (!confirm(`Eliminare evento "${e.titolo}"? Tutte le partecipazioni saranno rimosse.`)) return;
    await api(`/eventi/${e.id}`, { method: 'DELETE' }); load();
  }

  async function openPartecipanti(e: Evento) {
    const detail = await api<EventoDetail>(`/eventi/${e.id}`);
    setPartEvento(detail);
    setPartOpen(true);
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

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Eventi</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Cerca eventi…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Button onClick={() => { setEditing(null); setOpen(true); }}>+ Nuovo evento</Button>
        </div>
      </div>
      <EventiTable
        rows={filtered}
        onEdit={e => { setEditing(e); setOpen(true); }}
        onDelete={del}
        onAddPartecipanti={openPartecipanti}
      />
      <EventoFormDialog open={open} onOpenChange={setOpen} evento={editing} onSaved={load} />
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
