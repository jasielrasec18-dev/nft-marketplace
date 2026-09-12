import { createApiClient } from '@/api/client'
import { createQueryClient } from './query/client'
import { createMarketplaceSocket } from './socket'
import { createSessionLifecycle } from '@/features/auth/session-lifecycle'
import { env } from './env'
import { createRealtimeState } from './realtime-state'

export function createAppServices() {
  const queryClient = createQueryClient()
  const socket = createMarketplaceSocket()
  const sessionLifecycle = createSessionLifecycle(queryClient, () => {
    socket.removeAllListeners()
    socket.disconnect()
  })
  const api = createApiClient({
    baseURL: env.apiBaseUrl, timeoutMs: env.apiTimeoutMs, sessionVersion: sessionLifecycle.current,
  }, (_error, version) => sessionLifecycle.expire(version))
  return { queryClient, socket, api, sessionLifecycle, realtime: createRealtimeState(), clearSession: sessionLifecycle.clear }
}
export type AppServices = ReturnType<typeof createAppServices>
