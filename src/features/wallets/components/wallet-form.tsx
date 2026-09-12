import { useServerFieldFocus } from '@/features/account/use-server-field-focus'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isCancel } from 'axios'
import { networkSchema, walletInputSchema, type Wallet, type WalletInput } from '@/contracts/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { authFormError } from '@/features/auth/components/form-errors'
import { useSaveWallet } from '../hooks/use-wallets'
import { networkNames } from '../labels'
export function WalletForm({ wallet, role, onClose, onSaved }: { wallet?: Wallet; role: WalletInput['role']; onClose: () => void; onSaved: () => void }) {
  const save = useSaveWallet()
  const [error, setError] = useState<string>()
  const { register, control, handleSubmit, setError: fieldError, setFocus, formState: { errors, isDirty } } = useForm<WalletInput>({ resolver: zodResolver(walletInputSchema), defaultValues: wallet ?? { label: '', address: '', network: 'ethereum', role } })
  useServerFieldFocus(errors, setFocus, save.isPending)
  return <section aria-labelledby="wallet-form-title" className="space-y-5 rounded-md border border-border p-4 sm:p-6">
    <h2 id="wallet-form-title" className="type-section">{wallet ? 'Editar carteira' : 'Adicionar carteira'}</h2>
    <form aria-label={wallet ? 'Editar carteira' : 'Adicionar carteira'} noValidate className="space-y-5" onKeyDown={(event) => { if (event.key === 'Escape' && !save.isPending) { event.preventDefault(); onClose() } }} onSubmit={handleSubmit(async (values) => {
      setError(undefined)
      try { await save.submit({ id: wallet?.id, values }); onSaved() }
      catch (cause) { if (!isCancel(cause)) setError(authFormError(cause, fieldError, ['label', 'address', 'network', 'role'], { WALLET_ROLE_CONFLICT: 'role', WALLET_ALREADY_EXISTS: 'address' })) }
    })}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Nome da carteira" required error={errors.label?.message}>{(props) => <Input {...props} {...register('label')} autoFocus autoComplete="off" disabled={save.isPending} />}</FormField>
        <FormField label="Rede" required error={errors.network?.message}>{(props) => <Controller name="network" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange} disabled={save.isPending}><SelectTrigger {...props} ref={field.ref} onBlur={field.onBlur}><SelectValue /></SelectTrigger><SelectContent>{networkSchema.options.map((network) => <SelectItem key={network} value={network}>{networkNames[network]}</SelectItem>)}</SelectContent></Select>} />}</FormField>
      </div>
      <FormField label="Endereço da carteira" required description="0x seguido de 40 caracteres hexadecimais." error={errors.address?.message}>{(props) => <Input {...props} {...register('address')} spellCheck={false} autoCapitalize="none" autoComplete="off" disabled={save.isPending} />}</FormField>
      <div className="max-w-md"><FormField label="Função da carteira" required description="Uma carteira principal e uma secundária por conta. Uma função ocupada não pode ser atribuída a outra carteira." error={errors.role?.message}>{(props) => <Controller name="role" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange} disabled={save.isPending}><SelectTrigger {...props} ref={field.ref} onBlur={field.onBlur}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary">Principal</SelectItem><SelectItem value="secondary">Secundária</SelectItem></SelectContent></Select>} />}</FormField></div>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={save.isPending || (!!wallet && !isDirty)} aria-busy={save.isPending}>{save.isPending ? 'Salvando carteira…' : 'Salvar carteira'}</Button><Button variant="outline" disabled={save.isPending} onClick={onClose}>Cancelar</Button></div>
    </form>
  </section>
}
