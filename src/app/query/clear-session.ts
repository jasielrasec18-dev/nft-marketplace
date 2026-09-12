import type { QueryClient } from '@tanstack/react-query'
import { privateKeys, sessionKeys } from './keys'

export async function clearPrivateQueries(client: QueryClient, disconnect: () => void) {
  disconnect()
  const cancellation = client.cancelQueries({ queryKey: privateKeys.all })
  client.removeQueries({ queryKey: privateKeys.all })
  for (const mutation of client.getMutationCache().getAll()) {
    if (mutation.options.mutationKey !== sessionKeys.mutations) client.getMutationCache().remove(mutation)
  }
  await cancellation
}
export async function clearSessionCache(client: QueryClient, disconnect: () => void) {
  const privateCancellation = clearPrivateQueries(client, disconnect)
  const sessionCancellation = client.cancelQueries({ queryKey: sessionKeys.all })
  client.setQueryData(sessionKeys.all, null)
  client.getMutationCache().clear()
  await Promise.all([privateCancellation, sessionCancellation])
}
