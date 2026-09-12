import type { AxiosInstance } from 'axios'
import type { Cart } from '@/contracts/cart'
import type { Quote, QuoteInput } from '@/contracts/quote'
import { ApiError } from '@/api/errors'

export async function getCart(api: AxiosInstance, signal?: AbortSignal) {
  return (await api.get<Cart>('/cart', { signal })).data
}
export async function updateCartItem(api: AxiosInstance, id: string, quantity: number) {
  return (await api.patch<Cart>('/cart/items/' + encodeURIComponent(id), { quantity })).data
}
export async function removeCartItem(api: AxiosInstance, id: string) {
  await api.delete('/cart/items/' + encodeURIComponent(id))
  return getCart(api)
}
export async function getQuote(api: AxiosInstance, input: QuoteInput) {
  const response = await api.post<Quote>('/quote', input)
  const serverTime = Date.parse(String(response.headers.date ?? ''))
  const lifetime = Date.parse(response.data.expiresAt) - serverTime
  if (!Number.isFinite(lifetime) || lifetime <= 0) throw new ApiError('Não foi possível confirmar a validade da cotação. Tente novamente.', { code: 'QUOTE_EXPIRED' })
  return { quote: response.data, validUntil: Date.now() + lifetime }
}
