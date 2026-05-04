'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Calendar, Trophy, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const links = [
  { href: '/soci',       label: 'Soci',       icon: Users },
  { href: '/eventi',     label: 'Eventi',     icon: Calendar },
  { href: '/classifica', label: 'Classifica', icon: Trophy },
];

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    router.push('/login');
  }
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-ink/10 bg-ink text-cream">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-cream/10">
        <div className="rounded-md bg-white p-1 flex items-center justify-center">
          <Image src="/porsche-logo.png" alt="Porsche Club Roma" width={36} height={36} />
        </div>
        <div className="text-sm font-semibold leading-tight">Porsche<br/>Club Roma</div>
      </div>
      <nav className="flex-1 px-2 py-3">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-porsche/20 transition',
              path?.startsWith(l.href) && 'bg-porsche text-cream font-medium')}>
            <l.icon className="h-4 w-4" /> {l.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-porsche/30 transition">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}
