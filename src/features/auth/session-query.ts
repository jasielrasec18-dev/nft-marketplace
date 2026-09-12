import { queryOptions } from '@tanstack/react-query'
import { sessionKeys } from '@/app/query/keys'
import type { AppServices } from '@/app/services'
import { getSession } from './api/auth'

export function sessionOptions(services: Pick<AppServices, 'api' | 'sessionLifecycle'>) {
  return queryOptions({
    queryKey: sessionKeys.all,
    queryFn: async ({ signal }) => {
      await services.sessionLifecycle.whenSettled()
      const version = services.sessionLifecycle.current()
      const session = await getSession(services.api, signal)
      return services.sessionLifecycle.reconcile(session, version)
    },
  })
}
