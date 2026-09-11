import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type QuantitySelectorProps = {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  'aria-label': string
}
export function QuantitySelector({ value, onValueChange, min = 1, max = Infinity, disabled, 'aria-label': label }: QuantitySelectorProps) {
  return <div role="group" aria-label={label} className="inline-flex items-center gap-1 rounded-full bg-card">
    <Button variant="ghost" size="icon" className="rounded-full text-primary" disabled={disabled || value <= min} onClick={() => onValueChange(Math.max(min, value - 1))} aria-label={`Diminuir ${label.toLowerCase()}`}><Minus /></Button>
    <output aria-live="polite" aria-atomic="true" className="min-w-6 text-center text-sm tabular-nums">{value}</output>
    <Button variant="ghost" size="icon" className="rounded-full text-primary" disabled={disabled || value >= max} onClick={() => onValueChange(Math.min(max, value + 1))} aria-label={`Aumentar ${label.toLowerCase()}`}><Plus /></Button>
  </div>
}
