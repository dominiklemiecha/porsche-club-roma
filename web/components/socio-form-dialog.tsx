'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { Socio } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  socio?: Socio | null;
  onSaved: () => void;
}

export function SocioFormDialog({ open, onOpenChange, socio, onSaved }: Props) {
  const [tess, setTess] = useState('');
  const [nome, setNome] = useState('');
  const [cog, setCog] = useState('');
  const [auto, setAuto] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const editing = !!socio;

  useEffect(() => {
    if (open) {
      setTess(socio ? String(socio.numero_tessera) : '');
      setNome(socio?.nome ?? '');
      setCog(socio?.cognome ?? '');
      setAuto(socio?.modello_auto ?? '');
      setErr(null);
    }
  }, [open, socio]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = JSON.stringify({
        numero_tessera: Number(tess),
        nome,
        cognome: cog,
        modello_auto: auto.trim() === '' ? null : auto.trim(),
      });
      if (editing) await api(`/soci/${socio!.id}`, { method: 'PATCH', body });
      else         await api('/soci',                { method: 'POST', body });
      onSaved(); onOpenChange(false);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Modifica socio' : 'Nuovo socio'}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>N. tessera</Label><Input type="number" value={tess} onChange={e => setTess(e.target.value)} required /></div>
          <div><Label>Cognome</Label><Input value={cog} onChange={e => setCog(e.target.value)} required /></div>
          <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} required /></div>
          <div><Label>Modello auto</Label><Input value={auto} onChange={e => setAuto(e.target.value)} placeholder="es. 992 GT3 RS" /></div>
          {err && <p className="text-sm text-porsche">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">Salva</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
