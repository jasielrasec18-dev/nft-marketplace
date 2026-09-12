import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosInstance } from 'axios'
import type { Session, LoginInput, RegisterInput } from '@/contracts/auth'
import { useServices } from '@/app/providers/services-context'
import { sessionKeys } from '@/app/query/keys'
import { login, register } from '../api/auth'

function useAuthenticate<T>(request: (api: AxiosInstance, input: T) => Promise<Session>) {
  const { api, sessionLifecycle } = useServices()
  const credentials = useRef<T | undefined>(undefined)
  const locked = useRef(false)
  const mutation = useMutation({
    mutationKey: sessionKeys.mutations,
    gcTime: 0,
    mutationFn: async () => {
      const input = credentials.current
      credentials.current = undefined
      if (!input) throw new Error('Form submission required')
      const transition = await sessionLifecycle.begin()
      try {
        const session = await request(api, input)
        await sessionLifecycle.commit(session, transition.version)
        return session
      } finally { transition.finish() }
    },
  })
  return {
    ...mutation,
    async submit(input: T) {
      if (locked.current) return
      locked.current = true
      credentials.current = input
      try { return await mutation.mutateAsync() }
      finally { credentials.current = undefined; locked.current = false; mutation.reset() }
    },
  }
}
export function useLogin() { return useAuthenticate<LoginInput>(login) }
export function useRegister() { return useAuthenticate<RegisterInput>(register) }
