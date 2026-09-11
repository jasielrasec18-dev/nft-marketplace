import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return <section className={cn('flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-5 py-12 text-center', className)}>
    {icon && <span aria-hidden="true" className="text-primary [&>svg]:size-8">{icon}</span>}
    <h2 className="type-section">{title}</h2>
    {description && <p className="type-small max-w-md text-muted-foreground">{description}</p>}
    {action}
  </section>
}
