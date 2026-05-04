'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EventiTable } from '@/components/eventi-table';
import { EventoFormDialog } from '@/components/evento-form-dialog';
import { api } from '@/lib/api';
import type { Evento } from '@/lib/types';

export default function EventiPage() {
  const [rows, setRows] = useState<Evento[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);

  async function load() { setRows(await api<Evento[]>('/eventi')); }
  useEffect(() => { load(); }, []);

  async function del(e: Evento) {
    if (!confirm(`Eliminare evento "${e.titolo}"? Tutte le partecipazioni saranno rimosse.`)) return;
    await api(`/eventi/${e.id}`, { method: 'DELETE' }); load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Eventi</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>+ Nuovo evento</Button>
      </div>
      <EventiTable rows={rows} onEdit={e => { setEditing(e); setOpen(true); }} onDelete={del} />
      <EventoFormDialog open={open} onOpenChange={setOpen} evento={editing} onSaved={load} />
    </div>
  );
}
