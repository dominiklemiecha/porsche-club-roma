import * as React from 'react';
import { cn } from '@/lib/utils';
export const Table = (p: React.HTMLAttributes<HTMLTableElement>) =>
  <table {...p} className={cn('w-full text-sm bg-white rounded-md overflow-hidden', p.className)} />;
export const Thead = (p: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <thead {...p} className={cn('bg-ink text-cream text-left', p.className)} />;
export const Tbody = (p: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <tbody {...p} />;
export const Tr = (p: React.HTMLAttributes<HTMLTableRowElement>) =>
  <tr {...p} className={cn('border-b border-ink/10 hover:bg-cream/40', p.className)} />;
export const Th = (p: React.ThHTMLAttributes<HTMLTableCellElement>) =>
  <th {...p} className={cn('px-3 py-2 font-medium', p.className)} />;
export const Td = (p: React.TdHTMLAttributes<HTMLTableCellElement>) =>
  <td {...p} className={cn('px-3 py-2', p.className)} />;
