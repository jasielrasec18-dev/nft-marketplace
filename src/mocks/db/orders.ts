import type { CreateOrderInput, Order, OrderStatus } from '@/contracts/order'
import type { MockDatabase } from './types'
import { calculateQuote, quoteFingerprint } from './quote'
import { findNft, updateNftAvailability } from './catalog'
import { expiresIn, isoNow, nextId, now } from '../utils/clock'
import { fail } from '../utils/responses'
import { getScenario } from '../scenarios/config'

function fingerprint(input: CreateOrderInput): string {
  // Canonical explicit field order; equivalent JSON key ordering has the same identity.
  return JSON.stringify([input.quoteId, input.quoteVersion, input.walletId, input.collector.name, input.collector.email])
}
export function createOrder(db: MockDatabase, userId: string, input: CreateOrderInput, key: string): { order: Order; created: boolean } {
  if (!key.trim() || key.length > 200) fail(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Informe uma Idempotency-Key de até 200 caracteres.')
  const payloadFingerprint = fingerprint(input)
  const previous = db.idempotency.find((item) => item.userId === userId && item.key === key)
  if (previous) {
    if (previous.fingerprint !== payloadFingerprint) fail(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada com outro conteúdo.')
    const order = db.orders.find((item) => item.id === previous.orderId && item.userId === userId)
      ?? fail(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    return { order, created: false }
  }
  const stored = db.quotes.find((item) => item.quote.id === input.quoteId && item.userId === userId)
    ?? fail(404, 'QUOTE_NOT_FOUND', 'Cotação não encontrada.')
  const quote = stored.quote
  if (stored.orderId) fail(409, 'QUOTE_ALREADY_USED', 'Esta cotação já possui um pedido.')
  if (input.quoteVersion !== quote.version || Date.parse(quote.expiresAt) <= now(db)) {
    fail(409, 'QUOTE_EXPIRED', 'A cotação expirou. Solicite uma nova cotação.')
  }
  const cart = db.carts.find((item) => item.id === quote.cartId && item.owner.kind === 'user' && item.owner.id === userId)
    ?? fail(404, 'CART_NOT_FOUND', 'Carrinho não encontrado.')
  const current = calculateQuote(db, cart, {
    cartId: quote.cartId, cartVersion: quote.cartVersion, couponCode: quote.couponCode, network: quote.network,
  })
  if (quoteFingerprint(current) !== quoteFingerprint(quote)) fail(409, 'QUOTE_CHANGED', 'Preço ou disponibilidade mudou. Revise uma nova cotação.')
  const wallet = db.wallets.find((item) => item.id === input.walletId && item.userId === userId)
    ?? fail(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
  if (wallet.network !== quote.network) fail(422, 'NETWORK_MISMATCH', 'A carteira pertence a outra rede.')

  const timestamp = isoNow(db)
  const order: Order = {
    id: nextId(db, 'order'), userId, status: 'pending', version: 1,
    snapshot: structuredClone({
      lines: quote.lines, collector: input.collector, walletAddress: wallet.address, network: quote.network,
      couponCode: quote.couponCode, subtotalEth: quote.subtotalEth, discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth, totalEth: quote.totalEth,
    }),
    createdAt: timestamp, updatedAt: timestamp, transactionReference: null, declineReason: null,
  }
  // Reserve available stock atomically. Declines release it; confirmations consume it.
  for (const line of order.snapshot.lines) {
    const edition = findNft(db, line.nftId).editions.find((item) => item.id === line.editionId)
      ?? fail(422, 'INVALID_EDITION', 'Edição inválida.')
    updateNftAvailability(db, line.nftId, edition.availableQuantity - line.quantity, line.editionId)
  }
  stored.orderId = order.id
  db.orders.push(order)
  db.idempotency.push({ userId, key, fingerprint: payloadFingerprint, orderId: order.id })
  const scenario = getScenario(db.scenario)
  db.payments.push({ orderId: order.id, dueAt: expiresIn(db, scenario.paymentDelayMs), outcome: scenario.payment })
  return { order, created: true }
}
export function transitionOrder(db: MockDatabase, orderId: string, status: Exclude<OrderStatus, 'pending'>): Order {
  const order = db.orders.find((item) => item.id === orderId) ?? fail(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
  if (order.status === status) return order
  if (order.status !== 'pending') fail(409, 'ORDER_TERMINAL', 'O pedido já foi finalizado.')
  order.status = status
  order.updatedAt = isoNow(db)
  order.version += 1
  if (status === 'confirmed') {
    order.transactionReference = `SIMULATED-${order.id}`
    const cart = db.carts.find((item) => item.owner.kind === 'user' && item.owner.id === order.userId)
    if (cart) {
      for (const line of order.snapshot.lines) {
        const item = cart.items.find((entry) => entry.nftId === line.nftId && entry.editionId === line.editionId)
        if (item) item.quantity = Math.max(0, item.quantity - line.quantity)
      }
      cart.items = cart.items.filter((item) => item.quantity > 0)
      cart.version += 1
    }
  } else {
    order.declineReason = 'Pagamento recusado na simulação.'
    for (const line of order.snapshot.lines) {
      const edition = findNft(db, line.nftId).editions.find((item) => item.id === line.editionId)
        ?? fail(422, 'INVALID_EDITION', 'Edição inválida.')
      updateNftAvailability(db, line.nftId, edition.availableQuantity + line.quantity, line.editionId)
    }
  }
  db.payments = db.payments.filter((payment) => payment.orderId !== orderId)
  return order
}
export function settleDueOrders(db: MockDatabase) {
  for (const payment of [...db.payments]) {
    if (Date.parse(payment.dueAt) <= now(db)) transitionOrder(db, payment.orderId, payment.outcome)
  }
}
