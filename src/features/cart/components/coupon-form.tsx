import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError } from '@/api/errors'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({ code: z.string().trim().min(1, 'Digite um código promocional.').max(40, 'Use até 40 caracteres.') })
export function CouponForm({ coupon, error, pending, onApply, onRemove }: {
  coupon: string | null; error: Error | null; pending: boolean; onApply: (code: string) => void; onRemove: () => void
}) {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { code: coupon ?? '' } })
  const couponError = error instanceof ApiError && ['INVALID_COUPON', 'EXPIRED_COUPON'].includes(error.code) ? error.message : undefined
  useEffect(() => { if (couponError && !pending) form.setFocus('code') }, [couponError, pending, form])
  return <form aria-label="Aplicar cupom" noValidate onSubmit={form.handleSubmit(({ code }) => onApply(code.toUpperCase()))} className="space-y-2">
    <FormField label="Código promocional" error={form.formState.errors.code?.message ?? couponError}>{(props) => <div className="flex gap-2"><Input {...props} {...form.register('code')} autoComplete="off" placeholder="Digite o código" disabled={pending} className="min-w-0 flex-1" /><Button type="submit" disabled={pending}>Aplicar</Button></div>}</FormField>
    {coupon && <div className="flex flex-wrap items-center justify-between gap-2"><span className="type-caption break-all text-muted-foreground">{coupon}</span><Button variant="link" disabled={pending} onClick={() => { form.reset({ code: '' }); onRemove() }}>Remover cupom</Button></div>}
  </form>
}
