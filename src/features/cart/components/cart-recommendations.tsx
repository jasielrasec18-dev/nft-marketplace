import { Link } from '@tanstack/react-router'
import { useNfts } from '@/features/catalog/hooks/use-nfts'
import { defaultCatalogSearch } from '@/features/catalog/catalog-state'
import { NFTCard } from '@/components/shared/nft-card'

export function CartRecommendations() {
  const query = useNfts(defaultCatalogSearch)
  if (!query.data?.items.length) return null
  return <section aria-labelledby="cart-explore" className="space-y-6 pt-10"><h2 id="cart-explore" className="type-section border-b border-border pb-3 text-primary">Explore também</h2>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">{query.data.items.slice(0, 5).map((nft) => <NFTCard key={nft.id} name={nft.name} collection={nft.collection} price={nft.priceEth} image={{ src: nft.imageUrl, alt: nft.name }} soldOut={nft.availableQuantity === 0} renderLink={(contents) => <Link to="/nfts/$nftId" params={{ nftId: nft.id }}>{contents}</Link>} />)}</div>
  </section>
}
