import { Link, useParams, useSearch } from '@tanstack/react-router'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { ApiError } from '@/api/errors'
import { useSession } from '@/features/auth/hooks/use-session'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { NFTDetailSkeleton } from '@/components/shared/nft-detail-skeleton'
import { useNft } from '@/features/nft/hooks/use-nft'
import { NFTGallery } from '@/features/nft/components/nft-gallery'
import { NFTPurchasePanel } from '@/features/nft/components/nft-purchase-panel'
import { NFTDetails } from '@/features/nft/components/nft-details'
import { RelatedNFTs } from '@/features/nft/components/related-nfts'

export function NFTDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const search = useSearch({ from: '/nfts/$nftId' })
  const query = useNft(nftId)
  const session = useSession()
  const back = <Button asChild variant="link" className="px-0"><Link to="/" search={search} hash="catalog"><ArrowLeft aria-hidden="true" />Voltar ao catálogo</Link></Button>
  const notFound = query.error instanceof ApiError && query.error.status === 404
  if (notFound) return <ErrorState headingLevel={1} title="NFT não encontrado" description="Esta obra não está disponível no catálogo. Explore outros NFTs." action={back} />
  if (query.isPending) return <div className="space-y-6">{back}<NFTDetailSkeleton /></div>
  if (!query.data) return <ErrorState headingLevel={1} title="Não foi possível carregar o NFT" description={query.error?.message} onRetry={() => void query.refetch()} action={back} />
  const nft = query.data
  return <div className="space-y-10 lg:space-y-16">
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Breadcrumb" className="min-w-0"><ol className="type-caption flex flex-wrap items-center gap-2 text-muted-foreground">
          <li><Link to="/" className="inline-flex min-h-11 items-center">Início</Link></li><li aria-hidden="true">/</li><li>{back}</li><li aria-hidden="true">/</li><li aria-current="page" className="break-words">{nft.name}</li>
        </ol></nav>
        <Button variant="ghost" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw aria-hidden="true" />{query.isFetching ? 'Atualizando…' : 'Atualizar NFT'}</Button>
      </div>
      {query.isError && <InlineAlert variant="warning">Não foi possível atualizar. Os dados anteriores continuam visíveis. <Button variant="link" onClick={() => void query.refetch()}>Tentar novamente</Button></InlineAlert>}
      <div className="grid items-start gap-4 md:grid-cols-2 md:gap-6 lg:gap-10" data-testid="nft-detail-content">
        <NFTGallery key={`gallery-${nft.id}`} nft={nft} />
        <NFTPurchasePanel key={`purchase-${nft.id}-${session.data?.user.id ?? 'guest'}`} nft={nft} />
      </div>
    </div>
    <NFTDetails nft={nft} />
    <RelatedNFTs nft={nft} search={search} />
  </div>
}
