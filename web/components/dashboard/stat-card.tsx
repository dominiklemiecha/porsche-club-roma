import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

export function StatCard({
  icon: Icon, value, label, href, linkLabel,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  href: string;
  linkLabel: string;
}) {
  const display = typeof value === 'number' ? value.toLocaleString('it-IT') : value;
  return (
    <div className="card group flex flex-col p-5 transition hover:shadow-card-hover">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-porsche/10 text-porsche">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-[28px] font-bold leading-none tracking-tight tabular-nums">{display}</div>
      <div className="mt-1.5 text-sm text-ink/55">{label}</div>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-porsche">
        {linkLabel}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
