import { Link, useSearch } from '@tanstack/react-router'
import type { NFT } from '@/contracts/nft'
import { NFTCard } from '@/components/shared/nft-card'

export function NFTGrid({ items }: { items: NFT[] }) {
  const search = useSearch({ from: '/' })
  return <ul aria-label="NFTs encontrados" className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6">
    {items.map((nft) => <li key={nft.id} className="min-w-0"><NFTCard name={nft.name} collection={nft.collection} image={{ src: nft.imageUrl, alt: nft.name }} price={nft.priceEth} soldOut={nft.availableQuantity === 0}
      renderLink={(contents) => <Link to="/nfts/$nftId" params={{ nftId: nft.id }} search={search}>{contents}</Link>} /></li>)}
  </ul>
}
