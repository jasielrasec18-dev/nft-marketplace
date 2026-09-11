import { http, HttpResponse } from 'msw'
import { cartItemInputSchema, cartItemPatchSchema } from '@/contracts/requests'
import { addCartItem, findCartItem, getCart, hydrateCart } from '../db/cart'
import { validateStock } from '../db/catalog'
import { readBody } from '../utils/responses'
import { pathParam, type HandlerContext } from './context'

export function cartHandlers(ctx: HandlerContext) {
  return [
    http.get(ctx.url('/cart'), ctx.wrap('cart.get', (db, request) => {
      const { cart, guestCookie } = getCart(db, request)
      return HttpResponse.json(hydrateCart(db, cart), { headers: guestCookie ? { 'Set-Cookie': guestCookie } : undefined })
    })),
    http.post(ctx.url('/cart/items'), ctx.wrap('cart.add', async (db, request) => {
      const input = await readBody(request, cartItemInputSchema)
      const { cart, guestCookie } = getCart(db, request)
      addCartItem(db, cart, input)
      return HttpResponse.json(hydrateCart(db, cart), { status: 201, headers: guestCookie ? { 'Set-Cookie': guestCookie } : undefined })
    })),
    http.patch(ctx.url('/cart/items/:itemId'), ctx.wrap('cart.update', async (db, request, params) => {
      const input = await readBody(request, cartItemPatchSchema)
      const { cart } = getCart(db, request)
      const item = findCartItem(cart, pathParam(params, 'itemId'))
      validateStock(db, item.nftId, item.editionId, input.quantity)
      item.quantity = input.quantity
      cart.version += 1
      return HttpResponse.json(hydrateCart(db, cart))
    })),
    http.delete(ctx.url('/cart/items/:itemId'), ctx.wrap('cart.remove', (db, request, params) => {
      const { cart } = getCart(db, request)
      const item = findCartItem(cart, pathParam(params, 'itemId'))
      cart.items = cart.items.filter((entry) => entry.id !== item.id)
      cart.version += 1
      return new HttpResponse(null, { status: 204 })
    })),
  ]
}
