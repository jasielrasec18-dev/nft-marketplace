import { Skeleton } from '@/components/ui/skeleton'

export function CartSummarySkeleton() {
  return <div role="status" aria-label="Carregando resumo" className="rounded-xl bg-card p-5 sm:rounded-md">
    <span className="sr-only">Carregando resumo</span>
    <div aria-hidden="true" className="space-y-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-11 w-full" />{[0, 1, 2].map((row) => <div key={row} className="flex justify-between gap-4"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/4" /></div>)}<Skeleton className="h-6 w-full" /><Skeleton className="h-11 w-full" /></div>
  </div>
}
