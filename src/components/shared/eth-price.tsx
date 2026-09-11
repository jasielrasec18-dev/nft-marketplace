import type { ComponentProps } from 'react'
import { eth, formatEth } from '@/lib/money'
import { cn } from '@/lib/cn'

export function ETHPrice({ value, decimalPlaces, className, ...props }: ComponentProps<'span'> & { value: string; decimalPlaces?: number }) {
  // Preserve the supplied decimal precision unless display rounding is requested.
  const precision = decimalPlaces ?? (value.split('.')[1]?.length ?? 0)
  return <span className={cn('type-price text-primary', className)} {...props}>{formatEth(eth(value), precision)}</span>
}
