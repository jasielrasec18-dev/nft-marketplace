import type { ComponentProps } from 'react'
import * as RadioPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/cn'

export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioPrimitive.Root>) {
  return <RadioPrimitive.Root className={cn('grid gap-2', className)} {...props} />
}
export function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioPrimitive.Item>) {
  return <RadioPrimitive.Item className={cn('group flex size-11 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}>
    <span className="flex size-5 items-center justify-center rounded-full border border-input group-hover:border-primary group-data-[state=checked]:border-primary group-aria-invalid:border-destructive">
      <RadioPrimitive.Indicator className="size-2.5 rounded-full bg-primary" />
    </span>
  </RadioPrimitive.Item>
}
