import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import type { CartItem as Item } from '@/contracts/cart'
import type { QuoteLine } from '@/contracts/quote'
import { Button } from '@/components/ui/button'
import { ETHPrice } from '@/components/shared/eth-price'
import { QuantitySelector } from '@/components/shared/quantity-selector'
import { multiplyEth } from '@/lib/money'

export function CartItem({ item, line, pending, onQuantity, onRemove }: {
  item: Item; line?: QuoteLine; pending: boolean; onQuantity: (quantity: number) => void; onRemove: () => void
}) {
  const edition = item.nft.editions.find((value) => value.id === item.editionId)
  const maximum = edition?.availableQuantity ?? 0
  const price = line?.unitPriceEth ?? item.nft.priceEth
  return <li className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-3 rounded-xl bg-card p-3 lg:grid-cols-[minmax(0,1fr)_7rem_8.5rem_8rem_2.75rem] lg:rounded-sm" aria-label={item.nft.name + ' · ' + (edition?.name ?? item.editionId)}>
    <div className="col-span-2 flex min-w-0 gap-3 lg:col-span-1">
      <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} className="shrink-0"><img src={item.nft.imageUrl} alt={item.nft.name} width={72} height={72} className="size-18 rounded-lg object-cover" /></Link>
      <div className="min-w-0 space-y-1"><h2 className="type-card break-words"><Link to="/nfts/$nftId" params={{ nftId: item.nftId }}>{item.nft.name}</Link></h2>
        <p className="type-caption text-muted-foreground">Coleção {item.nft.collection} · {edition?.name ?? 'Edição indisponível'}</p>
        <p className={maximum < item.quantity ? 'type-caption text-warning' : 'type-caption text-muted-foreground'}>{maximum === 0 ? 'Edição esgotada. Remova este item.' : maximum < item.quantity ? `Quantidade acima do estoque: ${maximum} disponível(is). Ajuste para continuar.` : `${maximum} disponível(is)`}</p>
      </div>
    </div>
    <div className="min-w-0"><span className="type-caption block text-muted-foreground lg:hidden">Preço unitário</span><ETHPrice value={price} className="break-all text-sm" /></div>
    <QuantitySelector aria-label={'Quantidade de ' + item.nft.name} value={item.quantity} max={maximum} disabled={pending || maximum === 0} onValueChange={(value) => onQuantity(Math.min(value, maximum))} />
    <div className="min-w-0"><span className="type-caption block text-muted-foreground lg:hidden">Subtotal do item</span><ETHPrice value={line?.subtotalEth ?? multiplyEth(price, item.quantity)} className="break-all text-sm" /></div>
    <Button variant="ghost" size="icon" disabled={pending} onClick={onRemove} aria-label={`Remover ${item.nft.name} do carrinho`} className="justify-self-end text-primary"><Trash2 aria-hidden="true" /></Button>
  </li>
}
