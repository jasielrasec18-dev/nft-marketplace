import { createRootRouteWithContext, createRoute, createRouter, lazyRouteComponent, type SearchSchemaInput } from '@tanstack/react-router'
import type { AppServices } from '@/app/services'
import { catalogSearchSchema } from '@/contracts/nft'
import { authSearchSchema, safeReturnTo } from '@/features/auth/redirect'
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
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => authSearchSchema.parse(search),
  component: lazyRouteComponent(() => import('@/routes/auth-page'), 'LoginPage'),
})
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => authSearchSchema.parse(search),
  component: lazyRouteComponent(() => import('@/routes/auth-page'), 'RegisterPage'),
})
const developmentRoutes = import.meta.env.DEV ? [createRoute({
  getParentRoute: () => rootRoute,
  path: '/design-system',
  component: lazyRouteComponent(() => import('@/routes/design-system-page'), 'DesignSystemPage'),
})] : []
const routeTree = rootRoute.addChildren([homeRoute, nftRoute, loginRoute, registerRoute, ...developmentRoutes])

export function createAppRouter(services: AppServices) {
  const router = createRouter({
    routeTree,
    context: services,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
  services.sessionLifecycle.onExpired(() => {
    const location = router.state.location
    if (location.pathname === '/login' || location.pathname === '/register') return
    void router.navigate({ to: '/login', search: { redirect: safeReturnTo(location.href), reason: 'expired' }, replace: true })
  })
  return router
}

declare module '@tanstack/react-router' {
  interface Register { router: ReturnType<typeof createAppRouter> }
}
