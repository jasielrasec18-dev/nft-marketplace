import { Outlet } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { PageContainer } from '@/components/layout/page-container'

export function AppLayout() {
  return <div className="flex min-h-svh flex-col">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-skip focus:bg-primary focus:p-4 focus:text-primary-foreground">Pular para o conteúdo</a>
    <AppHeader />
    <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 py-10 sm:py-16"><PageContainer><Outlet /></PageContainer></main>
    <AppFooter />
  </div>
}
