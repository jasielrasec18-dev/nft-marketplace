import Big from 'big.js'
import type { Quote, QuoteInput, QuoteTotals } from '@/contracts/quote'
import { eth, multiplyEth, subtractEth, sumEth } from '@/lib/money'
import type { MockDatabase, StoredCart } from './types'
import { validateStock } from './catalog'
import { getScenario } from '../scenarios/config'
import { fail } from '../utils/responses'
import { expiresIn, nextId, now } from '../utils/clock'

const Decimal = Big()
Decimal.strict = true

export function calculateQuote(db: MockDatabase, cart: StoredCart, input: QuoteInput): Omit<Quote, 'id' | 'version' | 'expiresAt'> {
  if (cart.version !== input.cartVersion) fail(409, 'CART_CHANGED', 'O carrinho mudou. Revise os itens.')
  if (cart.items.length === 0) fail(422, 'EMPTY_CART', 'Seu carrinho está vazio.')
  const lines = cart.items.map((item) => {
    const { nft, edition } = validateStock(db, item.nftId, item.editionId, item.quantity)
    return {
      nftId: nft.id, editionId: edition.id, name: nft.name, editionName: edition.name,
      imageUrl: nft.imageUrl, quantity: item.quantity, unitPriceEth: nft.priceEth,
      subtotalEth: multiplyEth(nft.priceEth, item.quantity), nftVersion: nft.version,
    }
  })
  const subtotalEth = sumEth(lines.map((line) => line.subtotalEth))
  const couponCode = input.couponCode?.trim().toUpperCase() || null
  let discountEth = eth('0')
  if (couponCode) {
    const override = getScenario(db.scenario).couponError
    if (override) fail(422, override, override === 'INVALID_COUPON' ? 'Cupom inválido.' : 'Cupom expirado.')
    const coupon = db.coupons.find((item) => item.code === couponCode) ?? fail(422, 'INVALID_COUPON', 'Cupom inválido.')
    if (Date.parse(coupon.expiresAt) <= now(db)) fail(422, 'EXPIRED_COUPON', 'Cupom expirado.')
      
    discountEth = eth(new Decimal(subtotalEth).times(coupon.discountRate).toFixed(18, Decimal.roundDown))
  }
  const networkFeeEth = eth(input.network === 'ethereum' ? '0.005' : '0.001')
  const totals: QuoteTotals = {
    subtotalEth, discountEth, networkFeeEth,
    totalEth: sumEth([subtractEth(subtotalEth, discountEth), networkFeeEth]),
  }
  return { ...totals, cartId: cart.id, cartVersion: cart.version, lines, network: input.network, couponCode }
}
export function createGuestQuote(db: MockDatabase, cart: StoredCart, input: QuoteInput): Quote {
  const values = calculateQuote(db, cart, input)
  cart.couponCode = values.couponCode
  // A visitor receives a price preview, never an order-authorizing stored quote.
  return { ...values, id: nextId(db, 'guest-quote'), version: 1, expiresAt: expiresIn(db, 5 * 60 * 1000) }
}
export function createQuote(db: MockDatabase, userId: string, input: QuoteInput): Quote {
  const cart = db.carts.find((item) => item.id === input.cartId && item.owner.kind === 'user' && item.owner.id === userId)
    ?? fail(404, 'CART_NOT_FOUND', 'Carrinho não encontrado.')
  const values = calculateQuote(db, cart, input)
  const quote: Quote = { ...values, id: nextId(db, 'quote'), version: 1, expiresAt: expiresIn(db, 5 * 60 * 1000) }
  cart.couponCode = values.couponCode
  db.quotes.push({ userId, quote, orderId: null })
  return quote
}

export function quoteFingerprint(quote: Omit<Quote, 'id' | 'version' | 'expiresAt'>): string {
  return JSON.stringify([
    quote.cartId, quote.cartVersion, quote.network, quote.couponCode,
    quote.subtotalEth, quote.discountEth, quote.networkFeeEth, quote.totalEth,
    quote.lines.map((line) => [line.nftId, line.editionId, line.quantity, line.unitPriceEth, line.subtotalEth, line.nftVersion]),
  ])
}
