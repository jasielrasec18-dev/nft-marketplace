import type { AxiosInstance } from 'axios'
import type { Cart, CartItemInput } from '@/contracts/cart'

export async function addCartItem(api: AxiosInstance, input: CartItemInput): Promise<Cart> {
  return (await api.post<Cart>('/cart/items', input)).data
}
