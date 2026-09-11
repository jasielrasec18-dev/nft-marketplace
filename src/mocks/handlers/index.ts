import { createHandlerContext } from './context'
import type { MockDatabaseStore } from '../db/mock-database'
import { authHandlers } from './auth.handlers'
import { nftHandlers } from './nft.handlers'
import { favoritesHandlers } from './favorites.handlers'
import { cartHandlers } from './cart.handlers'
import { quoteHandlers } from './quote.handlers'
import { orderHandlers } from './order.handlers'
import { profileHandlers } from './profile.handlers'
import { walletHandlers } from './wallet.handlers'
import { controlHandlers } from './control.handlers'

export function createHandlers(store: MockDatabaseStore, baseUrl = '/api', timeoutDelayMs = 15000) {
  const context = createHandlerContext(store, baseUrl, timeoutDelayMs)
  return [
    ...controlHandlers(context), ...authHandlers(context), ...nftHandlers(context),
    ...favoritesHandlers(context), ...cartHandlers(context), ...quoteHandlers(context),
    ...orderHandlers(context), ...profileHandlers(context), ...walletHandlers(context),
  ]
}
