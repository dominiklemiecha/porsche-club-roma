'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { Evento, Partecipazione, Socio } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  evento: Evento;
  current: Partecipazione[];
  onSaved: () => void;
}

interface Selected { socio_id: number; posizione_prova: number | null; }

export function PartecipazioniDialog({ open, onOpenChange, evento, current, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [soci, setSoci] = useState<Socio[]>([]);
  const [selected, setSelected] = useState<Map<number, Selected>>(new Map());
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1); setErr(null); setFilter('');
    api<Socio[]>('/soci').then(setSoci);
    const m = new Map<number, Selected>();
    current.forEach(p => m.set(p.socio_id, { socio_id: p.socio_id, posizione_prova: p.posizione_prova }));
    setSelected(m);
  }, [open, current]);

  function toggle(s: Socio) {
    const m = new Map(selected);
    if (m.has(s.id)) m.delete(s.id);
    else m.set(s.id, { socio_id: s.id, posizione_prova: null });
    setSelected(m);
  }

  function setPos(socio_id: number, val: string) {
    const m = new Map(selected);
    const cur = m.get(socio_id);
    if (!cur) return;
    cur.posizione_prova = val.trim() === '' ? null : Number(val);
    m.set(socio_id, cur);
    setSelected(m);
  }

  async function save() {
    const partecipanti = [...selected.values()].map(s => ({
      socio_id: s.socio_id,
      posizione_prova: s.posizione_prova ?? undefined,
    }));
    try {
      await api(`/eventi/${evento.id}/partecipazioni`, {
        method: 'PUT', body: JSON.stringify({ partecipanti }),
      });
      onSaved(); onOpenChange(false);
    } catch (e: any) { setErr(e.message); }
  }

  const visible = soci.filter(s =>
    !filter
    || s.cognome.toLowerCase().includes(filter.toLowerCase())
    || String(s.numero_tessera).includes(filter));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Registra partecipanti — {evento.titolo}</DialogTitle></DialogHeader>
        {step === 1 && (
          <div className="space-y-3">
            <Input placeholder="Cerca…" value={filter} onChange={e => setFilter(e.target.value)} />
            <div className="max-h-80 overflow-auto rounded border">
              {visible.map(s => (
                <label key={s.id} className="flex items-center gap-2 border-b px-3 py-2 last:border-0">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s)} />
                  <span className="text-xs text-neutral-500 w-10">#{s.numero_tessera}</span>
                  <span>{s.cognome} {s.nome}</span>
                </label>
              ))}
            </div>
            <div className="text-sm text-neutral-600">{selected.size} selezionati</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
              {evento.prova_abilita
                ? <Button onClick={() => setStep(2)} disabled={selected.size === 0}>Avanti</Button>
                : <Button onClick={save} disabled={selected.size === 0}>Salva</Button>}
            </DialogFooter>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Inserisci la posizione nella prova abilità (lascia vuoto se non classificato).
              Scala: {evento.scala_prova?.join(' / ')}
            </p>
            <div className="max-h-80 overflow-auto rounded border">
              {[...selected.values()].map(s => {
                const socio = soci.find(x => x.id === s.socio_id)!;
                return (
                  <div key={s.socio_id} className="flex items-center gap-2 border-b px-3 py-2 last:border-0">
                    <span className="flex-1">{socio?.cognome} {socio?.nome}</span>
                    <Input className="w-20" type="number" min="1" value={s.posizione_prova ?? ''} onChange={e => setPos(s.socio_id, e.target.value)} />
                  </div>
                );
              })}
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Indietro</Button>
              <Button onClick={save}>Salva</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
