import { useRouter, Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { useSession } from '../hooks/use-session'
import { useLogout } from '../hooks/use-logout'
import { safeReturnTo } from '../redirect'

export function SessionActions({ onNavigate }: { onNavigate?: () => void }) {
  const session = useSession()
  const logout = useLogout()
  const router = useRouter()
  const href = useLocation({ select: (location) => location.href })
  if (session.isPending) return <p role="status" className="type-caption min-h-11 content-center text-muted-foreground">Verificando sessão…</p>
  if (session.isError) return <div className="space-y-2"><p className="type-caption text-muted-foreground">Sessão não verificada.</p><Button variant="outline" size="sm" disabled={session.isFetching} onClick={() => void session.refetch()}>Verificar sessão</Button></div>
  if (!session.data) return <Button asChild size="sm"><Link to="/login" search={{ redirect: safeReturnTo(href) }} onClick={onNavigate}>Entrar</Link></Button>
  return <div className="max-w-xs space-y-2">
    <div className="flex flex-wrap items-center gap-3"><span className="type-caption max-w-36 truncate" title={session.data.user.name}>{session.data.user.name}</span>
      <Button variant="outline" size="sm" disabled={logout.isPending} aria-busy={logout.isPending} onClick={() => logout.mutate(undefined, { onSuccess: () => { onNavigate?.(); void router.invalidate() } })}>{logout.isPending ? 'Saindo…' : 'Sair'}</Button>
    </div>
    {logout.isError && <InlineAlert variant="error">Não foi possível sair. Sua sessão foi mantida. Tente novamente.</InlineAlert>}
  </div>
}
