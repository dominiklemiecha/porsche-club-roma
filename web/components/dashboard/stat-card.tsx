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
  return (
    <div className="card group flex flex-col p-5 transition hover:shadow-card-hover">
      <div className="grid h-11 w-11 place-items-center rounded-lg border border-porsche/30 text-porsche">
        <Icon className="h-[20px] w-[20px]" />
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="mt-0.5 text-sm text-ink/55">{label}</div>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-porsche">
        {linkLabel}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
