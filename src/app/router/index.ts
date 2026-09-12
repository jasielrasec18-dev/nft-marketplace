import { createRootRouteWithContext, createRoute, createRouter, lazyRouteComponent, type SearchSchemaInput } from '@tanstack/react-router'
import type { AppServices } from '@/app/services'
import { catalogSearchSchema } from '@/contracts/nft'
import { authSearchSchema, safeReturnTo } from '@/features/auth/redirect'
import { requireSession } from '@/features/auth/require-session'
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
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: lazyRouteComponent(() => import('@/routes/cart-page'), 'CartPage'),
})
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: ({ context, location }) => requireSession(context, location.href),
  component: lazyRouteComponent(() => import('@/routes/checkout-page'), 'CheckoutPage'),
})
const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  beforeLoad: async ({ context, location }) => { await requireSession(context, location.href) },
  component: lazyRouteComponent(() => import('@/routes/order-page'), 'OrderPage'),
})
const developmentRoutes = import.meta.env.DEV ? [createRoute({
  getParentRoute: () => rootRoute,
  path: '/design-system',
  component: lazyRouteComponent(() => import('@/routes/design-system-page'), 'DesignSystemPage'),
})] : []
const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  beforeLoad: async ({ context, location }) => { await requireSession(context, location.href) },
  component: lazyRouteComponent(() => import('@/routes/account/account-layout'), 'AccountLayout'),
})
const profileRoute = createRoute({ getParentRoute: () => accountRoute, path: '/profile', component: lazyRouteComponent(() => import('@/routes/account/profile-page'), 'ProfilePage') })
const walletsRoute = createRoute({ getParentRoute: () => accountRoute, path: '/wallets', component: lazyRouteComponent(() => import('@/routes/account/wallets-page'), 'WalletsPage') })
const routeTree = rootRoute.addChildren([homeRoute, nftRoute, loginRoute, registerRoute, cartRoute, checkoutRoute, orderRoute, accountRoute.addChildren([profileRoute, walletsRoute]), ...developmentRoutes])

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
