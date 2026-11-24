'use client';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, apiUpload } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onSaved: () => void;
}

interface Riga { riga: number; cognome: string; nome: string; numero_tessera: number | null; }
interface Piano {
  righe: Riga[];
  invariati: number;
  nuovi: Riga[];
  rinumerati: { id: number; cognome: string; nome: string; da: number; a: number }[];
  riattivati: { id: number; cognome: string; nome: string; numero_tessera: number }[];
  rimossi: { id: number; cognome: string; nome: string; numero_tessera: number; partecipazioni: number; azione: 'disattiva' | 'elimina' }[];
  errori: string[];
  avvisi: string[];
  tessere_occupate: number[];
}
interface Esito { aggiunti: number; rinumerati: number; riattivati: number; eliminati: number; disattivati: number; invariati: number; }

const box = 'max-h-48 overflow-auto rounded border';
const row = 'flex items-center gap-2 border-b px-3 py-1.5 text-sm last:border-0';

export function ImportSociDialog({ open, onOpenChange, onSaved }: Props) {
  const [piano, setPiano] = useState<Piano | null>(null);
  const [tessere, setTessere] = useState<Record<number, string>>({});
  const [confermaRimozione, setConfermaRimozione] = useState(false);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [esito, setEsito] = useState<Esito | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPiano(null); setTessere({}); setConfermaRimozione(false); setFileName('');
    setEsito(null); setErr(null); setLoading(false); setSaving(false);
  }, [open]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setFileName(f.name); setErr(null); setPiano(null); setEsito(null); setConfermaRimozione(false); setLoading(true);
    try {
      const p = await apiUpload<Piano>('/soci/import', f);
      setPiano(p);
      setTessere(Object.fromEntries(p.nuovi.map(n => [n.riga, n.numero_tessera != null ? String(n.numero_tessera) : ''])));
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = ''; }
  }

  const nuoviRighe = new Set(piano?.nuovi.map(n => n.riga));
  const tesseraValida = (v: string | undefined) => !!v && /^\d+$/.test(v.trim()) && Number(v) > 0;
  // errore per riga di ogni nuovo socio: tessera non valida, gia' di un socio o ripetuta tra i nuovi
  const erroriTessera = new Map<number, string>();
  if (piano) {
    const occupate = new Set(piano.tessere_occupate);
    const usate = new Map<number, number>();
    piano.nuovi.forEach(n => {
      const v = tessere[n.riga]?.trim();
      if (!tesseraValida(v)) return erroriTessera.set(n.riga, 'Inserisci il numero tessera');
      const t = Number(v);
      if (occupate.has(t)) return erroriTessera.set(n.riga, 'Tessera già di un altro socio');
      if (usate.has(t)) return erroriTessera.set(n.riga, 'Tessera ripetuta');
      usate.set(t, n.riga);
    });
  }
  const tessereOk = erroriTessera.size === 0;
  const daEliminare = piano?.rimossi.filter(r => r.azione === 'elimina').length ?? 0;
  const daDisattivare = (piano?.rimossi.length ?? 0) - daEliminare;
  const modifiche = piano
    ? piano.nuovi.length + piano.rinumerati.length + piano.riattivati.length + piano.rimossi.length
    : 0;
  const puoConfermare = !!piano && !esito && piano.errori.length === 0 && tessereOk && modifiche > 0
    && (piano.rimossi.length === 0 || confermaRimozione);

  async function conferma() {
    if (!piano) return;
    setErr(null); setSaving(true);
    const righe = piano.righe.map(r => nuoviRighe.has(r.riga) ? { ...r, numero_tessera: Number(tessere[r.riga]) } : r);
    try {
      const res = await api<Esito>('/soci/import/conferma', {
        method: 'POST', body: JSON.stringify({ righe, rimuovi_ids: piano.rimossi.map(r => r.id) }),
      });
      setEsito(res); onSaved();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Aggiorna elenco soci da file</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            Carica l&apos;elenco soci aggiornato (.xlsx o .csv) con le colonne Cognome, Nome e Tessera.
            I soci nuovi vengono aggiunti, quelli non più presenti vengono tolti dall&apos;elenco:
            chi ha partecipato a eventi resta nello storico degli eventi e in classifica.
          </p>
          <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={loading || saving}>
              {loading ? 'Analisi…' : 'Scegli file'}
            </Button>
            {fileName && <span className="truncate text-sm text-neutral-600">{fileName}</span>}
          </div>

          {piano && !esito && (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-neutral-500">{piano.righe.length} nel file · {piano.invariati} invariati</span>
                {piano.nuovi.length > 0 && <span className="font-medium text-green-700"> · {piano.nuovi.length} nuovi</span>}
                {piano.rinumerati.length > 0 && <span className="text-sky-700"> · {piano.rinumerati.length} tessere aggiornate</span>}
                {piano.riattivati.length > 0 && <span className="text-sky-700"> · {piano.riattivati.length} rientrati</span>}
                {piano.rimossi.length > 0 && <span className="font-medium text-red-600"> · {piano.rimossi.length} da togliere</span>}
              </div>

              {piano.errori.length > 0 && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  <div className="mb-1 font-medium">Da correggere nel file prima di procedere:</div>
                  {piano.errori.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}

              {piano.avvisi.length > 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-700">
                  <div className="mb-1 font-medium">Da verificare nel file (non bloccante):</div>
                  {piano.avvisi.map((a, i) => <div key={i}>{a}</div>)}
                </div>
              )}

              {piano.nuovi.length > 0 && (
                <div>
                  <div className="mb-1 text-sm font-medium">Nuovi soci — verifica il numero tessera</div>
                  <div className={box}>
                    {piano.nuovi.map(n => (
                      <div key={n.riga} className={row}>
                        <span className="flex-1 truncate">{n.cognome} {n.nome}</span>
                        {erroriTessera.has(n.riga) && <span className="text-xs text-red-600">{erroriTessera.get(n.riga)}</span>}
                        <span className="text-xs text-neutral-500">Tessera</span>
                        <Input
                          className={`h-8 w-24 ${erroriTessera.has(n.riga) ? 'border-red-400' : ''}`}
                          inputMode="numeric" value={tessere[n.riga] ?? ''}
                          onChange={e => setTessere({ ...tessere, [n.riga]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {piano.rinumerati.length > 0 && (
                <div>
                  <div className="mb-1 text-sm font-medium">Tessere aggiornate</div>
                  <div className={box}>
                    {piano.rinumerati.map(r => (
                      <div key={r.id} className={row}>
                        <span className="flex-1 truncate">{r.cognome} {r.nome}</span>
                        <span className="text-neutral-500">#{r.da} → <b className="text-ink">#{r.a}</b></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {piano.riattivati.length > 0 && (
                <div>
                  <div className="mb-1 text-sm font-medium">Soci che rientrano in elenco</div>
                  <div className={box}>
                    {piano.riattivati.map(r => (
                      <div key={r.id} className={row}>
                        <span className="w-12 text-xs text-neutral-500">#{r.numero_tessera}</span>
                        <span>{r.cognome} {r.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {piano.rimossi.length > 0 && (
                <div className="rounded border border-red-200 bg-red-50/50 p-2">
                  <div className="mb-1 text-sm font-medium text-red-700">Soci non più presenti nel file — verranno tolti</div>
                  <div className="max-h-48 overflow-auto">
                    {piano.rimossi.map(r => (
                      <div key={r.id} className="flex items-center gap-2 border-b border-red-100 py-1.5 text-sm last:border-0">
                        <span className="w-12 text-xs text-neutral-500">#{r.numero_tessera}</span>
                        <span className="flex-1 truncate">{r.cognome} {r.nome}</span>
                        <span className="text-xs text-neutral-600">
                          {r.azione === 'disattiva'
                            ? `${r.partecipazioni} partecipazion${r.partecipazioni === 1 ? 'e' : 'i'}: resta nello storico`
                            : 'nessuna partecipazione: eliminato'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <label className="mt-2 flex items-start gap-2 text-sm text-red-700">
                    <input type="checkbox" className="mt-0.5" checked={confermaRimozione} onChange={e => setConfermaRimozione(e.target.checked)} />
                    <span>
                      Confermo di togliere {piano.rimossi.length} soci dall&apos;elenco
                      {daDisattivare > 0 && ` (${daDisattivare} restano nello storico eventi e in classifica`}
                      {daDisattivare > 0 && daEliminare > 0 && `, ${daEliminare} eliminati definitivamente`}
                      {daDisattivare > 0 && ')'}
                      {daDisattivare === 0 && ' (eliminati definitivamente)'}
                    </span>
                  </label>
                </div>
              )}

              {modifiche === 0 && piano.errori.length === 0 && (
                <p className="text-sm text-neutral-600">L&apos;elenco è già allineato: nessuna modifica.</p>
              )}
            </div>
          )}

          {esito && (
            <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Elenco aggiornato: {esito.aggiunti} aggiunti, {esito.rinumerati} tessere aggiornate, {esito.riattivati} rientrati,
              {' '}{esito.disattivati} tolti (restano nello storico), {esito.eliminati} eliminati.
            </div>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>{esito ? 'Chiudi' : 'Annulla'}</Button>
            {!esito && (
              <Button onClick={conferma} disabled={!puoConfermare || saving}>
                {saving ? 'Aggiornamento…' : 'Conferma aggiornamento'}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
