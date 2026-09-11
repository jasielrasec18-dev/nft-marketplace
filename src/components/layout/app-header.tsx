import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function AppHeader() {
  const [open, setOpen] = useState(false)
  return <header className="border-b border-border">
    <PageContainer className="flex min-h-20 items-center justify-between gap-4">
      <Link to="/" aria-label="Kurio — início" className="type-section inline-flex min-h-11 items-center tracking-widest">KURIO</Link>
      <nav aria-label="Navegação principal" className="hidden sm:block"><Link to="/" className="inline-flex min-h-11 items-center border-b-2 border-primary text-sm text-primary">Início</Link></nav>
      <span className="type-caption hidden text-muted-foreground sm:block">Arte, criadores e cultura.</span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button variant="ghost" size="icon" className="sm:hidden" aria-label="Abrir menu"><Menu /></Button></SheetTrigger>
        <SheetContent>
          <SheetTitle>KURIO</SheetTitle><SheetDescription>Arte, criadores e cultura.</SheetDescription>
          <nav aria-label="Navegação mobile" className="mt-8"><Link to="/" onClick={() => setOpen(false)} className="flex min-h-11 items-center text-primary">Início</Link></nav>
        </SheetContent>
      </Sheet>
    </PageContainer>
  </header>
}
