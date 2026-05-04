'use client';
import Link from 'next/link';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Evento } from '@/lib/types';

interface Props { rows: Evento[]; onEdit: (e: Evento) => void; onDelete: (e: Evento) => void; }

export function EventiTable({ rows, onEdit, onDelete }: Props) {
  return (
    <Table>
      <Thead><Tr><Th>Data</Th><Th>Titolo</Th><Th>Categoria</Th><Th>Base</Th><Th>Prova</Th><Th>Partecipanti</Th><Th></Th></Tr></Thead>
      <Tbody>
        {rows.map(e => (
          <Tr key={e.id}>
            <Td>{new Date(e.data_evento).toLocaleDateString('it-IT')}</Td>
            <Td><Link href={`/eventi/${e.id}`} className="text-porsche hover:underline">{e.titolo}</Link></Td>
            <Td><span className={e.categoria === 'pista' ? 'rounded bg-red-100 px-2 py-0.5 text-xs text-red-700' : 'rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700'}>{e.categoria}</span></Td>
            <Td>{e.punteggio_base}</Td>
            <Td>{e.prova_abilita ? 'sì' : 'no'}</Td>
            <Td>{e._count?.partecipazioni ?? 0}</Td>
            <Td className="text-right">
              <Button size="sm" variant="ghost" onClick={() => onEdit(e)}>Modifica</Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(e)}>Elimina</Button>
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && <Tr><Td colSpan={7} className="text-center text-neutral-500">Nessun evento</Td></Tr>}
      </Tbody>
    </Table>
  );
}
