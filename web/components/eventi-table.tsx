'use client';
import Link from 'next/link';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Evento } from '@/lib/types';

interface Props {
  rows: Evento[];
  onEdit: (e: Evento) => void;
  onDelete: (e: Evento) => void;
  onAddPartecipanti: (e: Evento) => void;
}

export function EventiTable({ rows, onEdit, onDelete, onAddPartecipanti }: Props) {
  return (
    <>
      <div className="sm:hidden space-y-2">
        {rows.map(e => (
          <div key={e.id} className="rounded-md border border-ink/10 bg-paper p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/eventi/${e.id}`} className="block font-medium text-porsche hover:underline truncate">{e.titolo}</Link>
                <div className="mt-0.5 text-xs text-ink/60">{new Date(e.data_evento).toLocaleDateString('it-IT')}</div>
              </div>
              <span className={e.categoria === 'pista'
                ? 'shrink-0 rounded bg-porsche px-2 py-0.5 text-[10px] text-paper font-medium uppercase'
                : 'shrink-0 rounded bg-ink px-2 py-0.5 text-[10px] text-paper font-medium uppercase'}>{e.categoria}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
              <span>Base: <b className="text-ink">{e.punteggio_base}</b></span>
              <span>Prova: <b className="text-ink">{e.prova_abilita ? 'sì' : 'no'}</b></span>
              <span>Partecipanti: <b className="text-ink">{e._count?.partecipazioni ?? 0}</b></span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href={`/eventi/${e.id}`} className="contents"><Button size="sm" variant="outline" className="w-full">Vedi</Button></Link>
              <Button size="sm" variant="outline" onClick={() => onAddPartecipanti(e)}>Partecipanti</Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(e)}>Modifica</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(e)}>Elimina</Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-center text-ink/50 py-6">Nessun evento</div>}
      </div>
      <div className="hidden sm:block">
    <Table>
      <Thead><Tr><Th>Data</Th><Th>Titolo</Th><Th>Categoria</Th><Th>Base</Th><Th>Prova</Th><Th>Partecipanti</Th><Th></Th></Tr></Thead>
      <Tbody>
        {rows.map(e => (
          <Tr key={e.id}>
            <Td>{new Date(e.data_evento).toLocaleDateString('it-IT')}</Td>
            <Td><Link href={`/eventi/${e.id}`} className="text-porsche hover:underline">{e.titolo}</Link></Td>
            <Td><span className={e.categoria === 'pista' ? 'rounded bg-porsche px-2 py-0.5 text-xs text-paper font-medium uppercase' : 'rounded bg-ink px-2 py-0.5 text-xs text-paper font-medium uppercase'}>{e.categoria}</span></Td>
            <Td>{e.punteggio_base}</Td>
            <Td>{e.prova_abilita ? 'sì' : 'no'}</Td>
            <Td>{e._count?.partecipazioni ?? 0}</Td>
            <Td>
              <div className="flex flex-wrap justify-end gap-2">
                <Link href={`/eventi/${e.id}`}><Button size="sm" variant="outline">Vedi</Button></Link>
                <Button size="sm" variant="outline" onClick={() => onAddPartecipanti(e)}>Partecipanti</Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(e)}>Modifica</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(e)}>Elimina</Button>
              </div>
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && <Tr><Td colSpan={7} className="text-center text-ink/50">Nessun evento</Td></Tr>}
      </Tbody>
    </Table>
      </div>
    </>
  );
}
