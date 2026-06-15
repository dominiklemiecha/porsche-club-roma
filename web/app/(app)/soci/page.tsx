'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SociTable } from '@/components/soci-table';
import { SocioFormDialog } from '@/components/socio-form-dialog';
import { api } from '@/lib/api';
import { carBodyType, type CarBody } from '@/lib/car-model';
import { cn } from '@/lib/utils';
import type { Socio } from '@/lib/types';

const PAGE_SIZE = 12;
const MODELLI: [string, string][] = [
  ['tutti', 'Tutti i modelli'], ['sport911', '911'], ['sport718', '718 Cayman/Boxster'], ['suv', 'SUV Cayenne/Macan'], ['sedan', 'Panamera/Taycan'],
];

function pageList(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const lo = Math.max(2, cur - 1), hi = Math.min(total - 1, cur + 1);
  if (lo > 2) out.push('…');
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < total - 1) out.push('…');
  out.push(total);
  return out;
}

export default function SociPage() {
  const [rows, setRows] = useState<Socio[]>([]);
  const [q, setQ] = useState('');
  const [modello, setModello] = useState('tutti');
  const [part, setPart] = useState('tutti');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Socio | null>(null);

  async function load() {
    setRows(await api<Socio[]>(`/soci${q ? `?q=${encodeURIComponent(q)}` : ''}`));
  }
  useEffect(() => { load(); }, [q]);
  useEffect(() => { setPage(1); }, [q, modello, part]);

  async function del(s: Socio) {
    if (!confirm(`Eliminare ${s.cognome} ${s.nome}?`)) return;
    try { await api(`/soci/${s.id}`, { method: 'DELETE' }); load(); }
    catch (e: any) { alert(e.message); }
  }

  const filtered = useMemo(() => rows.filter(s => {
    if (modello !== 'tutti' && carBodyType(s.modello_auto) !== (modello as CarBody)) return false;
    const n = s._count?.partecipazioni ?? 0;
    if (part === 'con' && n === 0) return false;
    if (part === 'senza' && n > 0) return false;
    return true;
  }), [rows, modello, part]);

  const maxPart = useMemo(() => rows.reduce((m, s) => Math.max(m, s._count?.partecipazioni ?? 0), 0), [rows]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Soci</h1>
        <p className="mt-1 text-sm text-ink/55">{rows.length} membri attivi</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input placeholder="Cerca socio, tessera o Porsche…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
        </div>
        <select value={modello} onChange={e => setModello(e.target.value)}
          className="h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche">
          {MODELLI.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={part} onChange={e => setPart(e.target.value)}
          className="h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche">
          <option value="tutti">Tutti</option>
          <option value="con">Con partecipazioni</option>
          <option value="senza">Senza partecipazioni</option>
        </select>
        <Button variant="dark" onClick={() => { setEditing(null); setOpen(true); }}>+ Nuovo socio</Button>
      </div>

      <SociTable rows={pageRows} maxPart={maxPart} onEdit={s => { setEditing(s); setOpen(true); }} onDelete={del} />

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {pageList(page, totalPages).map((p, i) => p === '…'
            ? <span key={`e${i}`} className="px-2 text-ink/40">…</span>
            : <button key={p} onClick={() => setPage(p)}
                className={cn('h-9 min-w-9 rounded-md px-3 text-sm font-medium transition',
                  p === page ? 'bg-porsche text-paper' : 'border border-line bg-paper hover:bg-ink/[0.04]')}>
                {p}
              </button>)}
        </div>
      )}

      <SocioFormDialog open={open} onOpenChange={setOpen} socio={editing} onSaved={load} />
    </div>
  );
}
