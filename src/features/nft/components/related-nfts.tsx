import { Link } from '@tanstack/react-router'
import type { CatalogSearch, NFT } from '@/contracts/nft'
import { defaultCatalogSearch } from '@/features/catalog/catalog-state'
import { useNfts } from '@/features/catalog/hooks/use-nfts'
import { NFTCard } from '@/components/shared/nft-card'
import { NFTGridSkeleton } from '@/components/shared/nft-grid-skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { Button } from '@/components/ui/button'

export function RelatedNFTs({ nft, search }: { nft: NFT; search: CatalogSearch }) {
  const query = useNfts({ ...defaultCatalogSearch, collection: nft.collection })
  const items = query.data?.items.filter((item) => item.id !== nft.id).slice(0, 5) ?? []
  return <section aria-labelledby="related-title" className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3"><h2 id="related-title" className="type-section text-primary">Mais desta coleção</h2>
      <Button asChild variant="link"><Link to="/" search={{ ...defaultCatalogSearch, collection: nft.collection }} hash="catalog">Ver coleção</Link></Button>
    </div>
    {query.isPending ? <NFTGridSkeleton count={5} className="lg:grid-cols-5" /> :
      query.isError && !query.data ? <ErrorState title="Não foi possível carregar os relacionados" onRetry={() => void query.refetch()} /> :
      <>
        {query.isError && <InlineAlert variant="warning">Não foi possível atualizar os relacionados. <Button variant="link" onClick={() => void query.refetch()}>Tentar novamente</Button></InlineAlert>}
        {items.length ? <ul aria-label="NFTs relacionados" className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">{items.map((item) => <li key={item.id} className="min-w-0">
          <NFTCard name={item.name} collection={item.collection} image={{ src: item.imageUrl, alt: item.name }} price={item.priceEth} soldOut={item.availableQuantity === 0} renderLink={(contents) => <Link to="/nfts/$nftId" params={{ nftId: item.id }} search={search}>{contents}</Link>} />
        </li>)}</ul> : <p className="type-small text-muted-foreground">Não há outros NFTs disponíveis nesta coleção.</p>}
      </>}
  </section>
}
