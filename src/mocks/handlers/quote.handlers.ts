import { http, HttpResponse } from 'msw'
import { quoteInputSchema } from '@/contracts/requests'
import { getCart } from '../db/cart'
import { createQuote, createGuestQuote } from '../db/quote'
import { readBody, fail } from '../utils/responses'
import { now } from '../utils/clock'
import type { HandlerContext } from './context'

export function quoteHandlers(ctx: HandlerContext) {
  return [
    http.post(ctx.url('/quote'), ctx.wrap('quote.create', async (db, request) => {
      const input = await readBody(request, quoteInputSchema)
      const { cart } = getCart(db, request)
      if (cart.id !== input.cartId) fail(404, 'CART_NOT_FOUND', 'Carrinho não encontrado.')
      const quote = cart.owner.kind === 'user' ? createQuote(db, cart.owner.id, input) : createGuestQuote(db, cart, input)
      return HttpResponse.json(quote, { status: 201, headers: { Date: new Date(now(db)).toUTCString() } })
    })),
  ]
}
