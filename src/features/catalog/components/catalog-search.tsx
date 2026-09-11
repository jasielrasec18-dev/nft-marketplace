import { useId, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CatalogChange } from '../catalog-state'

export function CatalogSearchInput({ value, onChange }: { value: string; onChange: CatalogChange }) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  return <form role="search" aria-label="Buscar no catálogo" className="flex min-w-0 flex-1 gap-2" onSubmit={(event) => { event.preventDefault(); const q = draft.trim(); setDraft(q); onChange({ q }) }}>
    <Label htmlFor={id} className="sr-only">Buscar NFTs</Label>
    <Input id={id} type="search" value={draft} maxLength={100} onChange={(event) => setDraft(event.target.value)} placeholder="Explorar NFTs" className="bg-card" />
    <Button type="submit" variant="outline" size="icon" aria-label="Buscar"><Search /></Button>
  </form>
}
