import { useState } from 'react'
import { SessionActions } from '@/features/auth/components/session-actions'
import { Link } from '@tanstack/react-router'
import { BookOpen, Compass, Home, Menu, ShoppingCart, UserRound } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function AppHeader() {
  const [open, setOpen] = useState(false)
  return <header className="border-b border-border">
    <PageContainer className="flex min-h-16 items-center justify-between gap-4 lg:min-h-20">
      <Link to="/" aria-label="Kurio — início" className="type-section inline-flex min-h-11 items-center tracking-widest">KURIO</Link>
      <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
        <Link to="/" activeOptions={{ exact: true }} className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm" activeProps={{ className: 'border-primary text-primary' }}>Início</Link>
        <Link to="/" search hash="catalog" className="inline-flex min-h-11 items-center text-sm">Mercado</Link>
        <Link to="/" search hash="journal" className="inline-flex min-h-11 items-center text-sm">Aprenda</Link>
      </nav>
      <div className="hidden items-center gap-3 lg:flex"><Button disabled variant="ghost" size="icon" aria-label="Carrinho — em breve"><ShoppingCart /></Button><SessionActions /></div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu"><Menu /></Button></SheetTrigger>
        <SheetContent><SheetTitle>KURIO</SheetTitle><SheetDescription>Arte, criadores e cultura.</SheetDescription>
          <nav aria-label="Navegação mobile" className="mt-8 space-y-3"><Link to="/" onClick={() => setOpen(false)} className="flex min-h-11 items-center text-primary">Início</Link><Link to="/" search hash="catalog" onClick={() => setOpen(false)} className="flex min-h-11 items-center">Mercado</Link><Link to="/" search hash="journal" onClick={() => setOpen(false)} className="flex min-h-11 items-center">Aprenda</Link></nav><div className="mt-6"><SessionActions onNavigate={() => setOpen(false)} /></div>
        </SheetContent>
      </Sheet>
    </PageContainer>
    <nav aria-label="Atalhos mobile" className="fixed right-4 bottom-3 left-4 z-10 flex items-center justify-around rounded-full border border-border bg-card px-3 py-2 shadow-lg lg:hidden">
      <Button asChild variant="ghost" size="icon"><Link to="/" aria-label="Início"><Home /></Link></Button>
      <Button asChild variant="ghost" size="icon"><Link to="/" search hash="catalog" aria-label="Explorar catálogo"><Compass /></Link></Button>
      <Button asChild variant="ghost" size="icon"><Link to="/" search hash="journal" aria-label="Diário da Cunhagem"><BookOpen /></Link></Button>
      <Button disabled variant="ghost" size="icon" aria-label="Carrinho — em breve"><ShoppingCart /></Button>
      <Button disabled variant="ghost" size="icon" aria-label="Perfil — em breve"><UserRound /></Button>
    </nav>
  </header>
}
