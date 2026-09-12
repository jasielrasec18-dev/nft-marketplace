import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '@/contracts/cart'
import { useServices } from '@/app/providers/services-context'
import { cartKeys, nftKeys } from '@/app/query/keys'
import { ApiError } from '@/api/errors'
import { removeCartItem, updateCartItem } from '../api/cart'

type Action = { kind: 'update'; itemId: string; quantity: number } | { kind: 'remove'; itemId: string }
export function useCartActions(cart: Cart, generation: number) {
  const { api, sessionLifecycle } = useServices()
  const client = useQueryClient()
  const queryKey = cartKeys.current(cart.owner.kind === 'user' ? cart.owner.id : undefined, generation)
  return useMutation({
    mutationKey: cartKeys.mutations,
    scope: { id: cart.id },
    mutationFn: async (action: Action) => {
      sessionLifecycle.assertCurrent(generation)
      await client.cancelQueries({ queryKey })
      const updated = action.kind === 'update'
        ? await updateCartItem(api, action.itemId, action.quantity)
        : await removeCartItem(api, action.itemId)
      sessionLifecycle.assertCurrent(generation)
      return updated
    },
    onSuccess: (updated) => { client.setQueryData(queryKey, updated) },
    onError: (error, action) => {
      if (error instanceof ApiError && ['OUT_OF_STOCK', 'CART_ITEM_NOT_FOUND'].includes(error.code)) {
        void client.invalidateQueries({ queryKey })
        const item = cart.items.find((entry) => entry.id === action.itemId)
        if (item) void client.invalidateQueries({ queryKey: nftKeys.detail(item.nftId) })
      }
    },
  })
}
