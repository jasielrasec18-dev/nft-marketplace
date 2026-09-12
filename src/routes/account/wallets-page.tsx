import { useState } from 'react'
import type { Wallet, WalletInput } from '@/contracts/wallet'
import { useWallets } from '@/features/wallets/hooks/use-wallets'
import { WalletCard } from '@/features/wallets/components/wallet-card'
import { WalletForm } from '@/features/wallets/components/wallet-form'
import { AccountSkeleton } from '@/features/account/account-skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { Button } from '@/components/ui/button'
export function WalletsPage() {
  const wallets = useWallets()
  const [editing, setEditing] = useState<{ wallet?: Wallet; role: WalletInput['role'] }>()
  const [saved, setSaved] = useState(false)
  const close = () => { setEditing(undefined); document.getElementById('wallets-title')?.focus() }
  return <div className="max-w-4xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 id="wallets-title" tabIndex={-1} className="type-page">Minhas carteiras</h1>{wallets.data && wallets.data.length > 0 && !editing && <Button variant="link" onClick={() => { setSaved(false); setEditing({ role: wallets.data.some((wallet) => wallet.role === 'primary') ? 'secondary' : 'primary' }) }}>Adicionar carteira</Button>}</div>
    <p className="type-small text-muted-foreground">Gerencie sua carteira principal e secundária.</p>
    {wallets.isPending ? <AccountSkeleton label="Carregando carteiras" /> : !wallets.data ? <ErrorState title="Não foi possível carregar as carteiras" description={wallets.error?.message} onRetry={() => void wallets.refetch()} />
      : <>{wallets.isError && <InlineAlert variant="warning">As últimas carteiras foram mantidas. <Button variant="link" onClick={() => void wallets.refetch()}>Tentar novamente</Button></InlineAlert>}
        {saved && <InlineAlert variant="success">Carteira salva.</InlineAlert>}
        {editing && <WalletForm key={editing.wallet?.id ?? 'new'} {...editing} onClose={close} onSaved={() => { close(); setSaved(true) }} />}
        {!wallets.data.length && !editing ? <EmptyState title="Você ainda não tem carteiras" description="Adicione sua primeira carteira para organizar sua conta." action={<Button onClick={() => { setSaved(false); setEditing({ role: 'primary' }) }}>Adicionar carteira</Button>} />
          : <div className="space-y-7">{(['primary', 'secondary'] as const).map((role) => {
            const wallet = wallets.data.find((item) => item.role === role)
            return <section key={role} aria-label={role === 'primary' ? 'Carteira principal' : 'Carteira secundária'} className="space-y-3"><h2 className="type-section">{role === 'primary' ? 'Carteira principal' : 'Carteira secundária'}</h2>{wallet ? <WalletCard wallet={wallet} onEdit={() => { setSaved(false); setEditing({ wallet, role }) }} /> : <p className="type-small text-muted-foreground">Nenhuma carteira {role === 'primary' ? 'principal' : 'secundária'} cadastrada.</p>}</section>
          })}</div>}
      </>}
  </div>
}
