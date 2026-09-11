import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorState({ title, description, onRetry, action, headingLevel = 2 }: { title: string; description?: string; onRetry?: () => void; action?: ReactNode; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return <section role="alert" className="space-y-5">
    <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
    <Heading className={headingLevel === 1 ? 'type-page' : 'type-section'}>{title}</Heading>
    {description && <p className="type-small text-muted-foreground">{description}</p>}
    {onRetry && <Button onClick={onRetry}>Tentar novamente</Button>}
    {action}
  </section>
}
