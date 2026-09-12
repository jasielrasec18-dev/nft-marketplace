import { FavoriteControl } from '@/features/favorites/favorite-control'
import { useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import type { NFT } from '@/contracts/nft'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ETHPrice } from '@/components/shared/eth-price'
import { QuantitySelector } from '@/components/shared/quantity-selector'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { useAddCartItem } from '@/features/cart/hooks/use-add-cart-item'

export function NFTPurchasePanel({ nft }: { nft: NFT }) {
  const id = useId()
  const [editionId, setEditionId] = useState(() => nft.editions.find((edition) => edition.availableQuantity > 0)?.id ?? nft.editions[0]?.id ?? '')
  const [requestedQuantity, setQuantity] = useState(1)
  const edition = nft.editions.find((item) => item.id === editionId)
  const maximum = edition?.availableQuantity ?? 0
  const quantity = Math.max(1, Math.min(requestedQuantity, Math.max(1, maximum)))
  const add = useAddCartItem()
  const unavailable = maximum === 0
  function selectEdition(value: string) {
    setEditionId(value)
    setQuantity(1)
    add.reset()
  }
  return <section aria-label="Informações e aquisição" className="min-w-0 space-y-5 rounded-2xl bg-card p-4 sm:p-6 lg:bg-transparent lg:p-0">
    <div className="space-y-2">
      <p className="type-label text-primary">Coleção {nft.collection}</p>
      <h1 className="type-page break-words">{nft.name}</h1>
      <p className="type-body text-muted-foreground">{nft.description}</p>
    </div>
    <fieldset disabled={add.isPending}>
      <legend className="type-label mb-2">Edição</legend>
      <RadioGroup value={editionId} onValueChange={selectEdition} aria-label="Edição do NFT" className="flex flex-wrap gap-2">
        {nft.editions.map((item) => <div key={item.id} className="flex items-center rounded-full border border-input pr-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary">
          <RadioGroupItem id={`${id}-${item.id}`} value={item.id} disabled={item.availableQuantity === 0 || add.isPending} />
          <Label htmlFor={`${id}-${item.id}`} className="type-caption cursor-pointer">{item.name}{item.availableQuantity === 0 ? ' · Esgotada' : ''}</Label>
        </div>)}
      </RadioGroup>
    </fieldset>
    <p role="status" className="type-small text-muted-foreground">{nft.availableQuantity === 0 ? 'NFT esgotado. Nenhuma edição disponível.' : unavailable ? 'Esta edição está esgotada. Selecione uma edição disponível.' : `${maximum} unidades disponíveis na edição ${edition?.name}.`}</p>
    <dl className="type-caption space-y-2 text-muted-foreground">
      <div className="flex flex-wrap gap-x-2"><dt>ID do NFT:</dt><dd className="break-all">{nft.id}</dd></div>
      <div className="flex flex-wrap gap-x-2"><dt>Coleção:</dt><dd>{nft.collection}</dd></div>
    </dl>
    <div className="space-y-4 rounded-xl bg-background/50 p-4 lg:bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="type-caption mb-1 text-muted-foreground">Quantidade</p><QuantitySelector aria-label="Quantidade de NFTs" value={quantity} min={1} max={Math.max(1, maximum)} disabled={unavailable || add.isPending} onValueChange={(value) => { setQuantity(value); add.reset() }} /></div>
        <div className="min-w-0 text-right"><p className="type-caption mb-2 text-muted-foreground">Preço por unidade</p><ETHPrice value={nft.priceEth} className="text-lg" data-testid="nft-unit-price" /></div>
      </div>
      <Button size="lg" className="w-full rounded-full sm:rounded-md" disabled={unavailable || add.isPending} aria-busy={add.isPending} onClick={() => {
        if (edition && !unavailable) add.mutate({ nftId: nft.id, editionId: edition.id, quantity })
      }}><ShoppingCart aria-hidden="true" />{add.isPending ? 'Adicionando…' : unavailable ? 'Edição esgotada' : 'Adicionar ao carrinho'}</Button>
      <p className="type-caption text-muted-foreground">A inclusão não reserva estoque. Revise os itens e a cotação no carrinho.</p>
    </div>
    {add.isSuccess && <InlineAlert variant="success">{add.variables.quantity} unidade(s) de {nft.name} adicionada(s) ao carrinho. <Link to="/cart" className="inline-flex min-h-11 items-center underline">Ver carrinho</Link></InlineAlert>}
    {add.isError && <InlineAlert variant="error">{add.error instanceof ApiError ? add.error.message : 'Não foi possível adicionar ao carrinho.'}</InlineAlert>}
    <FavoriteControl nftId={nft.id} name={nft.name} />
  </section>
}
