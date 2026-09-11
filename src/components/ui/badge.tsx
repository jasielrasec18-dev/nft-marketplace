import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva('inline-flex max-w-full items-center rounded-sm border px-2 py-1 type-caption', {
  variants: { variant: {
    default: 'border-primary bg-primary text-primary-foreground',
    outline: 'border-border text-muted-foreground',
    unavailable: 'border-border bg-secondary text-foreground',
  } }, defaultVariants: { variant: 'default' },
})
export function Badge({ className, variant, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
