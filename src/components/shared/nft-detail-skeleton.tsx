import { Skeleton } from '@/components/ui/skeleton'

export function NFTDetailSkeleton() {
  return <div role="status" aria-label="Carregando detalhes do NFT">
    <span className="sr-only">Carregando detalhes do NFT</span>
    <div aria-hidden="true" className="grid gap-6 md:grid-cols-2">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-11 w-1/2" /><Skeleton className="h-11 w-full" /></div>
    </div>
  </div>
}
