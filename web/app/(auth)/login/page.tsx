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
      r.push('/soci');
    } catch { setErr('Credenziali non valide'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <form onSubmit={submit} className="w-80 rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex justify-center">
          <Image src="/porsche-logo.svg" alt="" width={64} height={64} />
        </div>
        <h1 className="mb-4 text-center text-lg font-semibold">Porsche Club Roma</h1>
        <div className="space-y-3">
          <div>
            <Label htmlFor="u">Username</Label>
            <Input id="u" value={u} onChange={e => setU(e.target.value)} autoFocus />
          </div>
          <div>
            <Label htmlFor="p">Password</Label>
            <Input id="p" type="password" value={p} onChange={e => setP(e.target.value)} />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Accesso…' : 'Accedi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
