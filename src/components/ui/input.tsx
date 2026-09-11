import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" type={type} className={cn('flex min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground hover:border-primary/70 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm', className)} {...props} />
}
