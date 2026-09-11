import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('skeleton relative overflow-hidden rounded-md bg-secondary', className)} {...props} aria-hidden="true" />
}
