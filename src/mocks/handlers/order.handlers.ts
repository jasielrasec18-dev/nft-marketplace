import { delay, http, HttpResponse } from 'msw'
import { createOrderInputSchema } from '@/contracts/requests'
import { createOrder } from '../db/orders'
import { requireUser } from '../db/session'
import { readBody, fail } from '../utils/responses'
import { getScenario } from '../scenarios/config'
import { pathParam, type HandlerContext } from './context'

export function orderHandlers(ctx: HandlerContext) {
  const create = ctx.wrap('orders.create', async (db, request) => {
    const user = requireUser(db, request)
    const input = await readBody(request, createOrderInputSchema)
    const result = createOrder(db, user.id, input, request.headers.get('Idempotency-Key') ?? '')
    return HttpResponse.json(result.order, {
      status: result.created ? 201 : 200,
      headers: result.created && getScenario(db.scenario).orderTimeout ? { 'X-Mock-Delay-After-Commit': 'true' } : undefined,
    })
  })
  return [
    http.post(ctx.url('/orders'), async (info) => {
      const response = await create(info)
    
      if (response instanceof Response && response.headers.get('X-Mock-Delay-After-Commit')) {
        response.headers.delete('X-Mock-Delay-After-Commit')
        await delay(ctx.timeoutDelayMs)
      }
      return response
    }),
    http.get(ctx.url('/orders/:id'), ctx.wrap('orders.get', (db, request, params) => {
      const user = requireUser(db, request)
      const order = db.orders.find((item) => item.id === pathParam(params, 'id') && item.userId === user.id)
        ?? fail(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
      return HttpResponse.json(order)
    })),
  ]
}
