import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { resetMockSchema, scenarioIdSchema } from '@/contracts/mock-control'
import { nftUpdateSchema } from '@/contracts/requests'
import { errorResponse, readBody, sessionCookie } from '../utils/responses'
import { updateNftAvailability, updateNftPrice } from '../db/catalog'
import { settleDueOrders, transitionOrder } from '../db/orders'
import { expiresIn, isoNow } from '../utils/clock'
import { pathParam, type HandlerContext } from './context'

export function controlHandlers(ctx: HandlerContext) {
  return [
    http.post(ctx.url('/__mock/reset'), async ({ request }) => {
      try {
        const input = await readBody(request, resetMockSchema.strict())
        await ctx.store.reset(input)
        const headers = new Headers()
        headers.append('Set-Cookie', sessionCookie(''))
        headers.append('Set-Cookie', 'jungle_guest=; Path=/; SameSite=Lax; Max-Age=0')
        return HttpResponse.json({ scenario: input.scenario, reset: true }, { headers })
      } catch (error) { return errorResponse(error) }
    }),
    http.get(ctx.url('/__mock/state'), () => {
      const db = ctx.store.read()
      // Only diagnostics: never expose credential hashes, sessions or private payloads.
      return HttpResponse.json({
        scenario: db.scenario, now: isoNow(db), latencyMs: db.latencyMs,
        counts: { users: db.users.length, nfts: db.nfts.length, orders: db.orders.length, quotes: db.quotes.length },
      })
    }),
    http.patch(ctx.url('/__mock/scenario'), async ({ request }) => {
      try {
        const input = await readBody(request, z.object({ scenario: scenarioIdSchema, latencyMs: z.number().int().min(0).max(10000).nullable().optional() }).strict())
        await ctx.store.transaction((db) => {
          db.scenario = input.scenario
          db.effects = []
          db.requestCounts = {}
          if (input.latencyMs !== undefined) db.latencyMs = input.latencyMs
          if (input.scenario === 'session-expired') {
            for (const session of db.sessions) session.expiresAt = expiresIn(db, 1000)
          }
        })
        return HttpResponse.json({ scenario: input.scenario })
      } catch (error) { return errorResponse(error) }
    }),
    http.post(ctx.url('/__mock/clock/advance'), async ({ request }) => {
      try {
        const input = await readBody(request, z.object({ milliseconds: z.number().int().min(0).max(365 * 24 * 3600000) }).strict())
        const timestamp = await ctx.store.transaction((db) => {
          db.clock.offsetMs += input.milliseconds
          settleDueOrders(db)
          return isoNow(db)
        })
        return HttpResponse.json({ now: timestamp })
      } catch (error) { return errorResponse(error) }
    }),
    http.patch(ctx.url('/__mock/nfts/:id'), async ({ request, params }) => {
      try {
        const input = await readBody(request, nftUpdateSchema)
        const nft = await ctx.store.transaction((db) => {
          const id = pathParam(params, 'id')
          if (input.priceEth !== undefined) updateNftPrice(db, id, input.priceEth)
          if (input.availableQuantity !== undefined) updateNftAvailability(db, id, input.availableQuantity, input.editionId)
          return db.nfts.find((item) => item.id === id)
        })
        return HttpResponse.json(nft)
      } catch (error) { return errorResponse(error) }
    }),
    http.post(ctx.url('/__mock/orders/:id/settle'), async ({ request, params }) => {
      try {
        const input = await readBody(request, z.object({ status: z.enum(['confirmed', 'declined']) }).strict())
        const order = await ctx.store.transaction((db) => transitionOrder(db, pathParam(params, 'id'), input.status))
        return HttpResponse.json(order)
      } catch (error) { return errorResponse(error) }
    }),
  ]
}
