'use client';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api, apiUpload } from '@/lib/api';
import type { Evento, Partecipazione, Socio } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  evento: Evento;
  current: Partecipazione[];
  onSaved: () => void;
}

interface Preview {
  trovati: { riga: number; testo: string; socio: Socio }[];
  non_trovati: { riga: number; testo: string }[];
  ambigui: { riga: number; testo: string; candidati: Socio[] }[];
}

export function ImportXlsxDialog({ open, onOpenChange, evento, current, onSaved }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPreview(null); setFileName(''); setErr(null); setLoading(false);
  }, [open]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setFileName(f.name); setErr(null); setPreview(null); setLoading(true);
    try {
      setPreview(await apiUpload<Preview>(`/eventi/${evento.id}/partecipazioni/import-xlsx`, f));
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const currentIds = new Set(current.map(c => c.socio_id));
  const nuovi = preview?.trovati.filter(t => !currentIds.has(t.socio.id)) ?? [];
  const giaPresenti = (preview?.trovati.length ?? 0) - nuovi.length;

  async function conferma() {
    setErr(null);
    const partecipanti = [
      ...current.map(c => ({ socio_id: c.socio_id, posizione_prova: c.posizione_prova ?? undefined })),
      ...nuovi.map(t => ({ socio_id: t.socio.id })),
    ];
    try {
      await api(`/eventi/${evento.id}/partecipazioni`, {
        method: 'PUT', body: JSON.stringify({ partecipanti }),
      });
      onSaved(); onOpenChange(false);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Importa partecipanti da Excel — {evento.titolo}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            Carica un file .xlsx con una colonna contenente cognome e nome dei partecipanti
            (una persona per riga, es. &quot;Rossi Mario&quot;).
          </p>
          <input
            ref={inputRef} type="file" accept=".xlsx"
            className="hidden"
            onChange={e => onFile(e.target.files?.[0])}
          />
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={loading}>
              {loading ? 'Analisi…' : 'Scegli file'}
            </Button>
            {fileName && <span className="text-sm text-neutral-600 truncate">{fileName}</span>}
          </div>

          {preview && (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium text-green-700">{nuovi.length} da aggiungere</span>
                {giaPresenti > 0 && <span className="text-neutral-500"> · {giaPresenti} già registrati</span>}
                {preview.non_trovati.length > 0 && <span className="text-red-600"> · {preview.non_trovati.length} non trovati</span>}
                {preview.ambigui.length > 0 && <span className="text-amber-600"> · {preview.ambigui.length} ambigui</span>}
              </div>

              {nuovi.length > 0 && (
                <div className="max-h-48 overflow-auto rounded border">
                  {nuovi.map(t => (
                    <div key={t.socio.id} className="flex items-center gap-2 border-b px-3 py-1.5 text-sm last:border-0">
                      <span className="text-xs text-neutral-500 w-10">#{t.socio.numero_tessera}</span>
                      <span>{t.socio.cognome} {t.socio.nome}</span>
                    </div>
                  ))}
                </div>
              )}

              {preview.non_trovati.length > 0 && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  <div className="font-medium mb-1">Non trovati nell&apos;elenco soci (verranno ignorati):</div>
                  {preview.non_trovati.map(n => <div key={n.riga}>riga {n.riga}: {n.testo}</div>)}
                </div>
              )}

              {preview.ambigui.length > 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-700">
                  <div className="font-medium mb-1">Ambigui (più soci corrispondono — aggiungili manualmente):</div>
                  {preview.ambigui.map(a => (
                    <div key={a.riga}>
                      riga {a.riga}: {a.testo} → {a.candidati.map(c => `${c.cognome} ${c.nome} (#${c.numero_tessera})`).join(', ')}
                    </div>
                  ))}
                </div>
              )}

              {evento.prova_abilita && nuovi.length > 0 && (
                <p className="text-xs text-neutral-500">
                  Le posizioni della prova abilità si assegnano dopo da &quot;Registra partecipanti&quot;.
                </p>
              )}
            </div>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button onClick={conferma} disabled={!preview || nuovi.length === 0}>
              Aggiungi {nuovi.length > 0 ? nuovi.length : ''} partecipanti
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
