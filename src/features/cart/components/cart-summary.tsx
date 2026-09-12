import { Link } from '@tanstack/react-router'
import type { Quote } from '@/contracts/quote'
import { ETHPrice } from '@/components/shared/eth-price'
import { CartSummarySkeleton } from '@/components/shared/cart-summary-skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'

export function CartSummary({ quote, error, pending, authenticated, onRetry }: {
  quote?: Quote; error: Error | null; pending: boolean; authenticated: boolean; onRetry: () => void
}) {
  if (pending) return <CartSummarySkeleton />
  if (error || !quote) return <div className="space-y-5"><ErrorState title="Resumo indisponível" description={error?.message ?? 'Atualize a cotação para continuar.'} onRetry={onRetry} /><Button className="w-full" disabled>Finalizar compra</Button></div>
  return <div className="space-y-5">
    <dl className="type-small space-y-3" aria-label="Valores da cotação">
      {([['Subtotal', quote.subtotalEth], ['Desconto', quote.discountEth], ['Taxa de rede', quote.networkFeeEth], ['Total', quote.totalEth]] as const).map(([label, value]) =>
        <div key={label} className={'flex flex-wrap justify-between gap-x-3 gap-y-1 ' + (label === 'Total' ? 'border-t border-border pt-4 font-bold' : '')}><dt>{label}</dt><dd className="min-w-0"><ETHPrice value={value} className="break-all text-sm" data-testid={'quote-' + label.toLowerCase().replaceAll(' ', '-')} /></dd></div>)}
    </dl>
    <p className="type-caption text-muted-foreground">Taxa estimada na rede Ethereum. A cotação será revisada antes da compra.</p>
    <Button asChild className="w-full rounded-full sm:rounded-md">{authenticated
      ? <Link to="/checkout">Continuar para finalização</Link>
      : <Link to="/login" search={{ redirect: '/checkout' }}>Conectar e finalizar</Link>}</Button>
    <Button asChild variant="link" className="w-full"><Link to="/" hash="catalog">Continuar explorando</Link></Button>
  </div>
}
