import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function RouteError({ reset }: ErrorComponentProps) {
  return (
    <section role="alert" className="space-y-5">
      <h1 className="text-3xl font-semibold">Não foi possível abrir esta página</h1>
      <p className="text-muted-foreground">Tente novamente para continuar.</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </section>
  )
}
