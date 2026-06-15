import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-porsche text-paper hover:bg-porsche-dark',
        dark:    'bg-ink text-paper hover:bg-ink/85',
        outline: 'border border-line bg-paper text-ink hover:bg-ink/[0.04]',
        ghost:   'text-ink hover:bg-ink/[0.04]',
        destructive: 'bg-ink text-paper hover:bg-porsche',
      },
      size: { default: 'h-9 px-4', sm: 'h-8 px-3', icon: 'h-9 w-9' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) =>
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />,
);
Button.displayName = 'Button';
