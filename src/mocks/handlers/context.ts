import { delay, HttpResponse, type HttpResponseResolver } from 'msw'
import type { MockDatabaseStore } from '../db/mock-database'
import type { MockDatabase } from '../db/types'
import { getScenario } from '../scenarios/config'
import { bindRequestCookies, errorResponse, fail, cookie } from '../utils/responses'
import { settleDueOrders } from '../db/orders'
import { updateNftAvailability, updateNftPrice } from '../db/catalog'
import { currentUser } from '../db/session'
import { eth } from '@/lib/money'

export interface HandlerContext {
  store: MockDatabaseStore
  url: (path: string) => string
  timeoutDelayMs: number
  wrap: (operation: string, resolver: (db: MockDatabase, request: Request, params: Record<string, string | readonly string[] | undefined>) => Response | Promise<Response>) => HttpResponseResolver
}
export function pathParam(params: Record<string, string | readonly string[] | undefined>, name: string): string {
  const value = params[name]
  return typeof value === 'string' ? value : fail(400, 'INVALID_PATH', 'Parâmetro de rota inválido.')
}
export function createHandlerContext(store: MockDatabaseStore, baseUrl: string, timeoutDelayMs = 15000): HandlerContext {
  return {
    store, timeoutDelayMs, url: (path) => `${baseUrl.replace(/\/$/, '')}${path}`,
    wrap: (operation, resolver) => async ({ request, params, cookies }) => {
      bindRequestCookies(request, cookies)
      const generation = store.generation
      try {
        const timing = await store.transaction((db) => {
          if (generation !== store.generation) fail(409, 'MOCK_RESET', 'A simulação foi reiniciada.')
          const count = db.requestCounts[operation] ?? 0
          db.requestCounts[operation] = count + 1
          const scenario = getScenario(db.scenario)
          return { scenario, count, ms: db.latencyMs ?? scenario.delays[count % scenario.delays.length] ?? 120 }
        })
        await delay(timing.ms)
        if (generation !== store.generation) fail(409, 'MOCK_RESET', 'A simulação foi reiniciada. Repita a solicitação.')
        if (timing.scenario.failure === 'network') return HttpResponse.error()
        if (timing.scenario.failure === 'timeout') await delay(timeoutDelayMs)
        if (typeof timing.scenario.failure === 'number') {
          fail(timing.scenario.failure, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível na simulação.')
        }
        
        await store.transaction((db) => {
          if (generation !== store.generation) fail(409, 'MOCK_RESET', 'A simulação foi reiniciada.')
          settleDueOrders(db)
          const effect = getScenario(db.scenario).quoteEffect
          const trigger = operation === 'orders.create' || (operation === 'quote.create' && timing.count > 0)
          if (!effect || !trigger || db.effects.includes(effect)) return
          const user = currentUser(db, request, false)
          const cart = db.carts.find((item) => user
            ? item.owner.kind === 'user' && item.owner.id === user.id
            : item.owner.kind === 'guest' && item.owner.id === cookie(request, 'jungle_guest'))
          const item = cart?.items[0]
          if (!item) return
          if (effect === 'price') updateNftPrice(db, item.nftId, eth('1.29'))
          else updateNftAvailability(db, item.nftId, 0)
          db.effects.push(effect)
        })
        return await store.transaction((db) => {
          if (generation !== store.generation) fail(409, 'MOCK_RESET', 'A simulação foi reiniciada.')
          return resolver(db, request, params)
        })
      } catch (error) { return errorResponse(error) }
    },
  }
}
