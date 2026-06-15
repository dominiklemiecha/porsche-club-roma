'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiUpload } from '@/lib/api';
import { imageUrl } from '@/lib/images';
import type { Categoria, Evento } from '@/lib/types';

interface Props { open: boolean; onOpenChange: (b: boolean) => void; evento?: Evento | null; anno: number | null; onSaved: () => void; }

export function EventoFormDialog({ open, onOpenChange, evento, anno, onSaved }: Props) {
  const [titolo, setTitolo] = useState('');
  const [data, setData] = useState('');
  const [multi, setMulti] = useState(false);
  const [dataFine, setDataFine] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('turismo');
  const [base, setBase] = useState('10');
  const [prova, setProva] = useState(false);
  const [scala, setScala] = useState<number[]>([30,25,20,15,10,5]);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const editing = !!evento;

  useEffect(() => {
    if (open) {
      setTitolo(evento?.titolo ?? '');
      setData(evento?.data_evento?.slice(0,10) ?? '');
      setMulti(!!evento?.data_fine);
      setDataFine(evento?.data_fine?.slice(0,10) ?? '');
      setCategoria(evento?.categoria ?? 'turismo');
      setBase(String(evento?.punteggio_base ?? 10));
      setProva(evento?.prova_abilita ?? false);
      setScala(evento?.scala_prova ?? [30,25,20,15,10,5]);
      setImgFile(null);
      setImgPreview(evento?.immagine ? imageUrl(evento.immagine) : null);
      setErr(null);
    }
  }, [open, evento]);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  }

  function setScalaAt(i: number, v: string) {
    const n = Number(v); if (!Number.isFinite(n)) return;
    setScala(scala.map((x, idx) => idx === i ? n : x));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = JSON.stringify({
        titolo, data_evento: data,
        data_fine: multi && dataFine ? dataFine : undefined,
        categoria,
        anno: editing ? evento!.anno : (anno ?? undefined),
        punteggio_base: Number(base), prova_abilita: prova,
        scala_prova: prova ? scala : undefined,
      });
      const saved = editing
        ? await api<Evento>(`/eventi/${evento!.id}`, { method: 'PATCH', body })
        : await api<Evento>('/eventi',               { method: 'POST',  body });
      if (imgFile) await apiUpload(`/eventi/${saved.id}/immagine`, imgFile);
      onSaved(); onOpenChange(false);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Modifica evento' : 'Nuovo evento'}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>Titolo</Label><Input value={titolo} onChange={e => setTitolo(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data {multi ? 'inizio' : ''}</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} required /></div>
            <div>
              <Label>Categoria</Label>
              <select className="h-9 w-full rounded-md border border-neutral-300 px-3 text-sm" value={categoria} onChange={e => setCategoria(e.target.value as Categoria)}>
                <option value="turismo">Turismo</option>
                <option value="pista">Pista</option>
                <option value="istituzionale">Istituzionale</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Immagine</Label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-canvas">
                {imgPreview && /* eslint-disable-next-line @next/next/no-img-element */ (
                  <img src={imgPreview} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} className="text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={multi} onChange={e => setMulti(e.target.checked)} />
            Più giorni
          </label>
          {multi && (
            <div><Label>Data fine</Label><Input type="date" value={dataFine} min={data} onChange={e => setDataFine(e.target.value)} required /></div>
          )}
          <div><Label>Punteggio base</Label><Input type="number" min="0" value={base} onChange={e => setBase(e.target.value)} required /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={prova} onChange={e => setProva(e.target.checked)} />
            Prova abilità
          </label>
          {prova && (
            <div>
              <Label>Scala punteggi (1°, 2°, ...)</Label>
              <div className="flex flex-wrap gap-2">
                {scala.map((v, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs text-neutral-500">{i+1}°</span>
                    <Input className="w-20" type="number" value={v} onChange={e => setScalaAt(i, e.target.value)} />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setScala([...scala, 0])}>+</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setScala(scala.slice(0, -1))} disabled={scala.length <= 1}>−</Button>
              </div>
            </div>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">Salva</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
