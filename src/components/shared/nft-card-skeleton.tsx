import { Skeleton } from '@/components/ui/skeleton'

export function NFTCardSkeleton() {
  return <div className="min-w-0" role="status" aria-label="Carregando NFT">
    <div aria-hidden="true">
      <div className="aspect-square rounded-xl bg-card p-3 sm:rounded-md"><Skeleton className="h-full w-full rounded-lg sm:rounded-sm" /></div>
      <div className="space-y-1 pt-3"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-5 w-5/6" /><Skeleton className="h-5 w-1/2" /></div>
    </div>
    <span className="sr-only">Carregando NFT</span>
  </div>
}
