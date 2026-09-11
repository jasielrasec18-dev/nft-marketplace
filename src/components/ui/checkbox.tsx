import type { ComponentProps } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root className={cn('group inline-flex size-11 shrink-0 items-center justify-center rounded-md text-primary disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}>
    <span className="flex size-5 items-center justify-center rounded-sm border border-input group-hover:border-primary group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary group-data-[state=checked]:text-primary-foreground group-aria-invalid:border-destructive">
      <CheckboxPrimitive.Indicator><Check className="size-4" aria-hidden="true" /></CheckboxPrimitive.Indicator>
    </span>
  </CheckboxPrimitive.Root>
}
