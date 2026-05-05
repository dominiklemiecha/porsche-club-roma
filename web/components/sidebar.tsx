'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Calendar, Trophy, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    router.push('/login');
  }

  const Brand = (
    <div className="flex items-center justify-center px-4 py-5 border-b border-ink/10">
      <Image src="/porsche-logo.png" alt="Porsche Club Roma" width={48} height={48} priority />
    </div>
  );

  const Nav = (
    <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-cream/40',
            path?.startsWith(l.href) && 'bg-porsche text-paper font-medium hover:bg-porsche'
          )}>
          <l.icon className="h-4 w-4" /> {l.label}
        </Link>
      ))}
    </nav>
  );

  const Logout = (
    <button onClick={logout} className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-cream/40">
      <LogOut className="h-4 w-4" /> Logout
    </button>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-2 bg-paper text-ink px-3 py-2 border-b border-ink/10 shadow-sm">
        <button onClick={() => setOpen(true)} aria-label="Apri menu" className="p-2 rounded-md hover:bg-cream/40">
          <Menu className="h-5 w-5" />
        </button>
        <Image src="/porsche-logo.png" alt="" width={28} height={28} />
        <span aria-hidden className="w-9" />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-56 flex-col sticky top-0 shrink-0 border-r border-ink/10 bg-paper text-ink">
        {Brand}
        {Nav}
        {Logout}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-paper text-ink border-r border-ink/10 shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Chiudi menu"
              className="absolute right-2 top-2 p-2 rounded-md hover:bg-cream/40">
              <X className="h-5 w-5" />
            </button>
            {Brand}
            {Nav}
            {Logout}
          </aside>
        </div>
      )}
    </>
  );
}
