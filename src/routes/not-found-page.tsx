import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/error-state'

export function NotFoundPage() {
  return <div className="space-y-5"><p className="type-label text-primary">404</p>
    <ErrorState headingLevel={1} title="Página não encontrada" description="O endereço informado não está disponível." action={<Button asChild><Link to="/">Voltar ao início</Link></Button>} />
  </div>
}
