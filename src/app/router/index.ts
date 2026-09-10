import { createRootRouteWithContext, createRoute, createRouter, type SearchSchemaInput } from '@tanstack/react-router'
import type { AppServices } from '@/app/services'
import { catalogSearchSchema } from '@/contracts/nft'
import { AppLayout } from '@/components/layout/app-layout'
import { RouteError } from '@/components/feedback/route-error'
import { HomePage } from '@/routes/home-page'
import { NotFoundPage } from '@/routes/not-found-page'

const rootRoute = createRootRouteWithContext<AppServices>()({
  component: AppLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteError,
})
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => catalogSearchSchema.parse(search),
  component: HomePage,
})
const routeTree = rootRoute.addChildren([homeRoute])

export function createAppRouter(services: AppServices) {
  return createRouter({
    routeTree,
    context: services,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register { router: ReturnType<typeof createAppRouter> }
}
