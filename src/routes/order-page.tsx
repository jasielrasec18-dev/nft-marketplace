import { useEffect } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { PrivateScope } from '@/features/account/private-scope'
import { useAccountIdentity } from '@/features/account/account-context'
import { AccountSkeleton } from '@/features/account/account-skeleton'
import { useOrder } from '@/features/orders/hooks/use-order'
import { OrderSummary } from '@/features/checkout/components/order-summary'
import { clearIntent } from '@/features/checkout/intent'
import { useServices } from '@/app/providers/services-context'
import { cartKeys } from '@/app/query/keys'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { networkNames } from '@/features/wallets/labels'
import { ApiError } from '@/api/errors'
function OrderContent() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const { userId, generation } = useAccountIdentity()
  const { queryClient, getSocket } = useServices()
  const query = useOrder(orderId)
  const order = query.data
  useEffect(() => {
    let active = true
    let detach: (() => void) | undefined
    void getSocket().then((socket) => {
      if (!active) return
      const subscribe = () => socket.emit('order.subscribe', { orderId })
      subscribe(); socket.on('connect', subscribe)
      detach = () => { socket.off('connect', subscribe); if (socket.connected) socket.emit('order.unsubscribe', { orderId }) }
    })
    return () => { active = false; detach?.() }
  }, [getSocket, orderId])
  useEffect(() => {
    if (!order || order.status === 'pending') return
    clearIntent(userId, order.id)
    void queryClient.invalidateQueries({ queryKey: cartKeys.current(userId, generation) })
  }, [order?.id, order?.status, order, userId, generation, queryClient])
  if (query.isPending) return <AccountSkeleton label="Carregando pedido" />
  if (!order) return <ErrorState headingLevel={1} title={query.error instanceof ApiError && query.error.status === 404 ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'} description={query.error?.message} onRetry={() => void query.refetch()} />
  return <section className="mx-auto max-w-xl space-y-6 rounded-lg border border-border border-b-4 border-b-primary bg-card p-5 sm:p-8" aria-label="Resultado do pedido">
    <h1 className="type-page">{order.status === 'confirmed' ? 'Pedido confirmado' : order.status === 'declined' ? 'Pagamento recusado' : 'Pagamento em processamento'}</h1>
    <p role="status" className="type-small">{order.status === 'confirmed' ? 'Seus NFTs agora estão na sua carteira na simulação.' : order.status === 'declined' ? order.declineReason : 'Aguardando a confirmação do pagamento. Você pode recarregar esta página para acompanhar o pedido.'}</p>
    {query.isError && <InlineAlert variant="warning">Não foi possível atualizar o pedido. O último estado foi mantido.</InlineAlert>}
    <dl className="type-small space-y-2"><div><dt className="text-muted-foreground">Pedido</dt><dd className="break-all">{order.id}</dd></div>{order.status === 'confirmed' && <div><dt className="text-muted-foreground">Referência da transação simulada</dt><dd className="break-all">{order.transactionReference}</dd></div>}<div><dt className="text-muted-foreground">Carteira</dt><dd className="break-all">{order.snapshot.walletAddress}</dd></div><div><dt className="text-muted-foreground">Rede</dt><dd>{networkNames[order.snapshot.network]}</dd></div></dl>
    <h2 className="type-section">{order.status === 'confirmed' ? 'Recibo da compra' : 'Detalhes do pedido'}</h2>
    <OrderSummary lines={order.snapshot.lines} totals={order.snapshot} />
    <div className="flex flex-wrap gap-3">{order.status === 'pending' && <Button disabled={query.isFetching} onClick={() => void query.refetch()}>Atualizar pedido</Button>}<Button asChild variant="outline"><Link to="/cart">Voltar ao carrinho</Link></Button><Button asChild><Link to="/" hash="catalog">Continuar explorando</Link></Button></div>
  </section>
}
export function OrderPage() { return <PrivateScope><OrderContent /></PrivateScope> }
