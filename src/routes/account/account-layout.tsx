import { Link, Outlet } from '@tanstack/react-router'
import { useIsMutating } from '@tanstack/react-query'
import { UserRound, Wallet } from 'lucide-react'
import { useSession } from '@/features/auth/hooks/use-session'
import { AccountContext } from '@/features/account/account-context'
import { AccountSkeleton } from '@/features/account/account-skeleton'
import { useServices } from '@/app/providers/services-context'
import { sessionKeys } from '@/app/query/keys'
import { ErrorState } from '@/components/feedback/error-state'
export function AccountLayout() {
  const session = useSession()
  const changing = useIsMutating({ mutationKey: sessionKeys.mutations }) > 0
  const { sessionLifecycle } = useServices()
  const generation = sessionLifecycle.current()
  return <div className="grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
    <aside className="rounded-md bg-card p-4 lg:sticky lg:top-5">
      <h2 className="type-card mb-3">Meu perfil</h2>
      <nav aria-label="Navegação da conta" className="flex flex-wrap gap-2 lg:flex-col">
        <Link to="/account/profile" className="flex min-h-11 items-center gap-3 border-l-2 border-transparent px-3 text-sm text-muted-foreground" activeProps={{ className: 'border-primary bg-background text-primary', 'aria-current': 'page' }}><UserRound className="size-4" />Dados do perfil</Link>
        <Link to="/account/wallets" className="flex min-h-11 items-center gap-3 border-l-2 border-transparent px-3 text-sm text-muted-foreground" activeProps={{ className: 'border-primary bg-background text-primary', 'aria-current': 'page' }}><Wallet className="size-4" />Carteiras</Link>
      </nav>
    </aside>
    <div className="min-w-0">
      {session.isError ? <ErrorState title="Sessão não verificada" onRetry={() => void session.refetch()} /> : changing || !session.data
        ? <AccountSkeleton label="Verificando conta" />
        : <AccountContext.Provider key={session.data.user.id + ':' + generation} value={{ userId: session.data.user.id, generation }}><Outlet /></AccountContext.Provider>}
    </div>
  </div>
}
