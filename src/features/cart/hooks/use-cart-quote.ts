import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '@/contracts/cart'
import type { QuoteInput } from '@/contracts/quote'
import type { Network } from '@/contracts/wallet'
import { useServices } from '@/app/providers/services-context'
import { cartKeys, quoteKeys } from '@/app/query/keys'
import { ApiError } from '@/api/errors'
import { getQuote } from '../api/cart'

export function useCartQuote(cart: Cart, couponCode: string | null, generation: number, blocked: boolean, network: Network = 'ethereum') {
  const { api, sessionLifecycle, realtime } = useServices()
  useSyncExternalStore(realtime.subscribe, realtime.snapshot)
  const liveFingerprint = realtime.fingerprint(cart.items.map((item) => item.nft.id))
  const client = useQueryClient()
  const [revision, setRevision] = useState(0)
  const last = useRef('')
  const input = useMemo<QuoteInput>(() => ({ cartId: cart.id, cartVersion: cart.version, couponCode, network }), [cart.id, cart.version, couponCode, network])
  const fingerprint = JSON.stringify([generation, cart.owner, input, cart.items.map((item) => [item.id, item.quantity, item.nft.version]), revision, liveFingerprint])
  const queryKey = cartKeys.current(cart.owner.kind === 'user' ? cart.owner.id : undefined, generation)
  const mutation = useMutation({
    mutationKey: cart.owner.kind === 'user' ? quoteKeys.all(cart.owner.id) : [...queryKey, 'quotes'],
    gcTime: 0,
    mutationFn: async (request: { input: QuoteInput; fingerprint: string }) => {
      sessionLifecycle.assertCurrent(generation)
      const result = await getQuote(api, request.input)
      sessionLifecycle.assertCurrent(generation)
      return { ...result, fingerprint: request.fingerprint }
    },
    onSuccess: ({ quote }) => {
      client.setQueryData<Cart>(queryKey, (previous) => previous?.id === quote.cartId && previous.version === quote.cartVersion
        ? { ...previous, couponCode: quote.couponCode } : previous)
    },
    onError: (error) => {
      if (error instanceof ApiError && ['OUT_OF_STOCK', 'CART_CHANGED'].includes(error.code)) void client.invalidateQueries({ queryKey })
    },
  })
  const { mutate, isPending } = mutation
  useEffect(() => {
    if (blocked || !cart.items.length || isPending || last.current === fingerprint) return
    last.current = fingerprint
    mutate({ input, fingerprint })
  }, [blocked, cart.items.length, fingerprint, input, isPending, mutate])
  const data = !blocked && mutation.data?.fingerprint === fingerprint ? mutation.data : undefined
  useEffect(() => {
    if (!data) return
    const timer = setTimeout(() => setRevision((value) => value + 1), Math.max(0, data.validUntil - Date.now()))
    return () => clearTimeout(timer)
  }, [data])
  const error = mutation.variables?.fingerprint === fingerprint ? mutation.error : null
  return {
    quote: data?.quote,
    error,
    isPending: !error && !data || isPending,
    refresh: () => setRevision((value) => value + 1),
    revalidate: () => mutation.mutateAsync({ input, fingerprint }),
  }
}
