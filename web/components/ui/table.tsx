import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = ({ className, ...p }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto rounded-md border border-ink/10 bg-paper shadow-sm">
    <table {...p} className={cn('w-full text-sm', className)} />
  </div>
);
export const Thead = (p: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <thead {...p} className={cn('bg-ink text-cream text-left', p.className)} />;
export const Tbody = (p: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <tbody {...p} />;
export const Tr = (p: React.HTMLAttributes<HTMLTableRowElement>) =>
  <tr {...p} className={cn('border-b border-ink/10 last:border-0 hover:bg-cream/30 transition-colors', p.className)} />;
export const Th = (p: React.ThHTMLAttributes<HTMLTableCellElement>) =>
  <th {...p} className={cn('px-3 py-2 font-medium whitespace-nowrap', p.className)} />;
export const Td = (p: React.TdHTMLAttributes<HTMLTableCellElement>) =>
  <td {...p} className={cn('px-3 py-2 align-middle', p.className)} />;
