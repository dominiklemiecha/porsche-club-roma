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
    <aside className="flex h-screen w-56 flex-col border-r bg-white">
      <div className="flex items-center gap-2 px-4 py-5">
        <Image src="/porsche-logo.svg" alt="Porsche Club Roma" width={40} height={40} />
        <div className="text-sm font-semibold leading-tight">Porsche<br/>Club Roma</div>
      </div>
      <nav className="flex-1 px-2">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-100',
              path?.startsWith(l.href) && 'bg-neutral-100 font-medium text-porsche')}>
            <l.icon className="h-4 w-4" /> {l.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-100">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}
