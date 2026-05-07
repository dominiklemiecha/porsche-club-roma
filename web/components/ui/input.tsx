import * as React from 'react';
import { cn } from '@/lib/utils';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) =>
    <input ref={ref} className={cn('h-10 w-full rounded-md border border-ink/30 bg-white px-3 text-base sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-porsche', className)} {...props} />,
);
Input.displayName = 'Input';
