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
    mutationKey: cartKeys.mutations,
    onMutate: () => client.cancelQueries({ predicate: (query) => query.queryKey.at(-1) === 'cart' }),
    mutationFn: async (input: CartItemInput) => {
      const version = sessionLifecycle.current()
      const cart = await addCartItem(api, input)
      sessionLifecycle.assertCurrent(version)
      return cart
    },
    onSuccess: (cart) => {
      // The server resolves guest/user ownership. Do not seed private caches from a late response.
      void client.invalidateQueries({ queryKey: cartKeys.detail(cart.owner) })
      client.setQueryData(cartKeys.current(cart.owner.kind === 'user' ? cart.owner.id : undefined, sessionLifecycle.current()), cart)
    },
    onError: (error, input) => {
      if (error instanceof ApiError && error.code === 'OUT_OF_STOCK') {
        void client.invalidateQueries({ queryKey: nftKeys.detail(input.nftId) })
      }
    },
  })
}
