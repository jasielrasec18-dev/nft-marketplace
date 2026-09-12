import { CanceledError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'
import type { Session } from '@/contracts/auth'
import { clearPrivateQueries, clearSessionCache } from '@/app/query/clear-session'
import { sessionKeys, cartKeys, privateKeys } from '@/app/query/keys'

export function createSessionLifecycle(client: QueryClient, disconnect: () => void) {
  let version = 0
  let pending: Promise<void> | undefined
  let onExpired: (() => void) | undefined
  const current = () => version
  const assertCurrent = (expected: number) => {
    if (version !== expected) throw new CanceledError('Session changed')
  }
  return {
    current,
    assertCurrent,
    whenSettled: () => pending ?? Promise.resolve(),
    onExpired: (handler: () => void) => { onExpired = handler },
    async begin() {
      if (pending) throw new CanceledError('Authentication already pending')
      let release!: () => void
      pending = new Promise<void>((resolve) => { release = resolve })
      const expected = ++version
      await Promise.all([
        client.cancelQueries({ queryKey: sessionKeys.all }),
        client.cancelQueries({ queryKey: privateKeys.all }),
      ])
      return { version: expected, finish: () => { pending = undefined; release() } }
    },
    async commit(session: Session, expected: number) {
      assertCurrent(expected)
      await clearPrivateQueries(client, disconnect)
      assertCurrent(expected)
      client.setQueryData(sessionKeys.all, session)
      // Login/register merge the guest cart on the server; invalidate its cached representation only.
      void client.invalidateQueries({ queryKey: cartKeys.guests })
    },
    async reconcile(session: Session, expected: number) {
      assertCurrent(expected)
      const previous = client.getQueryData<Session>(sessionKeys.all)
      if (previous !== undefined && previous?.user.id !== session?.user.id) {
        const accepted = ++version
        await clearPrivateQueries(client, disconnect)
        assertCurrent(accepted)
      }
      return session
    },
    expire(expected: number) {
      if (version !== expected) return
      version++
      void clearSessionCache(client, disconnect)
      onExpired?.()
    },
    clear: async () => { version++; await clearSessionCache(client, disconnect) },
  }
}
