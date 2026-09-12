import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/api/errors'

export function authFormError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: FieldPath<T>[], codeFields: Record<string, FieldPath<T>> = {}): string | undefined {
  if (!(error instanceof ApiError)) return 'Não foi possível concluir. Tente novamente.'
  const target = codeFields[error.code]
  if (target) { setError(target, { type: 'server', message: error.message }, { shouldFocus: true }); return }
  if (error.code === 'EMAIL_ALREADY_EXISTS') {
    const email = fields.find((field) => field === 'email')
    if (email) { setError(email, { type: 'server', message: error.message }, { shouldFocus: true }); return }
  }
  const entries = fields.filter((field) => error.fieldErrors?.[field]?.length)
  if (entries.length) {
    entries.forEach((field, index) => setError(field, { type: 'server', message: error.fieldErrors?.[field]?.[0] }, { shouldFocus: index === 0 }))
    return
  }
  return error.code === 'INVALID_CREDENTIALS' ? 'E-mail ou senha inválidos. Confira seus dados e tente novamente.' : error.message
}
