import { useServerFieldFocus } from '@/features/account/use-server-field-focus'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isCancel } from 'axios'
import { z } from 'zod'
import { profileInputSchema, type Profile, type ProfileInput } from '@/contracts/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { authFormError } from '@/features/auth/components/form-errors'
import { useUpdateProfile } from '../hooks/use-profile'

export function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const { register, handleSubmit, reset, setError: fieldError, setFocus, formState: { errors, isDirty } } = useForm<z.input<typeof profileInputSchema>, unknown, ProfileInput>({ resolver: zodResolver(profileInputSchema), defaultValues: profile })
  useEffect(() => { if (!isDirty) reset(profile) }, [profile, isDirty, reset])
  useServerFieldFocus(errors, setFocus, update.isPending)
  return <form aria-label="Dados pessoais" noValidate className="space-y-5" onSubmit={handleSubmit(async (values) => {
    setMessage(undefined); setError(undefined)
    try { const saved = await update.submit(values); reset(saved); setMessage('Perfil atualizado.') }
    catch (cause) { if (!isCancel(cause)) setError(authFormError(cause, fieldError, ['name', 'email', 'bio'])) }
  })}>
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label="Nome de exibição" required error={errors.name?.message}>{(props) => <Input {...props} {...register('name')} autoComplete="name" disabled={update.isPending} />}</FormField>
      <FormField label="E-mail" required error={errors.email?.message}>{(props) => <Input {...props} {...register('email')} type="email" autoComplete="email" disabled={update.isPending} />}</FormField>
    </div>
    <FormField label="Sobre você" description="Até 500 caracteres." error={errors.bio?.message}>{(props) => <Textarea {...props} {...register('bio')} disabled={update.isPending} />}</FormField>
    {error && <InlineAlert variant="error">{error}</InlineAlert>}
    {message && <InlineAlert variant="success">{message}</InlineAlert>}
    <Button type="submit" disabled={!isDirty || update.isPending} aria-busy={update.isPending}>{update.isPending ? 'Salvando perfil…' : 'Salvar perfil'}</Button>
  </form>
}
