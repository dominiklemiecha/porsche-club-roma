'use client';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import type { ClassificaResponse } from '@/lib/types';

export function ClassificaTable({ data }: { data: ClassificaResponse }) {
  return (
    <>
      <div className="sm:hidden space-y-2">
        {data.righe.map(r => (
          <div key={r.socio.id} className="rounded-md border border-ink/10 bg-paper p-3 shadow-sm">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-lg font-bold text-porsche shrink-0">{r.posizione}°</span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.socio.cognome} {r.socio.nome}</div>
                  <div className="text-xs text-ink/60">#{r.socio.numero_tessera}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-ink/60">Tot</div>
                <div className="text-lg font-bold">{r.totale}</div>
              </div>
            </div>
            {data.eventi.some(e => r.punti_per_evento[e.id] != null) && (
              <ul className="mt-2 divide-y divide-ink/5 border-t border-ink/5 text-xs">
                {data.eventi.map(e => {
                  const p = r.punti_per_evento[e.id];
                  if (p == null) return null;
                  return (
                    <li key={e.id} className="flex items-center justify-between py-1">
                      <span className="truncate text-ink/70">{e.titolo}</span>
                      <span className="ml-2 font-medium">{p}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
        {data.righe.length === 0 && <div className="text-center text-ink/50 py-6">Nessun dato</div>}
      </div>
      <div className="hidden sm:block overflow-x-auto">
      <Table>
        <Thead>
          <Tr>
            <Th>Pos</Th><Th>Tessera</Th><Th>Cognome</Th><Th>Nome</Th>
            {data.eventi.map(e => (
              <Th key={e.id} className="text-center" title={e.titolo}>
                {e.titolo.length > 18 ? e.titolo.slice(0, 16) + '…' : e.titolo}
                <br />
                <span className="text-[10px] font-normal opacity-70">
                  {new Date(e.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                </span>
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
                <Td key={e.id} className="text-center">{r.punti_per_evento[e.id] ?? ''}</Td>
              ))}
              <Td className="text-right font-bold">{r.totale}</Td>
            </Tr>
          ))}
          {data.righe.length === 0 && <Tr><Td colSpan={4 + data.eventi.length + 1} className="text-center text-neutral-500">Nessun dato</Td></Tr>}
        </Tbody>
      </Table>
      </div>
    </>
  );
}
