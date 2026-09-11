import type { AxiosInstance } from 'axios'
import { createApiClient } from '../../src/api/client'
import type { Cart } from '../../src/contracts/cart'
import type { Quote } from '../../src/contracts/quote'
import type { CreateOrderInput } from '../../src/contracts/order'

export function createTestClient(): AxiosInstance {
  const api = createApiClient({ baseURL: 'http://mock.local/api', timeoutMs: 3000 })
  const cookies = new Map<string, string>([['jungle_session', ''], ['jungle_guest', '']])
  api.interceptors.request.use((config) => {
    config.headers.set('Cookie', [...cookies].map(([key, value]) => `${key}=${value}`).join('; '))
    return config
  })
  api.interceptors.response.use((response) => {
    const values: unknown = response.headers['set-cookie']
    for (const cookie of Array.isArray(values) ? values : typeof values === 'string' ? [values] : []) {
      if (typeof cookie !== 'string') continue
      const pair = cookie.split(';')[0] ?? ''
      const split = pair.indexOf('=')
      if (split > 0) cookies.set(pair.slice(0, split), pair.slice(split + 1))
    }
    return response
  })
  return api
}
export function login(api: AxiosInstance, email = 'collector@example.com', password = 'Jungle123!') {
  return api.post('/auth/login', { email, password })
}
export async function quoteFor(api: AxiosInstance, couponCode: string | null = null): Promise<Quote> {
  const { data: cart } = await api.get<Cart>('/cart')
  return (await api.post<Quote>('/quote', { cartId: cart.id, cartVersion: cart.version, couponCode, network: 'ethereum' })).data
}
export function orderInput(quote: Quote): CreateOrderInput {
  return { quoteId: quote.id, quoteVersion: quote.version, walletId: 'wallet-user-1', collector: { name: 'Alex Collector', email: 'collector@example.com' } }
}
