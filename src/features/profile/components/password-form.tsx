import { useServerFieldFocus } from '@/features/account/use-server-field-focus'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isCancel } from 'axios'
import { passwordChangeSchema, type PasswordChangeInput } from '@/contracts/profile'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/shared/password-input'
import { FormField } from '@/components/ui/form-field'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { authFormError } from '@/features/auth/components/form-errors'
import { useUpdatePassword } from '../hooks/use-profile'
const empty = { currentPassword: '', newPassword: '', confirmPassword: '' }
export function PasswordForm() {
  const update = useUpdatePassword()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>()
  const { register, handleSubmit, reset, setError: fieldError, setFocus, formState: { errors } } = useForm<PasswordChangeInput>({ resolver: zodResolver(passwordChangeSchema), defaultValues: empty })
  useServerFieldFocus(errors, setFocus, update.isPending)
  return <section aria-labelledby="password-title" className="space-y-5 border-t border-border pt-6"><h2 id="password-title" className="type-section">Alterar senha</h2>
    <form aria-label="Alterar senha" noValidate className="max-w-md space-y-5" onSubmit={handleSubmit(async (values) => {
      setSuccess(false); setError(undefined)
      try { await update.submit(values); reset(empty); setSuccess(true) }
      catch (cause) { reset(empty); if (!isCancel(cause)) setError(authFormError(cause, fieldError, ['currentPassword', 'newPassword', 'confirmPassword'], { INVALID_CREDENTIALS: 'currentPassword' })) }
    })}>
      <FormField label="Senha atual" required error={errors.currentPassword?.message}>{(props) => <PasswordInput {...props} {...register('currentPassword')} toggleName="senha atual" autoComplete="current-password" disabled={update.isPending} />}</FormField>
      <FormField label="Nova senha" required description="Use pelo menos 8 caracteres." error={errors.newPassword?.message}>{(props) => <PasswordInput {...props} {...register('newPassword')} toggleName="nova senha" autoComplete="new-password" disabled={update.isPending} />}</FormField>
      <FormField label="Confirmar nova senha" required error={errors.confirmPassword?.message}>{(props) => <PasswordInput {...props} {...register('confirmPassword')} toggleName="confirmação da nova senha" autoComplete="new-password" disabled={update.isPending} />}</FormField>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      {success && <InlineAlert variant="success">Senha alterada. Use a nova senha no próximo acesso.</InlineAlert>}
      <Button type="submit" disabled={update.isPending} aria-busy={update.isPending}>{update.isPending ? 'Alterando senha…' : 'Alterar senha'}</Button>
    </form>
  </section>
}
