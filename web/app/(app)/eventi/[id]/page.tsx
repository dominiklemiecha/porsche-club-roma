'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { PartecipazioniDialog } from '@/components/partecipazioni-dialog';
import { api, apiPdf } from '@/lib/api';
import type { Evento, Partecipazione, Socio } from '@/lib/types';

type EventoDetail = Evento & { partecipazioni: (Partecipazione & { socio: Socio })[] };

export default function EventoPage() {
  const { id } = useParams<{ id: string }>();
  const [ev, setEv] = useState<EventoDetail | null>(null);
  const [open, setOpen] = useState(false);

  async function load() { setEv(await api<EventoDetail>(`/eventi/${id}`)); }
  useEffect(() => { load(); }, [id]);

  async function downloadPdf() {
    const blob = await apiPdf(`/pdf/evento/${id}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `evento-${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!ev) return <div>Caricamento…</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{ev.titolo}</h1>
          <p className="text-sm text-neutral-600">
            {new Date(ev.data_evento).toLocaleDateString('it-IT')} · {ev.categoria} · base {ev.punteggio_base} pt
            {ev.prova_abilita && ev.scala_prova && ` · prova: ${ev.scala_prova.join('/')}`}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={downloadPdf}>Scarica PDF</Button>
          <Button onClick={() => setOpen(true)}>Registra partecipanti</Button>
        </div>
      </div>

      <Table>
        <Thead><Tr>
          {ev.prova_abilita && <Th>Pos. prova</Th>}
          <Th>Tessera</Th><Th>Cognome</Th><Th>Nome</Th><Th>Punteggio</Th>
        </Tr></Thead>
        <Tbody>
          {ev.partecipazioni.map(p => (
            <Tr key={p.id}>
              {ev.prova_abilita && <Td>{p.posizione_prova ?? '—'}</Td>}
              <Td>{p.socio.numero_tessera}</Td>
              <Td>{p.socio.cognome}</Td>
              <Td>{p.socio.nome}</Td>
              <Td className="font-semibold">{p.punteggio_totale}</Td>
            </Tr>
          ))}
          {ev.partecipazioni.length === 0 && <Tr><Td colSpan={5} className="text-center text-neutral-500">Nessun partecipante</Td></Tr>}
        </Tbody>
      </Table>

      <PartecipazioniDialog open={open} onOpenChange={setOpen} evento={ev} current={ev.partecipazioni} onSaved={load} />
    </div>
  );
}
