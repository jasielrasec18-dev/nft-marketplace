import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import type { CatalogCollection, CatalogSearch } from '@/contracts/nft'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FilterForm } from './filter-form'
import type { CatalogChange } from '../catalog-state'

export function MobileFilters({ search, collections, onChange }: { search: CatalogSearch; collections: CatalogCollection[]; onChange: CatalogChange }) {
  const [open, setOpen] = useState(false)
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button size="icon" aria-label="Abrir filtros"><SlidersHorizontal /></Button></SheetTrigger>
    <SheetContent><SheetTitle>Filtrar NFTs</SheetTitle><SheetDescription>Escolha uma coleção e uma faixa de preço. As mudanças são aplicadas ao confirmar.</SheetDescription>
      <div className="mt-6"><FilterForm key={JSON.stringify(search)} search={search} collections={collections} onApply={(patch) => { onChange(patch); setOpen(false) }} /></div>
    </SheetContent>
  </Sheet>
}
