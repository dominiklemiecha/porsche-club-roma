'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Users, Calendar, Trophy, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Brand } from '@/components/layout/brand';

const links = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutGrid },
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

  const Nav = (
    <nav className="flex-1 py-4 overflow-y-auto">
      {links.map(l => {
        const active = path?.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href}
            className={cn(
              'relative flex items-center gap-3 px-5 py-2.5 text-sm transition',
              active ? 'bg-black/[0.05] font-semibold text-ink' : 'text-ink/80 hover:bg-black/[0.03]',
            )}>
            {active && <span className="absolute left-0 top-0 h-full w-1 bg-porsche" />}
            <l.icon className={cn('h-[18px] w-[18px]', active ? 'text-porsche' : 'text-ink/70')} strokeWidth={2} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const Logout = (
    <button onClick={logout}
      className="flex items-center gap-3 px-5 py-3 text-sm text-ink/70 transition hover:bg-black/[0.03] hover:text-ink">
      <LogOut className="h-[18px] w-[18px]" /> Logout
    </button>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-paper px-3 py-2.5">
        <button onClick={() => setOpen(true)} aria-label="Apri menu" className="rounded-md p-2 hover:bg-black/[0.04]">
          <Menu className="h-5 w-5" />
        </button>
        <Brand compact />
        <span aria-hidden className="w-9" />
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-paper lg:flex">
        <div className="flex justify-center px-5 py-6"><Brand /></div>
        {Nav}
        <div className="pb-3">{Logout}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-line bg-paper shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Chiudi menu"
              className="absolute right-2 top-2 rounded-md p-2 hover:bg-black/[0.04]">
              <X className="h-5 w-5" />
            </button>
            <div className="px-5 py-6"><Brand /></div>
            {Nav}
            <div className="pb-3">{Logout}</div>
          </aside>
        </div>
      )}
    </>
  );
}
