import { SearchX, RefreshCw } from 'lucide-react'
import type { CatalogSearch, NFTListResponse } from '@/contracts/nft'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { NFTGridSkeleton } from '@/components/shared/nft-grid-skeleton'
import { useNfts } from '../hooks/use-nfts'
import { defaultCatalogSearch, type CatalogChange } from '../catalog-state'
import { FilterForm } from './filter-form'
import { FeaturedNFT } from './featured-nft'
import { CatalogToolbar } from './catalog-toolbar'
import { NFTGrid } from './nft-grid'
import { Pagination } from './pagination'

export function CatalogSection({ search, discovery, onChange, onPage }: { search: CatalogSearch; discovery?: NFTListResponse; onChange: CatalogChange; onPage: (page: number) => void }) {
  const query = useNfts(search)
  const data = query.data
  const filtered = Boolean(search.q || search.collection || search.priceMin || search.priceMax)
  const clear = () => onChange(defaultCatalogSearch)
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0
  const outOfRange = Boolean(data && data.total > 0 && search.page > totalPages)
  return <section id="catalog" aria-labelledby="catalog-title" tabIndex={-1} className="scroll-mt-6">
    <div className="grid items-start gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside aria-label="Filtros do catálogo" className="hidden space-y-6 lg:block">
        <div className="rounded-md bg-card p-4"><FilterForm key={JSON.stringify(search)} search={search} collections={data?.collections ?? discovery?.collections ?? []} onApply={onChange} /></div>
        <FeaturedNFT nft={discovery?.items.find((nft) => nft.availableQuantity > 0)} />
      </aside>
      <div className="min-w-0 space-y-5">
        <CatalogToolbar search={search} onChange={onChange} />
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
          <p role="status" className="type-caption text-muted-foreground">{data ? `${data.total} NFTs encontrados` : query.isPending ? 'Buscando NFTs…' : 'Catálogo indisponível'}{query.isFetching && data ? ' · Atualizando…' : ''}</p>
          <div className="flex flex-wrap gap-2">{filtered && <Button variant="ghost" size="sm" onClick={clear}>Limpar filtros</Button>}
            {data && <Button variant="ghost" size="sm" disabled={query.isFetching} onClick={() => { void query.refetch() }} aria-label="Atualizar catálogo"><RefreshCw aria-hidden="true" />Atualizar</Button>}</div>
        </div>
        {filtered && <p className="type-caption break-words text-muted-foreground">Filtros ativos: {[search.q && `“${search.q}”`, search.collection, search.priceMin && `a partir de ${search.priceMin} ETH`, search.priceMax && `até ${search.priceMax} ETH`].filter(Boolean).join(' · ')}</p>}
        {query.isPending ? <NFTGridSkeleton count={8} /> : query.isError && !data ?
          <ErrorState title="Não foi possível carregar os NFTs" description={query.error instanceof ApiError ? query.error.message : 'Tente novamente em instantes.'} onRetry={() => { void query.refetch() }} action={filtered ? <Button variant="outline" onClick={clear}>Limpar filtros</Button> : undefined} /> :
          data && <>
            {query.isError && <InlineAlert variant="warning">Não foi possível atualizar. Os resultados anteriores continuam visíveis. <Button variant="link" size="sm" onClick={() => { void query.refetch() }}>Tentar novamente</Button></InlineAlert>}
            {data.items.length > 0 ? <NFTGrid items={data.items} /> : <EmptyState icon={<SearchX />} title={outOfRange ? 'Esta página não tem resultados' : 'Nenhum NFT encontrado'} description={outOfRange ? 'Volte à primeira página para continuar explorando.' : 'Experimente outra busca ou remova os filtros aplicados.'} action={<Button onClick={outOfRange ? () => onPage(1) : clear}>{outOfRange ? 'Ir para a primeira página' : 'Limpar filtros'}</Button>} />}
            {!outOfRange && <Pagination page={data.page} totalPages={totalPages} onChange={onPage} />}
          </>}
      </div>
    </div>
  </section>
}
