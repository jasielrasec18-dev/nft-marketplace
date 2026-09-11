import { createRootRouteWithContext, createRoute, createRouter, lazyRouteComponent, type SearchSchemaInput } from '@tanstack/react-router'
import type { AppServices } from '@/app/services'
import { catalogSearchSchema } from '@/contracts/nft'
import { AppLayout } from '@/components/layout/app-layout'
import { RouteError } from '@/components/feedback/route-error'
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
  component: lazyRouteComponent(() => import('@/routes/home-page'), 'HomePage'),
})
const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => catalogSearchSchema.parse(search),
  component: lazyRouteComponent(() => import('@/routes/nft-detail-page'), 'NFTDetailPage'),
})
const developmentRoutes = import.meta.env.DEV ? [createRoute({
  getParentRoute: () => rootRoute,
  path: '/design-system',
  component: lazyRouteComponent(() => import('@/routes/design-system-page'), 'DesignSystemPage'),
})] : []
const routeTree = rootRoute.addChildren([homeRoute, nftRoute, ...developmentRoutes])

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
