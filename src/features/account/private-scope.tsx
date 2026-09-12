import type { ReactNode } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { sessionKeys } from '@/app/query/keys'
import { useServices } from '@/app/providers/services-context'
import { AccountContext } from './account-context'
import { AccountSkeleton } from './account-skeleton'
import { ErrorState } from '@/components/feedback/error-state'
export function PrivateScope({ children }: { children: ReactNode }) {
  const session = useSession()
  const changing = useIsMutating({ mutationKey: sessionKeys.mutations }) > 0
  const { sessionLifecycle } = useServices()
  const generation = sessionLifecycle.current()
  if (session.isError) return <ErrorState title="Sessão não verificada" onRetry={() => void session.refetch()} />
  if (!session.data || changing) return <AccountSkeleton label="Verificando conta" />
  return <AccountContext.Provider key={session.data.user.id + ':' + generation} value={{ userId: session.data.user.id, generation }}>{children}</AccountContext.Provider>
}
