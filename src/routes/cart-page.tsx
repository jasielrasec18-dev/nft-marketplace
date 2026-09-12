import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CartSummarySkeleton } from '@/components/shared/cart-summary-skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { useCart } from '@/features/cart/hooks/use-cart'
import { CartContents } from '@/features/cart/components/cart-contents'
import { CartRecommendations } from '@/features/cart/components/cart-recommendations'

export function CartPage() {
  const cart = useCart()
  return <div className="space-y-6">
    <nav aria-label="Breadcrumb" className="type-caption text-muted-foreground"><Link to="/">Início</Link> / <Link to="/" hash="catalog">Mercado</Link> / <span aria-current="page">Carrinho</span></nav>
    <h1 id="cart-title" tabIndex={-1} className="type-page">Carrinho de NFTs</h1>
    {cart.session.isError ? <ErrorState title="Não foi possível verificar sua sessão" onRetry={() => void cart.session.refetch()} /> :
      !cart.ready || cart.isPending ? <div role="status" aria-label="Carregando carrinho" className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]"><div className="space-y-3"><span className="sr-only">Carregando carrinho</span>{[0, 1, 2].map((row) => <Skeleton key={row} className="h-28 w-full" />)}</div><CartSummarySkeleton /></div> :
      !cart.data ? <ErrorState title="Não foi possível carregar seu carrinho" description="Confira sua conexão e tente novamente." onRetry={() => void cart.refetch()} /> :
      <>{cart.isError && <InlineAlert variant="warning">Não foi possível atualizar o carrinho. Os últimos itens foram mantidos. <Button variant="link" onClick={() => void cart.refetch()}>Tentar novamente</Button></InlineAlert>}
        {cart.data.items.length ? <CartContents key={cart.data.id + ':' + cart.generation} cart={cart.data} generation={cart.generation} refreshing={cart.isFetching} refreshError={cart.error} refresh={() => cart.refetch()} /> :
          <EmptyState icon={<ShoppingCart />} title="Seu carrinho está vazio" description="Encontre uma obra para começar sua coleção." action={<Button asChild><Link to="/" hash="catalog">Explorar catálogo</Link></Button>} />}
      </>}
    <CartRecommendations />
  </div>
}
