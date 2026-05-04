'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const VIDEO_ID = 'OGEEQ9VEEmc';

export default function LoginPage() {
  const r = useRouter();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
      r.push('/soci');
    } catch { setErr('Credenziali non valide'); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <iframe
          className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.77vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.4]"
          src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playlist=${VIDEO_ID}&playsinline=1`}
          title="Background"
          allow="autoplay; encrypted-media"
          frameBorder={0}
        />
        <div className="absolute inset-0 bg-ink/50" />
      </div>

      <form onSubmit={submit} className="relative z-10 w-80 rounded-lg bg-white/80 backdrop-blur-md p-6 shadow-2xl border border-white/40 text-ink">
        <div className="mb-4 flex justify-center">
          <Image src="/porsche-logo.png" alt="" width={72} height={72} className="grayscale mix-blend-multiply" />
        </div>
        <h1 className="mb-1 text-center text-lg font-semibold">Porsche Club Roma</h1>
        <p className="mb-5 text-center text-xs text-ink/60">CRM Gestionale</p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="u">Username</Label>
            <Input id="u" value={u} onChange={e => setU(e.target.value)} autoFocus className="bg-white/70 border-ink/40 focus:ring-ink" />
          </div>
          <div>
            <Label htmlFor="p">Password</Label>
            <Input id="p" type="password" value={p} onChange={e => setP(e.target.value)} className="bg-white/70 border-ink/40 focus:ring-ink" />
          </div>
          {err && <p className="text-sm text-ink">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-md bg-ink text-white font-medium hover:bg-ink/80 transition disabled:opacity-50"
          >
            {loading ? 'Accesso…' : 'Accedi'}
          </button>
        </div>
      </form>
    </div>
  );
}
