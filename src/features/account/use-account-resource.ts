import { useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AxiosInstance } from 'axios'
import { CanceledError } from 'axios'
import { useServices } from '@/app/providers/services-context'
import { privateKeys, sessionKeys } from '@/app/query/keys'
import { useAccountIdentity } from './account-context'

export function useAccountResource<T>(resource: 'profile' | 'wallets', request: (api: AxiosInstance, signal: AbortSignal) => Promise<T>, owns: (data: T, userId: string) => boolean) {
  const { api, sessionLifecycle } = useServices()
  const { userId, generation } = useAccountIdentity()
  return useQuery({
    queryKey: privateKeys[resource](userId),
    queryFn: async ({ signal }) => {
      await sessionLifecycle.whenSettled()
      sessionLifecycle.assertCurrent(generation)
      const data = await request(api, signal)
      sessionLifecycle.assertCurrent(generation)
      if (!owns(data, userId)) throw new CanceledError('Account changed')
      return data
    },
  })
}

export function useAccountMutation<T, R>(resource: 'profile' | 'wallets', request: (api: AxiosInstance, input: T) => Promise<R>, accept: (result: R) => void) {
  const { api, queryClient, sessionLifecycle } = useServices()
  const { userId, generation } = useAccountIdentity()
  const inputRef = useRef<T | undefined>(undefined)
  const locked = useRef(false)
  const mutation = useMutation({
    mutationKey: [...privateKeys[resource](userId), 'mutation'],
    scope: { id: userId + ':' + resource },
    gcTime: 0,
    mutationFn: async () => {
      const input = inputRef.current
      inputRef.current = undefined
      if (input === undefined) throw new CanceledError('Submission required')
      sessionLifecycle.assertCurrent(generation)
      await queryClient.cancelQueries({ queryKey: privateKeys[resource](userId) })
      if (resource === 'profile') await queryClient.cancelQueries({ queryKey: sessionKeys.all })
      sessionLifecycle.assertCurrent(generation)
      const result = await request(api, input)
      sessionLifecycle.assertCurrent(generation)
      accept(result)
      return result
    },
  })
  return {
    isPending: mutation.isPending,
    async submit(input: T) {
      if (locked.current) throw new CanceledError('Submission pending')
      locked.current = true
      inputRef.current = input
      try { return await mutation.mutateAsync() }
      finally { inputRef.current = undefined; locked.current = false; mutation.reset() }
    },
  }
}
