import { Link } from '@tanstack/react-router'
import { PrivateScope } from '@/features/account/private-scope'
import { AccountSkeleton } from '@/features/account/account-skeleton'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { useWallets } from '@/features/wallets/hooks/use-wallets'
import { useCart } from '@/features/cart/hooks/use-cart'
import { CheckoutForm } from '@/features/checkout/components/checkout-form'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import { readIntent } from '@/features/checkout/intent'
import { useAccountIdentity } from '@/features/account/account-context'
function CheckoutResources() {
  const { userId } = useAccountIdentity()
  const cart = useCart()
  const profile = useProfile()
  const wallets = useWallets()
  if (cart.isPending || profile.isPending || wallets.isPending) return <AccountSkeleton label="Carregando pagamento" />
  if (cart.isError || profile.isError || wallets.isError) return <ErrorState title="Não foi possível preparar a compra" description={(cart.error ?? profile.error ?? wallets.error)?.message} onRetry={() => { void Promise.all([cart.refetch(), profile.refetch(), wallets.refetch()]) }} />
  if (!cart.data || !cart.data.items.length && !readIntent(userId)) return <EmptyState title="Seu carrinho está vazio" action={<Button asChild><Link to="/" hash="catalog">Explorar NFTs</Link></Button>} />
  if (!wallets.data?.length) return <EmptyState title="Cadastre uma carteira para continuar" action={<Button asChild><Link to="/account/wallets">Adicionar carteira</Link></Button>} />
  if (!profile.data) return null
  return <CheckoutForm cart={cart.data} profile={profile.data} wallets={wallets.data} refreshing={cart.isFetching} reloadCart={cart.refetch} />
}
export function CheckoutPage() {
  return <div className="space-y-6"><nav aria-label="Breadcrumb" className="type-caption text-muted-foreground"><Link to="/">Início</Link> / <Link to="/cart">Carrinho</Link> / Pagamento</nav><h1 className="type-page">Pagamento com carteira</h1><PrivateScope><CheckoutResources /></PrivateScope></div>
}
