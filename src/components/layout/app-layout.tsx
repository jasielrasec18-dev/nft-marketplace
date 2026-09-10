import { Link, Outlet } from '@tanstack/react-router'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:p-4 focus:text-primary-foreground">Pular para o conteúdo</a>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
          <Link to="/" className="text-lg font-semibold tracking-tight">Jungle <span className="text-primary">NFT</span></Link>
          <span className="text-sm text-muted-foreground">Ambiente de demonstração</span>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-20">
        <Outlet />
      </main>
      <footer className="border-t border-border px-5 py-6 text-center text-sm text-muted-foreground">Jungle Gaming · Frontend Challenge</footer>
    </div>
  )
}
