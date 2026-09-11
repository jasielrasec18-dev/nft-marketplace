import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null
  const numbers = totalPages <= 7 ? Array.from({ length: totalPages }, (_, index) => index + 1) :
    [...new Set([1, page - 1, page, page + 1, totalPages])].filter((value) => value > 0 && value <= totalPages).sort((a, b) => a - b)
  return <nav aria-label="Paginação do catálogo" className="flex flex-wrap items-center justify-end gap-1 pt-6">
    <Button variant="outline" size="icon" aria-label="Página anterior" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft /></Button>
    {numbers.map((value, index) => <span key={value} className="inline-flex items-center gap-1">{index > 0 && value - (numbers[index - 1] ?? 0) > 1 && <span aria-hidden="true" className="px-1">…</span>}
      <Button variant={page === value ? 'default' : 'outline'} size="icon" aria-label={`Página ${value}`} aria-current={page === value ? 'page' : undefined} onClick={() => onChange(value)}>{value}</Button>
    </span>)}
    <Button variant="outline" size="icon" aria-label="Próxima página" disabled={page >= totalPages} onClick={() => onChange(page + 1)}><ChevronRight /></Button>
  </nav>
}
