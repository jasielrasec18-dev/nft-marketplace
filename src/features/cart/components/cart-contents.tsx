import { useState } from 'react'
import type { Cart } from '@/contracts/cart'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { useCartActions } from '../hooks/use-cart-actions'
import { useCartQuote } from '../hooks/use-cart-quote'
import { CartItem } from './cart-item'
import { CartSummary } from './cart-summary'
import { CouponForm } from './coupon-form'

export function CartContents({ cart, generation, refreshing, refreshError, refresh }: { cart: Cart; generation: number; refreshing: boolean; refreshError: Error | null; refresh: () => Promise<unknown> }) {
  const [coupon, setCoupon] = useState(cart.couponCode)
  const actions = useCartActions(cart, generation)
  const quote = useCartQuote(cart, coupon, generation, refreshing || !!refreshError || actions.isPending)
  const pending = refreshing || actions.isPending
  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]" data-testid="cart-content">
    <section aria-label="Itens do carrinho" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="type-small text-muted-foreground">{cart.items.reduce((sum, item) => sum + item.quantity, 0)} unidade(s)</p><Button variant="outline" size="sm" disabled={pending || (!refreshError && quote.isPending)} onClick={async () => { await refresh(); quote.refresh() }}>Atualizar carrinho</Button></div>
      <div aria-hidden="true" className="type-caption hidden grid-cols-[minmax(0,1fr)_7rem_8.5rem_8rem_2.75rem] gap-3 px-3 lg:grid"><span>NFTs</span><span>Preço</span><span>Quantidade</span><span>Total</span><span /></div>
      <ul className="space-y-3">{cart.items.map((item) => <CartItem key={item.id} item={item} pending={pending} line={quote.quote?.lines.find((line) => line.nftId === item.nftId && line.editionId === item.editionId)}
        onQuantity={(quantity) => actions.mutate({ kind: 'update', itemId: item.id, quantity })}
        onRemove={() => actions.mutate({ kind: 'remove', itemId: item.id }, { onSuccess: () => document.getElementById('cart-title')?.focus() })} />)}</ul>
      {actions.isPending && <p role="status" className="type-small text-muted-foreground">Atualizando carrinho…</p>}
      {actions.isError && <InlineAlert variant="error">{actions.error.message || 'Não foi possível alterar o carrinho. Tente novamente.'}</InlineAlert>}
      {actions.isSuccess && <p role="status" className="type-small text-success">Carrinho atualizado.</p>}
    </section>
    <aside aria-labelledby="cart-summary-title" className="min-w-0 space-y-5 rounded-2xl bg-card p-4 sm:p-5 xl:bg-transparent xl:p-0">
      <h2 id="cart-summary-title" className="type-section">Resumo da carteira</h2>
      <CouponForm coupon={coupon} error={quote.error} pending={pending || quote.isPending} onApply={(code) => { setCoupon(code); if (code === coupon) quote.refresh() }} onRemove={() => setCoupon(null)} />
      <CartSummary quote={quote.quote} error={refreshError ?? quote.error} pending={pending || (!refreshError && quote.isPending)} authenticated={cart.owner.kind === 'user'} onRetry={refreshError ? () => void refresh() : quote.refresh} />
    </aside>
  </div>
}
