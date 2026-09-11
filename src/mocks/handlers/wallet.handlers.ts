import { http, HttpResponse } from 'msw'
import { walletInputSchema } from '@/contracts/wallet'
import { requireUser } from '../db/session'
import { readBody, fail } from '../utils/responses'
import { nextId } from '../utils/clock'
import { pathParam, type HandlerContext } from './context'
import type { MockDatabase } from '../db/types'
import type { WalletInput } from '@/contracts/wallet'

function checkWallet(db: MockDatabase, userId: string, input: WalletInput, id?: string) {
  const others = db.wallets.filter((wallet) => wallet.userId === userId && wallet.id !== id)
  if (others.some((wallet) => wallet.role === input.role)) fail(409, 'WALLET_ROLE_CONFLICT', 'Já existe uma carteira com esta função.')
  if (others.some((wallet) => wallet.address.toLowerCase() === input.address.toLowerCase() && wallet.network === input.network)) {
    fail(409, 'WALLET_ALREADY_EXISTS', 'Esta carteira já está cadastrada.')
  }
}
export function walletHandlers(ctx: HandlerContext) {
  return [
    http.get(ctx.url('/wallets'), ctx.wrap('wallets.get', (db, request) => {
      const user = requireUser(db, request)
      return HttpResponse.json(db.wallets.filter((wallet) => wallet.userId === user.id))
    })),
    http.post(ctx.url('/wallets'), ctx.wrap('wallets.create', async (db, request) => {
      const user = requireUser(db, request)
      const input = await readBody(request, walletInputSchema.strict())
      checkWallet(db, user.id, input)
      const wallet = { ...input, id: nextId(db, 'wallet'), userId: user.id }
      db.wallets.push(wallet)
      return HttpResponse.json(wallet, { status: 201 })
    })),
    http.patch(ctx.url('/wallets/:id'), ctx.wrap('wallets.update', async (db, request, params) => {
      const user = requireUser(db, request)
      const wallet = db.wallets.find((item) => item.id === pathParam(params, 'id') && item.userId === user.id)
        ?? fail(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
      const patch = await readBody(request, walletInputSchema.partial().strict().refine((value) => Object.keys(value).length > 0, 'Informe um campo.'))
      const input = walletInputSchema.parse({ ...wallet, ...patch })
      checkWallet(db, user.id, input, wallet.id)
      Object.assign(wallet, input)
      return HttpResponse.json(wallet)
    })),
  ]
}
