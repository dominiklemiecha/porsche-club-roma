'use client';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import type { ClassificaResponse } from '@/lib/types';

export function ClassificaTable({ data }: { data: ClassificaResponse }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <Thead>
          <Tr>
            <Th>Pos</Th><Th>Tessera</Th><Th>Cognome</Th><Th>Nome</Th>
            {data.eventi.map(e => (
              <Th key={e.id} className="text-center" title={e.titolo}>
                {new Date(e.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
              </Th>
            ))}
            <Th className="text-right">Tot</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.righe.map(r => (
            <Tr key={r.socio.id}>
              <Td>{r.posizione}</Td>
              <Td>{r.socio.numero_tessera}</Td>
              <Td>{r.socio.cognome}</Td>
              <Td>{r.socio.nome}</Td>
              {data.eventi.map(e => (
                <Td key={e.id} className="text-center">{r.punti_per_evento[String(e.id)] ?? ''}</Td>
              ))}
              <Td className="text-right font-bold">{r.totale}</Td>
            </Tr>
          ))}
          {data.righe.length === 0 && <Tr><Td colSpan={4 + data.eventi.length + 1} className="text-center text-neutral-500">Nessun dato</Td></Tr>}
        </Tbody>
      </Table>
    </div>
  );
}
