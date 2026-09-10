import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="space-y-5">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço informado não está disponível.</p>
      <Button asChild><Link to="/">Voltar ao início</Link></Button>
    </section>
  )
}
