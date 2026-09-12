import { Skeleton } from '@/components/ui/skeleton'
export function AccountSkeleton({ label }: { label: string }) {
  return <div role="status" aria-label={label} className="space-y-5"><span className="sr-only">{label}</span><Skeleton className="h-8 w-56" /><div className="grid gap-5 sm:grid-cols-2">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div></div>
}
