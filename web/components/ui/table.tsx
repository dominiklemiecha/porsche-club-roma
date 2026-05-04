import * as React from 'react';
import { cn } from '@/lib/utils';
export const Table = (p: React.HTMLAttributes<HTMLTableElement>) =>
  <table {...p} className={cn('w-full text-sm', p.className)} />;
export const Thead = (p: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <thead {...p} className={cn('bg-neutral-100 text-left', p.className)} />;
export const Tbody = (p: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <tbody {...p} />;
export const Tr = (p: React.HTMLAttributes<HTMLTableRowElement>) =>
  <tr {...p} className={cn('border-b border-neutral-200', p.className)} />;
export const Th = (p: React.ThHTMLAttributes<HTMLTableCellElement>) =>
  <th {...p} className={cn('px-3 py-2 font-medium', p.className)} />;
export const Td = (p: React.TdHTMLAttributes<HTMLTableCellElement>) =>
  <td {...p} className={cn('px-3 py-2', p.className)} />;
