import { useEffect } from 'react'
import { Link, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useIsMutating } from '@tanstack/react-query'
import { sessionKeys } from '@/app/query/keys'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { useSession } from '@/features/auth/hooks/use-session'
import { LoginForm } from '@/features/auth/components/login-form'
import { RegisterForm } from '@/features/auth/components/register-form'
import { AuthBackdrop } from '@/features/auth/components/auth-backdrop'
import { authSearchSchema } from '@/features/auth/redirect'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const search = authSearchSchema.parse(useSearch({ strict: false }))
  const navigate = useNavigate()
  const router = useRouter()
  const session = useSession()
  const pending = useIsMutating({ mutationKey: sessionKeys.mutations }) > 0
  const registered = mode === 'register'
  const destination = search.redirect
  useEffect(() => {
    if (session.data && !session.isError && !pending) void navigate({ href: destination, replace: true })
  }, [session.data, session.isError, pending, destination, navigate])
  const finish = async () => { await navigate({ href: destination, replace: true }); await router.invalidate() }
  return <>
    <AuthBackdrop />
    <Dialog open onOpenChange={(open) => { if (!open && !pending) void navigate({ href: destination, replace: true }) }}>
      <DialogContent closeDisabled={pending} className="max-w-md rounded-2xl bg-background px-5 md:rounded-none md:bg-card" onEscapeKeyDown={(event) => { if (pending) event.preventDefault() }} onPointerDownOutside={(event) => event.preventDefault()} onCloseAutoFocus={(event) => {
        event.preventDefault()
        requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }))
      }}>
        <p className="type-section mb-5 text-center tracking-widest md:hidden">KURIO</p>
        <DialogTitle asChild><h1 className="text-center">{registered ? 'Criar conta' : 'Entrar'}</h1></DialogTitle>
        <DialogDescription className="mb-6 text-center">{registered ? 'Crie seu perfil de colecionador.' : 'Entre para continuar sua coleção.'}</DialogDescription>
        {session.isPending ? <p role="status" className="py-8 text-center text-muted-foreground">Verificando sessão…</p> :
          session.isError ? <ErrorState title="Não foi possível verificar sua sessão" description="Confira sua conexão e tente novamente." onRetry={() => void session.refetch()} /> :
          session.data ? <p role="status">Redirecionando…</p> : <>
            {search.reason === 'expired' && <InlineAlert className="mb-5" variant="warning">Sua sessão expirou. Entre novamente para continuar.</InlineAlert>}
            {registered ? <RegisterForm onSuccess={finish} /> : <LoginForm onSuccess={finish} />}
            <div className="my-5 space-y-3"><p className="type-caption text-center text-muted-foreground">Outras formas de acesso · em breve</p><Button variant="outline" disabled className="w-full">Continuar com Google</Button><Button variant="outline" disabled className="w-full">Continuar com Facebook</Button></div>
            <p className="type-small text-center text-muted-foreground">{registered ? 'Já tem uma conta? ' : 'Novo na Kurio? '}
              <Link to={registered ? '/login' : '/register'} search={search} className="inline-flex min-h-11 items-center text-primary underline underline-offset-4" aria-disabled={pending} onClick={(event) => { if (pending) event.preventDefault() }}>{registered ? 'Entrar' : 'Criar conta'}</Link>
            </p>
          </>}
      </DialogContent>
    </Dialog>
  </>
}
export function LoginPage() { return <AuthPage mode="login" /> }
export function RegisterPage() { return <AuthPage mode="register" /> }
