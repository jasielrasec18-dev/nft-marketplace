import { redirect } from '@tanstack/react-router'
import type { AppServices } from '@/app/services'
import { sessionOptions } from './session-query'
import { safeReturnTo } from './redirect'

export async function requireSession(services: Pick<AppServices, 'api' | 'queryClient' | 'sessionLifecycle'>, href: string) {
  await services.sessionLifecycle.whenSettled()
  const session = await services.queryClient.fetchQuery(sessionOptions(services))
  if (!session) throw redirect({ to: '/login', search: { redirect: safeReturnTo(href) }, replace: true })
  return session
}
