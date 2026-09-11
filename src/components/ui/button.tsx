import type { ComponentProps } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// shadcn/ui Button (new-york), evolved with the marketplace tokens.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent active:bg-accent/80',
        outline: 'border border-input bg-background text-primary hover:bg-accent active:bg-secondary',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-secondary',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
        link: 'text-primary underline-offset-4 hover:underline active:text-foreground',
      },
      size: { default: 'min-h-11 px-4 py-2', sm: 'min-h-11 px-3 py-2 text-xs', lg: 'min-h-12 px-6 py-3', icon: 'size-11 shrink-0' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({ className, variant, size, asChild = false, type, disabled, onClick, onClickCapture, ...props }:
  ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" type={asChild ? undefined : (type ?? 'button')} className={cn(buttonVariants({ variant, size, className }))} {...props}
    disabled={asChild ? undefined : disabled} aria-disabled={asChild && disabled ? true : props['aria-disabled']} tabIndex={asChild && disabled ? -1 : props.tabIndex}
    onClickCapture={(event) => { if (disabled) { event.preventDefault(); event.stopPropagation(); return } onClickCapture?.(event) }}
    onClick={(event) => { if (disabled) { event.preventDefault(); return } onClick?.(event) }} />
}
