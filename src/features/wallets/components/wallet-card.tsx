import type { Wallet } from '@/contracts/wallet'
import { Button } from '@/components/ui/button'
import { networkNames } from '../labels'
export function WalletCard({ wallet, onEdit }: { wallet: Wallet; onEdit: () => void }) {
  return <article aria-label={wallet.label} className="space-y-4 rounded-md border border-border bg-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="type-card break-words">{wallet.label}</h3><span className="type-caption rounded-full border border-primary px-3 py-1 text-primary">{wallet.role === 'primary' ? 'Principal' : 'Secundária'}</span></div>
    <dl className="space-y-3"><div><dt className="type-caption text-muted-foreground">Rede</dt><dd className="type-small">{networkNames[wallet.network]}</dd></div><div><dt className="type-caption text-muted-foreground">Endereço</dt><dd className="type-small break-all">{wallet.address}</dd></div></dl>
    <Button variant="outline" onClick={onEdit} aria-label={'Editar ' + wallet.label}>Editar</Button>
  </article>
}
