import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { registerSchema } from '@/contracts/auth'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/shared/password-input'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { useRegister } from '../hooks/use-authenticate'
import { authFormError } from './form-errors'

const formSchema = registerSchema.extend({ confirmPassword: z.string().min(1, 'Confirme sua senha.') })
  .refine((input) => input.password === input.confirmPassword, { path: ['confirmPassword'], message: 'As senhas devem ser iguais.' })
type FormInput = z.infer<typeof formSchema>

export function RegisterForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const mutation = useRegister()
  const [error, setError] = useState<string>()
  const form = useForm<FormInput>({ resolver: zodResolver(formSchema), defaultValues: { name: '', email: '', password: '', confirmPassword: '' } })
  useEffect(() => { form.setFocus('name') }, [form])
  const pending = form.formState.isSubmitting
  useEffect(() => {
    if (pending) return
    const field = (['name', 'email', 'password', 'confirmPassword'] as const).find((name) => form.formState.errors[name]?.type === 'server')
    if (field) form.setFocus(field)
  }, [form, pending])
  return <form aria-label="Criar conta" noValidate className="space-y-4" onSubmit={form.handleSubmit(async (input) => {
    setError(undefined)
    try {
      await mutation.submit({ name: input.name, email: input.email, password: input.password })
      form.resetField('password', { keepError: true }); form.resetField('confirmPassword', { keepError: true })
      await onSuccess()
    } catch (failure) { setError(authFormError(failure, form.setError, ['name', 'email', 'password'])) }
    finally { form.resetField('password', { keepError: true }); form.resetField('confirmPassword', { keepError: true }) }
  })}>
    <FormField label="Nome" required error={form.formState.errors.name?.message}>{(props) => <Input required {...props} {...form.register('name')} autoComplete="name" placeholder="Nome do colecionador" disabled={pending} />}</FormField>
    <FormField label="E-mail" required error={form.formState.errors.email?.message}>{(props) => <Input required {...props} {...form.register('email')} type="email" autoComplete="email" placeholder="Digite seu e-mail" disabled={pending} />}</FormField>
    <FormField label="Senha" required description="Use pelo menos 8 caracteres." error={form.formState.errors.password?.message}>{(props) => <PasswordInput required {...props} {...form.register('password')} autoComplete="new-password" disabled={pending} />}</FormField>
    <FormField label="Confirmar senha" required error={form.formState.errors.confirmPassword?.message}>{(props) => <PasswordInput required {...props} {...form.register('confirmPassword')} toggleName="confirmação de senha" autoComplete="new-password" disabled={pending} />}</FormField>
    {error && <InlineAlert variant="error">{error}</InlineAlert>}
    <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>{pending ? 'Criando conta…' : 'Criar conta'}</Button>
  </form>
}
