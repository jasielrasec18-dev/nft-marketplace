import { useMutation } from '@tanstack/react-query'
import { useServices } from '@/app/providers/services-context'
import { sessionKeys } from '@/app/query/keys'
import { logout } from '../api/auth'

export function useLogout() {
  const { api, sessionLifecycle } = useServices()
  return useMutation({
    mutationKey: sessionKeys.mutations,
    gcTime: 0,
    mutationFn: async () => {
      const transition = await sessionLifecycle.begin()
      try {
        await logout(api)
        await sessionLifecycle.commit(null, transition.version)
      } finally { transition.finish() }
    },
  })
}
