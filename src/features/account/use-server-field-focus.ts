import { useEffect } from 'react'
import type { FieldErrors, FieldPath, FieldValues, UseFormSetFocus } from 'react-hook-form'
export function useServerFieldFocus<T extends FieldValues>(errors: FieldErrors<T>, focus: UseFormSetFocus<T>, pending: boolean) {
  useEffect(() => {
    if (pending) return
    const field = Object.keys(errors).find((key) => errors[key]?.type === 'server')
    if (field) focus(field as FieldPath<T>)
  }, [errors, focus, pending])
}
