import { useId, useState } from 'react'
import type { CatalogCollection, CatalogSearch } from '@/contracts/nft'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { parsePriceRange, type CatalogChange } from '../catalog-state'

export function FilterForm({ search, collections, onApply }: { search: CatalogSearch; collections: CatalogCollection[]; onApply: CatalogChange }) {
  const id = useId()
  const [collection, setCollection] = useState(search.collection)
  const [min, setMin] = useState(search.priceMin ?? '')
  const [max, setMax] = useState(search.priceMax ?? '')
  const [error, setError] = useState<string>()
  return <form className="space-y-7" onSubmit={(event) => {
    event.preventDefault()
    const range = parsePriceRange(min, max)
    if (range.error) { setError(range.error); return }
    setError(undefined)
    onApply({ collection, priceMin: range.priceMin, priceMax: range.priceMax })
  }}>
    <fieldset className="min-w-0">
      <legend className="type-card mb-3">Coleções</legend>
      <RadioGroup value={collection} onValueChange={setCollection} aria-label="Coleções">
        <div className="flex items-center gap-1"><RadioGroupItem value="" id={`${id}-all`} /><Label className="flex min-h-11 flex-1 items-center text-primary" htmlFor={`${id}-all`}>Todas as coleções</Label></div>
        {collections.map((item, index) => <div key={item.id} className="flex items-center gap-1">
          <RadioGroupItem value={item.id} id={`${id}-${index}`} />
          <Label className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2" htmlFor={`${id}-${index}`}><span className="truncate capitalize">{item.id}</span><span className="type-caption text-muted-foreground">({item.count})</span></Label>
        </div>)}
      </RadioGroup>
      {collections.length === 0 && <p className="type-caption mt-2 text-muted-foreground">Coleções ainda não disponíveis.</p>}
    </fieldset>
    <fieldset className="min-w-0 space-y-4">
      <legend className="type-card mb-3">Faixa de preço</legend>
      <FormField label="Preço mínimo (ETH)" error={error}>{(props) => <Input {...props} inputMode="decimal" value={min} onChange={(event) => setMin(event.target.value)} placeholder="0.00" />}</FormField>
      <FormField label="Preço máximo (ETH)">{(props) => <Input {...props} inputMode="decimal" value={max} onChange={(event) => setMax(event.target.value)} placeholder="Sem limite" />}</FormField>
      <p className="type-caption text-muted-foreground">Use ponto para separar casas decimais.</p>
    </fieldset>
    <Button type="submit" className="w-full">Aplicar filtros</Button>
  </form>
}
