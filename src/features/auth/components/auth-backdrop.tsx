import { Link } from '@tanstack/react-router'
import { useNfts } from '@/features/catalog/hooks/use-nfts'
import { defaultCatalogSearch } from '@/features/catalog/catalog-state'
import { HeroSection } from '@/features/catalog/components/hero-section'
import { NFTCard } from '@/components/shared/nft-card'

export function AuthBackdrop() {
  const query = useNfts(defaultCatalogSearch)
  return <div aria-hidden="true" inert className="hidden space-y-12 md:block">
    <HeroSection nft={query.data?.items.find((nft) => nft.availableQuantity > 0)} loading={query.isPending} />
    <div className="grid grid-cols-3 gap-6">{query.data?.items.slice(0, 6).map((nft) => <NFTCard key={nft.id} name={nft.name} collection={nft.collection} image={{ src: nft.imageUrl, alt: nft.name }} price={nft.priceEth} renderLink={(content) => <Link to="/nfts/$nftId" params={{ nftId: nft.id }}>{content}</Link>} />)}</div>
  </div>
}
