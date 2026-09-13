import { useEffect } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { z } from 'zod'
import { ethAmountSchema } from '@/contracts/common'
import type { NFT } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import { useSession } from '@/features/auth/hooks/use-session'
import { cartKeys, nftKeys, privateKeys, sessionKeys } from '@/app/query/keys'
import { useServices } from './services-context'

const resource = z.object({ eventId: z.string().min(1).max(200), version: z.number().int().positive(), occurredAt: z.iso.datetime() })
const nftEvent = resource.extend({ nftId: z.string(), priceEth: ethAmountSchema, availableQuantity: z.number().int().nonnegative(), editions: z.array(z.object({ id: z.string(), name: z.string(), availableQuantity: z.number().int().nonnegative() })) })
const orderEvent = resource.extend({ orderId: z.string(), userId: z.string(), status: z.enum(['pending', 'confirmed', 'declined']) })

export function RealtimeBridge() {
  const { socket, queryClient: client, sessionLifecycle, realtime } = useServices()
  const session = useSession()
  const changing = useIsMutating({ mutationKey: sessionKeys.mutations }) > 0
  const userId = session.data?.user.id
  const ready = session.isSuccess && !changing
  const generation = sessionLifecycle.current()
  useEffect(() => {
    if (!ready) return
    let connectedOnce = false
    const privateVersions = new Map<string, number>()
    const privateEventIds = new Set<string>()
    const current = () => sessionLifecycle.current() === generation
    const refreshCart = () => { void client.invalidateQueries({ queryKey: cartKeys.current(userId, generation) }) }
    const onNFT = (payload: unknown) => {
      if (!current()) return
      const parsed = nftEvent.safeParse(payload)
      if (!parsed.success) return
      const event = parsed.data
      const key = nftKeys.detail(event.nftId)
      if (event.version < (client.getQueryData<NFT>(key)?.version ?? 0) || !realtime.accept(event.nftId, event.version, event.eventId)) return
      void client.cancelQueries({ queryKey: key }).then(() => {
        if (!current()) return
        client.setQueryData<NFT>(key, (previous) => previous && previous.version < event.version ? { ...previous, priceEth: event.priceEth, availableQuantity: event.availableQuantity, editions: event.editions, version: event.version } : previous)
        void client.invalidateQueries({ queryKey: nftKeys.lists() })
        refreshCart()
      })
    }
    const onOrder = (payload: unknown) => {
      if (!current()) return
      const parsed = orderEvent.safeParse(payload)
      if (!parsed.success || parsed.data.userId !== userId) return
      const event = parsed.data
      const key = privateKeys.order(userId, event.orderId)
      const previous = client.getQueryData<Order>(key)
      if (privateEventIds.has(event.eventId) || event.version <= Math.max(previous?.version ?? 0, privateVersions.get(event.orderId) ?? 0) || previous && previous.status !== 'pending') return
      privateEventIds.add(event.eventId)
      if (privateEventIds.size > 256) privateEventIds.delete(privateEventIds.values().next().value!)
      privateVersions.set(event.orderId, event.version)
      if (privateVersions.size > 128) privateVersions.delete(privateVersions.keys().next().value!)
      void client.invalidateQueries({ queryKey: key })
    }
    const onConnect = () => {
      if (!current()) return
      if (connectedOnce) {
        realtime.reconnected()
        void client.invalidateQueries({ queryKey: nftKeys.all })
        refreshCart()
        if (userId) void client.invalidateQueries({ queryKey: privateKeys.orders(userId) })
      }
      connectedOnce = true
    }
    socket.on('nft.updated', onNFT)
    socket.on('order.updated', onOrder)
    socket.on('connect', onConnect)
    socket.connect()
    return () => {
      socket.off('nft.updated', onNFT); socket.off('order.updated', onOrder); socket.off('connect', onConnect)
      socket.disconnect(); privateVersions.clear()
    }
  }, [client, generation, ready, realtime, sessionLifecycle, socket, userId])
  return null
}
