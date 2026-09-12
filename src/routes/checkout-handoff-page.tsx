import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function CheckoutHandoffPage() {
  return <div className="space-y-6"><h1 className="type-page">Finalização de compra</h1><p className="type-body max-w-xl text-muted-foreground">A finalização de compra ainda não está disponível. Seus itens continuam no carrinho.</p><Button asChild><Link to="/cart">Voltar ao carrinho</Link></Button></div>
}
