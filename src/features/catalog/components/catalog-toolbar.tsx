import type { CatalogSearch } from '@/contracts/nft'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { CatalogSearchInput } from './catalog-search'
import type { CatalogChange } from '../catalog-state'

export function CatalogToolbar({ search, onChange }: { search: CatalogSearch; onChange: CatalogChange }) {
  return <div className="space-y-4">
    <div className="hidden lg:flex"><CatalogSearchInput key={search.q} value={search.q} onChange={onChange} /></div>
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
      <h2 id="catalog-title" className="type-card border-b-2 border-primary py-3 text-primary">Todos os NFTs</h2>
      <FormField label="Ordenar por" className="w-full sm:w-56">{(props) => <Select value={search.sort} onValueChange={(sort: CatalogSearch['sort']) => onChange({ sort })}>
        <SelectTrigger {...props}><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="recent">Mais recentes</SelectItem><SelectItem value="price-asc">Menor preço</SelectItem><SelectItem value="price-desc">Maior preço</SelectItem><SelectItem value="name">Nome A–Z</SelectItem>
        </SelectContent>
      </Select>}</FormField>
    </div>
  </div>
}
