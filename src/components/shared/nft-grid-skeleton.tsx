import { NFTCardSkeleton } from '@/components/shared/nft-card-skeleton'
import { cn } from '@/lib/cn'

export function NFTGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return <div role="status" aria-label="Carregando NFTs">
    <span className="sr-only">Carregando NFTs</span>
    <div aria-hidden="true" className={cn('grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6', className)}>
      {Array.from({ length: count }, (_, index) => <NFTCardSkeleton key={index} />)}
    </div>
  </div>
}
