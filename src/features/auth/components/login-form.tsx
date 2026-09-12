import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/contracts/auth'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/shared/password-input'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { useLogin } from '../hooks/use-authenticate'
import { authFormError } from './form-errors'

export function LoginForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const mutation = useLogin()
  const [error, setError] = useState<string>()
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  useEffect(() => { form.setFocus('email') }, [form])
  const pending = form.formState.isSubmitting
  useEffect(() => {
    if (pending) return
    const field = (['email', 'password'] as const).find((name) => form.formState.errors[name]?.type === 'server')
    if (field) form.setFocus(field)
  }, [form, pending])
  return <form aria-label="Entrar na conta" noValidate className="space-y-4" onSubmit={form.handleSubmit(async (input) => {
    setError(undefined)
    try { await mutation.submit(input); form.resetField('password', { keepError: true }); await onSuccess() }
    catch (failure) { setError(authFormError(failure, form.setError, ['email', 'password'])) }
    finally { form.resetField('password', { keepError: true }) }
  })}>
    <FormField label="E-mail" required error={form.formState.errors.email?.message}>{(props) => <Input required {...props} {...form.register('email')} type="email" autoComplete="email" placeholder="Digite seu e-mail" disabled={pending} />}</FormField>
    <FormField label="Senha" required error={form.formState.errors.password?.message}>{(props) => <PasswordInput required {...props} {...form.register('password')} autoComplete="current-password" placeholder="Sua senha" disabled={pending} />}</FormField>
    <p className="type-caption text-right text-muted-foreground">Recuperação de senha · em breve</p>
    {error && <InlineAlert variant="error">{error}</InlineAlert>}
    <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>{pending ? 'Entrando…' : 'Entrar'}</Button>
  </form>
}
