import { CanceledError } from 'axios'
import { useIsMutating, useQuery } from '@tanstack/react-query'
import { cartKeys, sessionKeys } from '@/app/query/keys'
import { useServices } from '@/app/providers/services-context'
import { useSession } from '@/features/auth/hooks/use-session'
import { getCart } from '../api/cart'

export function useCart() {
  const session = useSession()
  const { api, sessionLifecycle } = useServices()
  const changing = useIsMutating({ mutationKey: sessionKeys.mutations }) > 0
  const writing = useIsMutating({ mutationKey: cartKeys.mutations }) > 0
  const userId = session.data?.user.id
  const generation = sessionLifecycle.current()
  const queryKey = cartKeys.current(userId, generation)
  const ready = session.isSuccess && !changing
  const query = useQuery({
    queryKey,
    enabled: ready && !writing,
    queryFn: async ({ signal }) => {
      await sessionLifecycle.whenSettled()
      sessionLifecycle.assertCurrent(generation)
      const cart = await getCart(api, signal)
      sessionLifecycle.assertCurrent(generation)
      if (userId ? cart.owner.kind !== 'user' || cart.owner.id !== userId : cart.owner.kind !== 'guest') throw new CanceledError('Cart owner changed')
      return cart
    },
  })
  return { ...query, queryKey, session, ready, writing, generation }
}
