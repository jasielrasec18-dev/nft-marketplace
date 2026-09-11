import { Link } from '@tanstack/react-router'
import type { NFT } from '@/contracts/nft'
import { ETHPrice } from '@/components/shared/eth-price'

export function FeaturedNFT({ nft }: { nft?: NFT }) {
  if (!nft) return null
  return <section className="space-y-3 rounded-md bg-card p-4" aria-labelledby="featured-title">
    <h2 id="featured-title" className="type-card uppercase text-primary">NFT em destaque</h2>
    <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="block space-y-3 rounded-md">
      <img src={nft.imageUrl} alt={nft.name} width={480} height={480} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
      <h3 className="type-card">{nft.name}</h3><ETHPrice value={nft.priceEth} />
    </Link>
  </section>
}
