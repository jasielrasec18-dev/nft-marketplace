import { useNavigate, useSearch } from '@tanstack/react-router'
import { catalogSearchSchema } from '@/contracts/nft'
import { defaultCatalogSearch, type CatalogChange } from '@/features/catalog/catalog-state'
import { useNfts } from '@/features/catalog/hooks/use-nfts'
import { HeroSection } from '@/features/catalog/components/hero-section'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { CatalogSearchInput } from '@/features/catalog/components/catalog-search'
import { MobileFilters } from '@/features/catalog/components/mobile-filters'
import { DiscoverySections } from '@/features/catalog/components/discovery-sections'

export function HomePage() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const discovery = useNfts(defaultCatalogSearch)
  const onChange: CatalogChange = (patch) => {
    void navigate({ search: (previous) => catalogSearchSchema.parse({ ...previous, ...patch, page: 1 }), resetScroll: false })
  }
  const onPage = (page: number) => {
    void navigate({ search: (previous) => ({ ...previous, page }), resetScroll: false }).then(() => {
      document.getElementById('catalog')?.focus({ preventScroll: true })
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
  }
  return <div className="space-y-10 sm:space-y-14">
    <div className="flex items-center gap-2 lg:hidden">
      <CatalogSearchInput key={search.q} value={search.q} onChange={onChange} />
      <MobileFilters search={search} collections={discovery.data?.collections ?? []} onChange={onChange} />
    </div>
    <HeroSection nft={discovery.data?.items.find((nft) => nft.availableQuantity > 0)} loading={discovery.isPending} />
    <CatalogSection search={search} discovery={discovery.data} onChange={onChange} onPage={onPage} />
    <DiscoverySections items={discovery.data?.items ?? []} />
  </div>
}
