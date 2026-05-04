'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SociTable } from '@/components/soci-table';
import { SocioFormDialog } from '@/components/socio-form-dialog';
import { api } from '@/lib/api';
import type { Socio } from '@/lib/types';

export default function SociPage() {
  const [rows, setRows] = useState<Socio[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Socio | null>(null);

  async function load() {
    setRows(await api<Socio[]>(`/soci${q ? `?q=${encodeURIComponent(q)}` : ''}`));
  }
  useEffect(() => { load(); }, [q]);

  async function del(s: Socio) {
    if (!confirm(`Eliminare ${s.cognome} ${s.nome}?`)) return;
    try { await api(`/soci/${s.id}`, { method: 'DELETE' }); load(); }
    catch (e: any) { alert(e.message); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Soci</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>+ Nuovo socio</Button>
      </div>
      <Input placeholder="Cerca per cognome o tessera…" value={q} onChange={e => setQ(e.target.value)} className="mb-4 max-w-sm" />
      <SociTable rows={rows} onEdit={s => { setEditing(s); setOpen(true); }} onDelete={del} />
      <SocioFormDialog open={open} onOpenChange={setOpen} socio={editing} onSaved={load} />
    </div>
  );
}
