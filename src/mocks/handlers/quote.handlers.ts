import { http, HttpResponse } from 'msw'
import { quoteInputSchema } from '@/contracts/requests'
import { requireUser } from '../db/session'
import { createQuote } from '../db/quote'
import { readBody } from '../utils/responses'
import type { HandlerContext } from './context'

export function quoteHandlers(ctx: HandlerContext) {
  return [
    http.post(ctx.url('/quote'), ctx.wrap('quote.create', async (db, request) => {
      const user = requireUser(db, request)
      return HttpResponse.json(createQuote(db, user.id, await readBody(request, quoteInputSchema)), { status: 201 })
    })),
  ]
}
