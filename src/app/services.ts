import { createApiClient } from '@/api/client'
import { createQueryClient } from './query/client'
import { clearSessionCache } from './query/clear-session'
import { createMarketplaceSocket } from './socket'
import { env } from './env'

export function createAppServices() {
  const queryClient = createQueryClient()
  const socket = createMarketplaceSocket()
  const clearSession = () => clearSessionCache(queryClient, () => {
    socket.removeAllListeners()
    socket.disconnect()
  })
  const api = createApiClient({ baseURL: env.apiBaseUrl, timeoutMs: env.apiTimeoutMs }, () => { void clearSession() })
  return { queryClient, socket, api, clearSession }
}
export type AppServices = ReturnType<typeof createAppServices>
