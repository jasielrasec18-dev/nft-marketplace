import { createApiClient } from '@/api/client'
import { createQueryClient } from './query/client'
import type { MarketplaceSocket } from './socket'
import { createSessionLifecycle } from '@/features/auth/session-lifecycle'
import { env } from './env'
import { createRealtimeState } from './realtime-state'

export function createAppServices() {
  const queryClient = createQueryClient()
  let socket: MarketplaceSocket | undefined
  let socketPromise: Promise<MarketplaceSocket> | undefined
  const getSocket = () => socketPromise ??= import('./socket').then(({ createMarketplaceSocket }) => {
    socket = createMarketplaceSocket()
    return socket
  })
  const disconnectSocket = () => { socket?.removeAllListeners(); socket?.disconnect() }
  const sessionLifecycle = createSessionLifecycle(queryClient, disconnectSocket)
  const api = createApiClient({
    baseURL: env.apiBaseUrl, timeoutMs: env.apiTimeoutMs, sessionVersion: sessionLifecycle.current,
  }, (_error, version) => sessionLifecycle.expire(version))
  return { queryClient, getSocket, disconnectSocket, api, sessionLifecycle, realtime: createRealtimeState(), clearSession: sessionLifecycle.clear }
}
export type AppServices = ReturnType<typeof createAppServices>
