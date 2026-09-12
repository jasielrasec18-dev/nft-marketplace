import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isCancel } from 'axios'
import type { Cart } from '@/contracts/cart'
import type { Profile } from '@/contracts/profile'
import { networkSchema, type Network, type Wallet } from '@/contracts/wallet'
import { collectorSchema, type Collector } from '@/contracts/order'
import { ApiError } from '@/api/errors'
import { useServices } from '@/app/providers/services-context'
import { privateKeys } from '@/app/query/keys'
import { useAccountIdentity } from '@/features/account/account-context'
import { useCartQuote } from '@/features/cart/hooks/use-cart-quote'
import { createOrder } from '@/features/orders/api/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { ErrorState } from '@/components/feedback/error-state'
import { CartSummarySkeleton } from '@/components/shared/cart-summary-skeleton'
import { networkNames } from '@/features/wallets/labels'
import { OrderSummary } from './order-summary'
import { WalletConnectionControl } from './wallet-connection'
import { clearIntent, newIntent, readIntent, saveIntent, type PurchaseIntent } from '../intent'
import { reviewFingerprint } from '../review'

export function CheckoutForm({ cart, profile, wallets, refreshing, reloadCart }: { cart: Cart; profile: Profile; wallets: Wallet[]; refreshing: boolean; reloadCart: () => Promise<unknown> }) {
  const { api, queryClient, sessionLifecycle, realtime } = useServices()
  const { userId, generation } = useAccountIdentity()
  const navigate = useNavigate()
  const first = wallets.find((wallet) => wallet.role === 'primary') ?? wallets[0]
  const [walletId, setWalletId] = useState(first?.id ?? '')
  const [network, setNetwork] = useState<Network>(first?.network ?? 'ethereum')
  const [connected, setConnected] = useState(false)
  const [intent, setIntent] = useState(() => readIntent(userId))
  const [reviewing, setReviewing] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()
  const locked = useRef(false)
  const quote = useCartQuote(cart, cart.couponCode, generation, refreshing || !!intent, network)
  const wallet = wallets.find((entry) => entry.id === walletId && entry.network === network)
  const form = useForm<Collector>({ resolver: zodResolver(collectorSchema), defaultValues: { name: profile.name, email: profile.email } })
  const create = useMutation({
    mutationKey: [...privateKeys.orders(userId), 'create'],
    gcTime: 0,
    mutationFn: async (attempt: PurchaseIntent) => {
      sessionLifecycle.assertCurrent(generation)
      const order = await createOrder(api, attempt.input, attempt.key)
      sessionLifecycle.assertCurrent(generation)
      if (order.userId !== userId) throw new Error('O pedido não pertence a esta conta.')
      return order
    },
  })
  const busy = reviewing || create.isPending
  async function send(attempt: PurchaseIntent) {
    try {
      const order = await create.mutateAsync(attempt)
      saveIntent({ ...attempt, orderId: order.id })
      queryClient.setQueryData(privateKeys.order(userId, order.id), order)
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    } catch (cause) {
      if (isCancel(cause)) return
      const businessFailure = cause instanceof ApiError && cause.status !== undefined && cause.status < 500 && cause.status !== 401 && cause.code !== 'IDEMPOTENCY_CONFLICT'
      if (businessFailure) { clearIntent(userId); setIntent(undefined); quote.refresh(); await reloadCart() }
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir o pedido.')
    }
  }
  async function confirm(values: Collector) {
    if (locked.current || busy || intent || !wallet || !connected || !quote.quote || refreshing) return
    locked.current = true
    setReviewing(true); setNotice(undefined); setError(undefined)
    const reviewed = quote.quote
    const liveBefore = realtime.fingerprint(cart.items.map((item) => item.nft.id))
    try {
      const latest = (await quote.revalidate()).quote
      sessionLifecycle.assertCurrent(generation)
      if (liveBefore !== realtime.fingerprint(cart.items.map((item) => item.nft.id)) || reviewFingerprint(reviewed) !== reviewFingerprint(latest)) { setNotice('Preço, disponibilidade ou valores alterados. Revise o resumo e confirme novamente.'); return }
      const attempt = newIntent(userId, { quoteId: latest.id, quoteVersion: latest.version, walletId: wallet.id, collector: values })
      setIntent(attempt)
      await send(attempt)
    } catch (cause) { if (!isCancel(cause)) setError(cause instanceof Error ? cause.message : 'Não foi possível revalidar a compra.') }
    finally { locked.current = false; setReviewing(false) }
  }
  return <div className="space-y-6">
    {intent && <section aria-label="Retomar pedido" className="space-y-4 rounded-md border border-warning p-5"><h2 className="type-section">Retomar tentativa de compra</h2><p className="type-small">Existe uma tentativa ainda não concluída nesta aba. Recupere seu resultado antes de iniciar outra compra.</p>
      {intent.orderId ? <Button asChild><Link to="/orders/$orderId" params={{ orderId: intent.orderId }}>Ver pedido em andamento</Link></Button> : <Button disabled={busy} onClick={async () => { if (locked.current) return; locked.current = true; setError(undefined); try { await send(intent) } finally { locked.current = false } }}>{busy ? 'Recuperando pedido…' : 'Recuperar pedido'}</Button>}
    </section>}
    {notice && <InlineAlert variant="warning">{notice}</InlineAlert>}
    {error && <InlineAlert variant="error">{error}</InlineAlert>}
    <form aria-label="Finalizar compra" noValidate onSubmit={(event) => { void form.handleSubmit(confirm)(event) }} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <section className="min-w-0 space-y-6" aria-labelledby="collector-title"><h2 id="collector-title" className="type-section">Perfil do colecionador</h2>
        <fieldset disabled={busy || !!intent} className="grid gap-5 sm:grid-cols-2">
          <FormField label="Nome de exibição" required error={form.formState.errors.name?.message}>{(props) => <Input {...props} {...form.register('name')} autoComplete="name" />}</FormField>
          <FormField label="E-mail" required error={form.formState.errors.email?.message}>{(props) => <Input {...props} {...form.register('email')} type="email" autoComplete="email" />}</FormField>
        </fieldset>
        <FormField label="Rede" required>{(props) => <Select value={network} disabled={busy || !!intent} onValueChange={(value: Network) => { setNetwork(value); setWalletId(''); setConnected(false); setNotice('Rede alterada. Selecione e conecte uma carteira para revisar a compra.') }}><SelectTrigger {...props}><SelectValue /></SelectTrigger><SelectContent>{networkSchema.options.map((value) => <SelectItem value={value} key={value}>{networkNames[value]}</SelectItem>)}</SelectContent></Select>}</FormField>
        <fieldset disabled={busy || !!intent} className="space-y-3"><legend className="type-section mb-3">Carteiras cadastradas</legend><RadioGroup aria-label="Carteira para pagamento" value={walletId} onValueChange={(value) => { setWalletId(value); setConnected(false) }}>
          {wallets.filter((entry) => entry.network === network).map((entry) => <div key={entry.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-input bg-card p-4 has-[[data-state=checked]]:border-primary"><RadioGroupItem id={'checkout-' + entry.id} value={entry.id} disabled={busy || !!intent} /><Label htmlFor={'checkout-' + entry.id} className="min-w-0 space-y-1"><span className="block">{entry.label} · {entry.role === 'primary' ? 'Principal' : 'Secundária'}</span><span className="type-caption block break-all text-muted-foreground">{entry.address}</span><span className="type-caption block">{networkNames[entry.network]}</span></Label></div>)}
        </RadioGroup></fieldset>
        {!wallets.some((entry) => entry.network === network) && <p className="type-small">Nenhuma carteira cadastrada nesta rede.</p>}
        <Link to="/account/wallets" className="inline-flex min-h-11 items-center text-primary underline">Gerenciar carteiras</Link>
        {wallet && <WalletConnectionControl key={wallet.id + ':' + wallet.network} wallet={wallet} disabled={busy || !!intent} onConnected={setConnected} />}
      </section>
      <aside aria-label="Revisão do pedido" className="min-w-0 space-y-5 rounded-xl bg-card/50 p-4 sm:p-5"><h2 className="type-section">Seus NFTs</h2>
        {intent ? <p className="type-small text-muted-foreground">Recupere a tentativa acima para consultar os valores do pedido.</p> : quote.isPending ? <CartSummarySkeleton /> : quote.quote ? <OrderSummary lines={quote.quote.lines} totals={quote.quote} /> : <ErrorState title="Cotação indisponível" description={quote.error?.message} onRetry={() => { void reloadCart().then(quote.refresh) }} />}
        <p className="type-caption text-muted-foreground">A cotação será revalidada antes do envio. A compra e o pagamento são simulados.</p>
        <Button type="submit" className="w-full rounded-full sm:rounded-md" disabled={busy || !!intent || !connected || !wallet || !quote.quote || quote.isPending || refreshing} aria-busy={busy}>{busy ? 'Revalidando e enviando…' : 'Confirmar compra'}</Button>
        <Link to="/cart" className="inline-flex min-h-11 items-center text-primary underline">Voltar ao carrinho</Link>
      </aside>
    </form>
  </div>
}
