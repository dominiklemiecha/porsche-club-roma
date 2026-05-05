'use client';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Socio } from '@/lib/types';

interface Props {
  rows: Socio[];
  onEdit: (s: Socio) => void;
  onDelete: (s: Socio) => void;
}

export function SociTable({ rows, onEdit, onDelete }: Props) {
  return (
    <Table>
      <Thead><Tr><Th>Tessera</Th><Th>Cognome</Th><Th>Nome</Th><Th>Modello auto</Th><Th></Th></Tr></Thead>
      <Tbody>
        {rows.map(s => (
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
        {rows.length === 0 && <Tr><Td colSpan={5} className="text-center text-ink/50">Nessun socio</Td></Tr>}
      </Tbody>
    </Table>
  );
}
