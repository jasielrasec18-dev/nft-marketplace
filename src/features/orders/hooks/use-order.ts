import { useQuery } from '@tanstack/react-query'
import { CanceledError } from 'axios'
import type { Order } from '@/contracts/order'
import { useServices } from '@/app/providers/services-context'
import { privateKeys } from '@/app/query/keys'
import { useAccountIdentity } from '@/features/account/account-context'
import { getOrder } from '../api/orders'
export function useOrder(id: string) {
  const { api, sessionLifecycle } = useServices()
  const { userId, generation } = useAccountIdentity()
  return useQuery({
    queryKey: privateKeys.order(userId, id),
    queryFn: async ({ signal }) => {
      sessionLifecycle.assertCurrent(generation)
      const order = await getOrder(api, id, signal)
      sessionLifecycle.assertCurrent(generation)
      if (order.userId !== userId) throw new CanceledError('Account changed')
      return order
    },
    structuralSharing: (oldData, newData) => {
      const previous = oldData as Order | undefined
      const next = newData as Order
      return previous && previous.id === next.id && (previous.version > next.version || previous.status !== 'pending' && next.status === 'pending') ? previous : next
    },
    refetchInterval: (query) => query.state.data?.status === 'pending' ? 2000 : false,
  })
}
