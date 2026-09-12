import type { Cart, CartItemInput } from '@/contracts/cart'
import type { MockDatabase, StoredCart } from './types'
import { cookie, fail } from '../utils/responses'
import { nextId } from '../utils/clock'
import { currentUser } from './session'
import { findNft, validateStock } from './catalog'

export function getCart(db: MockDatabase, request: Request): { cart: StoredCart; guestCookie?: string } {
  const user = currentUser(db, request, false)
  const guestId = cookie(request, 'jungle_guest')
  const existing = db.carts.find((cart) => user
    ? cart.owner.kind === 'user' && cart.owner.id === user.id
    : cart.owner.kind === 'guest' && cart.owner.id === guestId)
  if (existing) return { cart: existing }
  const owner = user ? { kind: 'user' as const, id: user.id } : { kind: 'guest' as const, id: crypto.randomUUID() }
  const cart: StoredCart = { id: nextId(db, 'cart'), owner, items: [], couponCode: null, version: 1 }
  db.carts.push(cart)
  return { cart, ...(!user ? { guestCookie: `jungle_guest=${owner.id}; Path=/; SameSite=Lax; Max-Age=2592000` } : {}) }
}
export function hydrateCart(db: MockDatabase, cart: StoredCart): Cart {
  return { ...cart, items: cart.items.map((item) => ({ ...item, nft: structuredClone(findNft(db, item.nftId)) })) }
}
export function addCartItem(db: MockDatabase, cart: StoredCart, input: CartItemInput) {
  const existing = cart.items.find((item) => item.nftId === input.nftId && item.editionId === input.editionId)
  const quantity = (existing?.quantity ?? 0) + input.quantity
  validateStock(db, input.nftId, input.editionId, quantity)
  if (existing) existing.quantity = quantity
  else cart.items.push({ ...input, id: nextId(db, 'item') })
  cart.version += 1
}
export function findCartItem(cart: StoredCart, id: string) {
  return cart.items.find((item) => item.id === id) ?? fail(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado neste carrinho.')
}
export function mergeGuestCart(db: MockDatabase, request: Request, userId: string) {
  const guestId = cookie(request, 'jungle_guest')
  const guest = db.carts.find((cart) => cart.owner.kind === 'guest' && cart.owner.id === guestId)
  if (!guest || guest.items.length === 0) return
  let target = db.carts.find((cart) => cart.owner.kind === 'user' && cart.owner.id === userId)
  if (!target) {
    target = { id: nextId(db, 'cart'), owner: { kind: 'user', id: userId }, items: [], couponCode: null, version: 1 }
    db.carts.push(target)
  }
  for (const item of guest.items) {
    const existing = target.items.find((other) => other.nftId === item.nftId && other.editionId === item.editionId)
    
    if (existing) existing.quantity += item.quantity
    else target.items.push({ ...item, id: nextId(db, 'item') })
  }
  target.version += 1
  target.couponCode ??= guest.couponCode
  guest.items = []
  guest.couponCode = null
  guest.version += 1
}
