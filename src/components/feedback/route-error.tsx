import type { ErrorComponentProps } from '@tanstack/react-router'
import { ErrorState } from '@/components/feedback/error-state'

export function RouteError({ reset }: ErrorComponentProps) {
  return <ErrorState headingLevel={1} title="Não foi possível abrir esta página" description="Tente novamente para continuar." onRetry={reset} />
}
