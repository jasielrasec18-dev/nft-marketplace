import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Wallet, WalletConnection } from '@/contracts/wallet'
import { useServices } from '@/app/providers/services-context'
import { useAccountIdentity } from '@/features/account/account-context'
import { privateKeys } from '@/app/query/keys'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { InlineAlert } from '@/components/feedback/inline-alert'
export function WalletConnectionControl({ wallet, onConnected, disabled }: { wallet: Wallet; onConnected: (connected: boolean) => void; disabled: boolean }) {
  const { api, sessionLifecycle } = useServices()
  const { userId, generation } = useAccountIdentity()
  const [open, setOpen] = useState(false)
  const [connection, setConnection] = useState<'disconnected' | 'connected' | 'declined'>('disconnected')
  const mutation = useMutation({
    mutationKey: [...privateKeys.wallets(userId), 'connection'],
    gcTime: 0,
    mutationFn: async (decision: 'accept' | 'decline') => {
      sessionLifecycle.assertCurrent(generation)
      const response = await api.post<WalletConnection>('/wallets/' + encodeURIComponent(wallet.id) + '/connect', { decision })
      sessionLifecycle.assertCurrent(generation)
      return response.data
    },
    onSuccess: (result) => { setConnection(result.status); onConnected(result.status === 'connected'); setOpen(false) },
  })
  return <div className="space-y-3">
    <p role="status" className="type-small">{mutation.isPending ? 'Conectando carteira…' : connection === 'connected' ? 'Carteira conectada na simulação.' : connection === 'declined' ? 'Conexão recusada. Você pode tentar novamente.' : 'Carteira desconectada.'}</p>
    {connection === 'connected' ? <Button variant="outline" disabled={disabled} onClick={() => { setConnection('disconnected'); onConnected(false) }}>Desconectar carteira</Button>
      : <Dialog open={open} onOpenChange={(value) => { if (!mutation.isPending) setOpen(value) }}><DialogTrigger asChild><Button variant="outline" disabled={disabled}>Conectar carteira</Button></DialogTrigger><DialogContent closeDisabled={mutation.isPending} onEscapeKeyDown={(event) => { if (mutation.isPending) event.preventDefault() }} onPointerDownOutside={(event) => { if (mutation.isPending) event.preventDefault() }}>
        <DialogTitle>Conectar carteira</DialogTitle><DialogDescription>Autorize a conexão simulada de {wallet.label}. Nenhuma extensão ou transação real será utilizada.</DialogDescription>
        <p className="type-small my-5 break-all">{wallet.address}</p>
        {mutation.isError && <InlineAlert variant="error">{mutation.error.message}</InlineAlert>}
        <div className="mt-5 flex flex-wrap gap-3"><Button disabled={mutation.isPending} onClick={() => mutation.mutate('accept')}>Autorizar conexão</Button><Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate('decline')}>Recusar conexão</Button></div>
      </DialogContent></Dialog>}
  </div>
}
