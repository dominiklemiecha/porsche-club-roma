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
  );
}
