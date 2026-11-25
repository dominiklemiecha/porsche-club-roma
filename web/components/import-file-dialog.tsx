'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, apiUpload } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Evento, Partecipazione, Socio } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  evento: Evento;
  current: Partecipazione[];
  onSaved: () => void;
}

interface InfoColonna { indice: number; intestazione: string; esempi: string[]; }
interface Preview {
  colonne: InfoColonna[];
  colonna: number;
  colonna2: number | null;
  trovati: { riga: number; testo: string; socio: Socio }[];
  non_trovati: { riga: number; testo: string }[];
  ambigui: { riga: number; testo: string; candidati: Socio[] }[];
}

/** Riga del file senza un socio univoco: l'utente decide cosa farne. */
interface DaRisolvere { riga: number; testo: string; candidati: Socio[]; }
type Scelta =
  | { tipo: 'associa'; socio: Socio | null; cerca: string; ricorda: boolean }
  | { tipo: 'crea'; cognome: string; nome: string; tessera: string; creato?: Socio }
  | { tipo: 'ignora' };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** "Rossi, Mario" -> cognome Rossi; altrimenti prima parola = cognome (modificabile). */
function proponiNome(testo: string): { cognome: string; nome: string } {
  const t = testo.trim().replace(/\s+/g, ' ');
  if (t.includes(',')) {
    const [c, ...n] = t.split(',');
    return { cognome: c.trim(), nome: n.join(' ').trim() };
  }
  const [c, ...n] = t.split(' ');
  return { cognome: c ?? '', nome: n.join(' ') };
}

const tesseraValida = (v: string) => /^\d+$/.test(v.trim()) && Number(v) > 0;

export function ImportFileDialog({ open, onOpenChange, evento, current, onSaved }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [soci, setSoci] = useState<Socio[]>([]);
  const [scelte, setScelte] = useState<Record<number, Scelta>>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPreview(null); setScelte({}); setFile(null); setErr(null); setLoading(false); setSaving(false);
    api<Socio[]>('/soci').then(setSoci).catch(() => setSoci([]));
  }, [open]);

  /** Analizza il file; colonna/colonna2 assenti = colonne proposte automaticamente. */
  async function carica(f: File | undefined | null, colonne?: { colonna: number; colonna2: number | null }) {
    if (!f) return;
    setFile(f); setErr(null); setScelte({}); setLoading(true);
    const campi: Record<string, string> = colonne ? { colonna: String(colonne.colonna), colonna2: colonne.colonna2 == null ? '' : String(colonne.colonna2) } : {};
    try {
      setPreview(await apiUpload<Preview>(`/eventi/${evento.id}/partecipazioni/import`, f, campi));
    } catch (e: any) { setErr(e.message); setPreview(null); }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = ''; }
  }

  const daRisolvere: DaRisolvere[] = useMemo(() => preview ? [
    ...preview.non_trovati.map(n => ({ ...n, candidati: [] })),
    ...preview.ambigui,
  ].sort((a, b) => a.riga - b.riga) : [], [preview]);

  const set = (riga: number, s: Scelta) => setScelte(prev => ({ ...prev, [riga]: s }));
  const scegli = (r: DaRisolvere, tipo: Scelta['tipo']) => {
    if (tipo === 'associa') set(r.riga, { tipo, socio: null, cerca: '', ricorda: true });
    else if (tipo === 'crea') set(r.riga, { tipo, ...proponiNome(r.testo), tessera: '' });
    else set(r.riga, { tipo });
  };

  // errori di validazione per le righe "crea": tessera gia' di un socio o ripetuta tra i nuovi
  const tessereEsistenti = useMemo(() => new Set(soci.map(s => s.numero_tessera)), [soci]);
  const erroreCrea = new Map<number, string>();
  const usate = new Map<number, number>();
  for (const r of daRisolvere) {
    const s = scelte[r.riga];
    if (s?.tipo !== 'crea' || s.creato) continue;
    if (!s.cognome.trim() || !s.nome.trim()) { erroreCrea.set(r.riga, 'Cognome e nome obbligatori'); continue; }
    if (!tesseraValida(s.tessera)) { erroreCrea.set(r.riga, 'Inserisci il numero tessera'); continue; }
    const t = Number(s.tessera);
    if (tessereEsistenti.has(t)) erroreCrea.set(r.riga, 'Tessera già di un altro socio');
    else if (usate.has(t)) erroreCrea.set(r.riga, 'Tessera ripetuta');
    else usate.set(t, r.riga);
  }
  const tutteDecise = daRisolvere.every(r => {
    const s = scelte[r.riga];
    if (!s) return false;
    if (s.tipo === 'associa') return !!s.socio;
    if (s.tipo === 'crea') return !!s.creato || !erroreCrea.has(r.riga);
    return true;
  });

  const currentIds = new Set(current.map(c => c.socio_id));
  const daAggiungere = (): Socio[] => {
    const out = new Map<number, Socio>();
    for (const t of preview?.trovati ?? []) if (!currentIds.has(t.socio.id)) out.set(t.socio.id, t.socio);
    for (const r of daRisolvere) {
      const s = scelte[r.riga];
      if (s?.tipo === 'associa' && s.socio && !currentIds.has(s.socio.id)) out.set(s.socio.id, s.socio);
    }
    return [...out.values()];
  };
  const nCrea = daRisolvere.filter(r => scelte[r.riga]?.tipo === 'crea').length;
  const totale = daAggiungere().length + nCrea;
  const giaPresenti = (preview?.trovati ?? []).filter(t => currentIds.has(t.socio.id)).length;

  async function conferma() {
    setErr(null); setSaving(true);
    try {
      // 1. crea i nuovi soci (quelli gia' creati in un tentativo precedente vengono riusati)
      const creati = new Map<number, Socio>(); // riga del file -> socio creato
      for (const r of daRisolvere) {
        const s = scelte[r.riga];
        if (s?.tipo !== 'crea') continue;
        let socio = s.creato;
        if (!socio) {
          try {
            socio = await api<Socio>('/soci', {
              method: 'POST',
              body: JSON.stringify({ cognome: s.cognome.trim(), nome: s.nome.trim(), numero_tessera: Number(s.tessera) }),
            });
          } catch (e: any) {
            throw new Error(`${s.cognome} ${s.nome}: ${e.message}`);
          }
          const creato = socio;
          set(r.riga, { ...s, creato });
        }
        creati.set(r.riga, socio);
      }
      // 2. ricorda i nomi del file come varianti (associati con spunta, creati con nome diverso)
      const alias = daRisolvere.flatMap(r => {
        const s = scelte[r.riga];
        if (s?.tipo === 'associa' && s.socio && s.ricorda) return [{ socio_id: s.socio.id, testo: r.testo }];
        const c = creati.get(r.riga);
        return c ? [{ socio_id: c.id, testo: r.testo }] : [];
      });
      if (alias.length) await api('/soci/alias', { method: 'POST', body: JSON.stringify({ alias }) });
      // 3. registra i partecipanti (esistenti + associati + creati)
      const nuovi = [...daAggiungere(), ...[...creati.values()].filter(c => !currentIds.has(c.id))];
      const visti = new Set(current.map(c => c.socio_id));
      const partecipanti = [
        ...current.map(c => ({ socio_id: c.socio_id, posizione_prova: c.posizione_prova ?? undefined })),
        ...nuovi.filter(s => !visti.has(s.id) && visti.add(s.id)).map(s => ({ socio_id: s.id })),
      ];
      await api(`/eventi/${evento.id}/partecipazioni`, { method: 'PUT', body: JSON.stringify({ partecipanti }) });
      onSaved(); onOpenChange(false);
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Importa partecipanti — {evento.titolo}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            Carica l&apos;export delle risposte di Forms (.csv o .pdf) oppure un Excel (.xlsx)
            con i nomi dei partecipanti: viene letta la colonna &quot;Socio&quot;
            (o la prima colonna se non c&apos;è intestazione).
          </p>
          <input ref={inputRef} type="file" accept=".xlsx,.csv,.pdf" className="hidden" onChange={e => carica(e.target.files?.[0])} />
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={loading || saving}>
              {loading ? 'Analisi…' : 'Scegli file'}
            </Button>
            {file && <span className="truncate text-sm text-neutral-600">{file.name}</span>}
          </div>

          {preview && file && (
            <div className="grid gap-2 rounded border bg-neutral-50 p-2.5 sm:grid-cols-2">
              <label className="text-xs font-medium text-neutral-600">
                Colonna con i nomi
                <select className="mt-1 h-9 w-full rounded-md border border-line bg-paper px-2 text-sm"
                  value={preview.colonna} disabled={loading || saving}
                  onChange={e => carica(file, { colonna: Number(e.target.value), colonna2: preview.colonna2 === Number(e.target.value) ? null : preview.colonna2 })}>
                  {preview.colonne.map(c => (
                    <option key={c.indice} value={c.indice}>{c.intestazione}{c.esempi[0] ? ` — es. ${c.esempi[0]}` : ''}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-neutral-600">
                Unisci con (es. Nome se Cognome è separato)
                <select className="mt-1 h-9 w-full rounded-md border border-line bg-paper px-2 text-sm"
                  value={preview.colonna2 ?? ''} disabled={loading || saving}
                  onChange={e => carica(file, { colonna: preview.colonna, colonna2: e.target.value === '' ? null : Number(e.target.value) })}>
                  <option value="">Nessuna</option>
                  {preview.colonne.filter(c => c.indice !== preview.colonna).map(c => (
                    <option key={c.indice} value={c.indice}>{c.intestazione}{c.esempi[0] ? ` — es. ${c.esempi[0]}` : ''}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium text-green-700">{preview.trovati.length - giaPresenti} riconosciuti</span>
                {giaPresenti > 0 && <span className="text-neutral-500"> · {giaPresenti} già registrati</span>}
                {daRisolvere.length > 0 && <span className="text-amber-700"> · {daRisolvere.length} da associare</span>}
              </div>

              {preview.trovati.length - giaPresenti > 0 && (
                <div className="max-h-40 overflow-auto rounded border">
                  {preview.trovati.filter(t => !currentIds.has(t.socio.id)).map(t => (
                    <div key={t.socio.id} className="flex items-center gap-2 border-b px-3 py-1.5 text-sm last:border-0">
                      <span className="w-10 text-xs text-neutral-500">#{t.socio.numero_tessera}</span>
                      <span>{t.socio.cognome} {t.socio.nome}</span>
                    </div>
                  ))}
                </div>
              )}

              {daRisolvere.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Non riconosciuti — per ognuno scegli se associarlo a un socio, crearlo o ignorarlo
                  </div>
                  {daRisolvere.map(r => (
                    <RigaDaRisolvere
                      key={r.riga} r={r} scelta={scelte[r.riga]} soci={soci} errore={erroreCrea.get(r.riga)}
                      onTipo={t => scegli(r, t)} onChange={s => set(r.riga, s)}
                    />
                  ))}
                </div>
              )}

              {evento.prova_abilita && totale > 0 && (
                <p className="text-xs text-neutral-500">
                  Le posizioni della prova abilità si assegnano dopo da &quot;Registra partecipanti&quot;.
                </p>
              )}
            </div>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}

          <DialogFooter>
            {preview && !tutteDecise && <span className="mr-auto self-center text-xs text-amber-700">Completa le scelte per le righe non riconosciute</span>}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button onClick={conferma} disabled={!preview || !tutteDecise || totale === 0 || saving}>
              {saving ? 'Salvataggio…' : `Aggiungi ${totale > 0 ? totale : ''} partecipanti`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RigaDaRisolvere({ r, scelta, soci, errore, onTipo, onChange }: {
  r: DaRisolvere; scelta?: Scelta; soci: Socio[]; errore?: string;
  onTipo: (t: Scelta['tipo']) => void; onChange: (s: Scelta) => void;
}) {
  const tab = (t: Scelta['tipo'], label: string) => (
    <button
      type="button" onClick={() => onTipo(t)} disabled={scelta?.tipo === 'crea' && !!scelta.creato}
      className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition',
        scelta?.tipo === t ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:bg-ink/[0.04]')}
    >{label}</button>
  );

  const risultati = useMemo(() => {
    if (scelta?.tipo !== 'associa' || scelta.socio) return [];
    const q = norm(scelta.cerca);
    if (!q) return r.candidati;
    return soci.filter(s =>
      norm(`${s.cognome} ${s.nome}`).includes(q) || norm(`${s.nome} ${s.cognome}`).includes(q) || String(s.numero_tessera) === q,
    ).slice(0, 8);
  }, [scelta, soci, r.candidati]);

  return (
    <div className={cn('rounded border p-2.5', scelta ? 'border-line' : 'border-amber-300 bg-amber-50/50')}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 text-sm"><span className="text-xs text-neutral-500">riga {r.riga}:</span> <b>{r.testo}</b>
          {r.candidati.length > 0 && <span className="text-xs text-amber-700"> · {r.candidati.length} soci possibili</span>}
        </span>
        {tab('associa', 'Associa a socio')}
        {tab('crea', 'Crea nuovo')}
        {tab('ignora', 'Ignora')}
      </div>

      {scelta?.tipo === 'associa' && (
        <div className="mt-2">
          {scelta.socio ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-neutral-500">#{scelta.socio.numero_tessera}</span>
              <span className="font-medium">{scelta.socio.cognome} {scelta.socio.nome}</span>
              <button type="button" className="text-xs text-porsche underline" onClick={() => onChange({ ...scelta, socio: null })}>cambia</button>
              <label className="ml-auto flex items-center gap-1.5 text-xs text-neutral-600">
                <input type="checkbox" checked={scelta.ricorda} onChange={e => onChange({ ...scelta, ricorda: e.target.checked })} />
                ricorda &quot;{r.testo}&quot; per i prossimi import
              </label>
            </div>
          ) : (
            <>
              <Input autoFocus placeholder="Cerca per cognome, nome o tessera…" value={scelta.cerca}
                onChange={e => onChange({ ...scelta, cerca: e.target.value })} className="h-8" />
              {risultati.length > 0 && (
                <div className="mt-1 max-h-40 overflow-auto rounded border bg-paper">
                  {risultati.map(s => (
                    <button key={s.id} type="button" onClick={() => onChange({ ...scelta, socio: s })}
                      className="flex w-full items-center gap-2 border-b px-3 py-1.5 text-left text-sm last:border-0 hover:bg-ink/[0.04]">
                      <span className="w-10 text-xs text-neutral-500">#{s.numero_tessera}</span>
                      <span>{s.cognome} {s.nome}</span>
                    </button>
                  ))}
                </div>
              )}
              {scelta.cerca.trim() && risultati.length === 0 && (
                <p className="mt-1 text-xs text-neutral-500">Nessun socio trovato: puoi crearlo con &quot;Crea nuovo&quot;.</p>
              )}
            </>
          )}
        </div>
      )}

      {scelta?.tipo === 'crea' && (
        scelta.creato ? (
          <p className="mt-2 text-sm text-green-700">Socio creato: #{scelta.creato.numero_tessera} {scelta.creato.cognome} {scelta.creato.nome}</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input placeholder="Cognome" value={scelta.cognome} className="h-8 w-40" onChange={e => onChange({ ...scelta, cognome: e.target.value })} />
            <Input placeholder="Nome" value={scelta.nome} className="h-8 w-40" onChange={e => onChange({ ...scelta, nome: e.target.value })} />
            <Input placeholder="N. tessera" inputMode="numeric" value={scelta.tessera}
              className={cn('h-8 w-28', errore && 'border-red-400')} onChange={e => onChange({ ...scelta, tessera: e.target.value })} />
            {errore && <span className="text-xs text-red-600">{errore}</span>}
          </div>
        )
      )}
    </div>
  );
}
