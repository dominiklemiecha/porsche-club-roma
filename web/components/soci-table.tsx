'use client';
import { useMemo, useState } from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Socio } from '@/lib/types';

interface Props {
  rows: Socio[];
  onEdit: (s: Socio) => void;
  onDelete: (s: Socio) => void;
}

type SortKey = 'numero_tessera' | 'cognome' | 'nome' | 'modello_auto';
type SortDir = 'asc' | 'desc' | null;

const COLS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'numero_tessera', label: 'Tessera', numeric: true },
  { key: 'cognome', label: 'Cognome' },
  { key: 'nome', label: 'Nome' },
  { key: 'modello_auto', label: 'Modello auto' },
];

export function SociTable({ rows, onEdit, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function toggleSort(key: SortKey) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    if (sortDir === 'desc') { setSortKey(null); setSortDir(null); return; }
    setSortDir('asc');
  }

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return rows;
    const numeric = COLS.find(c => c.key === sortKey)?.numeric;
    const mul = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const aNull = av === null || av === undefined || av === '';
      const bNull = bv === null || bv === undefined || bv === '';
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      if (numeric) return (Number(av) - Number(bv)) * mul;
      return String(av).localeCompare(String(bv), 'it', { sensitivity: 'base' }) * mul;
    });
  }, [rows, sortKey, sortDir]);

  function indicator(key: SortKey) {
    if (sortKey !== key) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  const sortControls = (
    <div className="sm:hidden mb-3 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-ink/60">Ordina:</span>
      {COLS.map(c => (
        <button key={c.key} type="button" onClick={() => toggleSort(c.key)}
          className={cn('rounded-md border border-ink/15 px-2 py-1', sortKey === c.key && 'bg-ink text-paper border-ink')}>
          {c.label}{sortKey === c.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {sortControls}
      <div className="sm:hidden space-y-2">
        {sorted.map(s => (
          <div key={s.id} className="rounded-md border border-ink/10 bg-paper p-3 shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-medium">{s.cognome} {s.nome}</div>
              <div className="text-xs text-ink/60">#{s.numero_tessera}</div>
            </div>
            <div className="mt-1 text-sm text-ink/70">{s.modello_auto ?? '—'}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(s)}>Modifica</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(s)}>Elimina</Button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="text-center text-ink/50 py-6">Nessun socio</div>}
      </div>
      <div className="hidden sm:block">
      <Table>
      <Thead>
        <Tr>
          {COLS.map(c => (
            <Th key={c.key}>
              <button type="button" onClick={() => toggleSort(c.key)} className="flex items-center font-medium hover:opacity-80">
                {c.label}{indicator(c.key)}
              </button>
            </Th>
          ))}
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {sorted.map(s => (
          <Tr key={s.id}>
            <Td>{s.numero_tessera}</Td>
            <Td>{s.cognome}</Td>
            <Td>{s.nome}</Td>
            <Td className="text-ink/70">{s.modello_auto ?? '—'}</Td>
            <Td>
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(s)}>Modifica</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(s)}>Elimina</Button>
              </div>
            </Td>
          </Tr>
        ))}
        {sorted.length === 0 && <Tr><Td colSpan={5} className="text-center text-ink/50">Nessun socio</Td></Tr>}
      </Tbody>
    </Table>
      </div>
    </>
  );
}
