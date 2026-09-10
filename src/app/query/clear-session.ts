import type { QueryClient } from '@tanstack/react-query'
import { privateKeys, sessionKeys } from './keys'

export async function clearSessionCache(client: QueryClient, disconnect: () => void) {
  
  disconnect()
  const privateCancellation = client.cancelQueries({ queryKey: privateKeys.all })
  const sessionCancellation = client.cancelQueries({ queryKey: sessionKeys.all })
  client.removeQueries({ queryKey: privateKeys.all })
  client.setQueryData(sessionKeys.all, null)
  client.getMutationCache().clear()
  await Promise.all([privateCancellation, sessionCancellation])
}
