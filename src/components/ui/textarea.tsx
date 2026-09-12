import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn('min-h-28 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base hover:border-primary/70 disabled:opacity-50 aria-invalid:border-destructive md:text-sm', className)} {...props} />
}
