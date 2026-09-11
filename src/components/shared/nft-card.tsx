import type { ReactNode } from 'react'
import { Heart, ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ETHPrice } from '@/components/shared/eth-price'

type NFTCardProps = {
  name: string
  collection: string
  image?: { src: string; alt: string; srcSet?: string; sizes?: string }
  price: string
  soldOut?: boolean
  favorite?: boolean
  favoriteDisabled?: boolean
  onFavoriteChange?: (favorite: boolean) => void
  renderLink: (contents: ReactNode) => ReactNode
}
export function NFTCard({ name, collection, image, price, soldOut, favorite = false, favoriteDisabled, onFavoriteChange, renderLink }: NFTCardProps) {
  return <article className="nft-card group relative min-w-0">
    {renderLink(<>
      <div className="aspect-square overflow-hidden rounded-xl bg-card p-3 sm:rounded-md">
        {image ? <img {...image} width={480} height={480} loading="lazy" decoding="async" className="aspect-square h-full w-full rounded-lg object-cover sm:rounded-sm" /> :
          <div role="img" aria-label="Imagem da obra indisponível" className="flex h-full items-center justify-center rounded-lg bg-secondary text-muted-foreground"><ImageOff className="size-10" aria-hidden="true" /></div>}
      </div>
      <div className="space-y-1 pt-3">
        <p className="type-caption truncate text-muted-foreground">{collection}</p>
        <h3 className="type-card break-words group-hover:text-primary">{name}</h3>
        <ETHPrice value={price} className="block" />
        {soldOut && <Badge variant="unavailable">Esgotado</Badge>}
      </div>
    </>)}
    {onFavoriteChange && <Button variant="secondary" size="icon" className="absolute top-4 right-4 rounded-full" aria-label={`Favoritar ${name}`} aria-pressed={favorite} disabled={favoriteDisabled} onClick={() => onFavoriteChange(!favorite)}>
      <Heart className={favorite ? 'fill-primary text-primary' : 'text-primary'} aria-hidden="true" />
    </Button>}
  </article>
}
