'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      r.push('/dashboard');
    } catch { setErr('Credenziali non valide'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sand via-cream to-cream/70 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-paper p-6 shadow-xl border border-ink/10 text-ink">
        <div className="mb-5 flex justify-center">
          <Image src="/porsche-logo.png" alt="" width={72} height={72} />
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="u">Username</Label>
            <Input id="u" value={u} onChange={e => setU(e.target.value)} autoFocus />
          </div>
          <div>
            <Label htmlFor="p">Password</Label>
            <Input id="p" type="password" value={p} onChange={e => setP(e.target.value)} />
          </div>
          {err && <p className="text-sm text-porsche">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Accesso…' : 'Accedi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
