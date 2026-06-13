import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  icon: Icon, iconClassName, value, label, href, linkLabel,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  value: string | number;
  label: string;
  href: string;
  linkLabel: string;
}) {
  const display = typeof value === 'number' ? value.toLocaleString('it-IT') : value;
  return (
    <div className="card group flex flex-col p-5 transition hover:shadow-card-hover">
      <div className="flex items-center gap-3.5">
        <Icon className={cn('h-7 w-7 shrink-0', iconClassName ?? 'text-ink')} strokeWidth={1.75} />
        <div className="min-w-0">
          <div className="text-[26px] font-bold leading-none tracking-tight tabular-nums">{display}</div>
          <div className="mt-1.5 text-sm text-ink/55">{label}</div>
        </div>
      </div>
      <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-porsche">
        {linkLabel}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
