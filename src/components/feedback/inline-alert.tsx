import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

const variants = {
  info: { icon: Info, color: 'text-foreground', label: 'Informação' },
  success: { icon: CircleCheck, color: 'text-success', label: 'Sucesso' },
  warning: { icon: TriangleAlert, color: 'text-warning', label: 'Atenção' },
  error: { icon: CircleAlert, color: 'text-destructive', label: 'Erro' },
}
export function InlineAlert({ variant = 'info', children, className }: { variant?: keyof typeof variants; children: ReactNode; className?: string }) {
  const { icon: Icon, color, label } = variants[variant]
  return <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-md border border-border bg-card p-4 type-small', color, className)}>
    <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
    <div><span className="sr-only">{label}: </span>{children}</div>
  </div>
}
