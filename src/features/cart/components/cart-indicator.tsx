import { Link, useLocation } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '../hooks/use-cart'

function CartLink({ count }: { count?: number }) {
  return <Button asChild variant="ghost" size="icon" className="relative"><Link to="/cart" aria-label={count === undefined ? 'Carrinho' : `Carrinho, ${count} unidade(s)`}><ShoppingCart aria-hidden="true" />{count !== undefined && count > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-5 rounded-full bg-primary px-1 text-xs text-primary-foreground">{count}</span>}</Link></Button>
}
function CartCount() {
  const cart = useCart()
  const count = cart.ready && !cart.isError && cart.data ? cart.data.items.reduce((sum, item) => sum + item.quantity, 0) : undefined
  return <CartLink count={count} />
}
export function CartIndicator() {
  const pathname = useLocation({ select: (location) => location.pathname })
  return ['/design-system', '/login', '/register'].includes(pathname) ? <CartLink /> : <CartCount />
}
