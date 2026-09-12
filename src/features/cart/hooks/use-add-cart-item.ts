import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServices } from '@/app/providers/services-context'
import { cartKeys, nftKeys } from '@/app/query/keys'
import { ApiError } from '@/api/errors'
import type { CartItemInput } from '@/contracts/cart'
import { addCartItem } from '../api/add-cart-item'

export function useAddCartItem() {
  const { api, sessionLifecycle } = useServices()
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: CartItemInput) => {
      const version = sessionLifecycle.current()
      const cart = await addCartItem(api, input)
      sessionLifecycle.assertCurrent(version)
      return cart
    },
    onSuccess: (cart) => {
      // The server resolves guest/user ownership. Do not seed private caches from a late response.
      void client.invalidateQueries({ queryKey: cartKeys.detail(cart.owner) })
    },
    onError: (error, input) => {
      if (error instanceof ApiError && error.code === 'OUT_OF_STOCK') {
        void client.invalidateQueries({ queryKey: nftKeys.detail(input.nftId) })
      }
    },
  })
}
