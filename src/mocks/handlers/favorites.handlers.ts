import { http, HttpResponse } from 'msw'
import type { Favorites } from '@/contracts/favorites'
import { requireUser } from '../db/session'
import { findNft } from '../db/catalog'
import { pathParam, type HandlerContext } from './context'

export function favoritesHandlers(ctx: HandlerContext) {
  return [
    http.get(ctx.url('/favorites'), ctx.wrap('favorites.get', (db, request) => {
      const user = requireUser(db, request)
      return HttpResponse.json<Favorites>({ userId: user.id, nftIds: db.favorites[user.id] ?? [] })
    })),
    http.post(ctx.url('/favorites/:nftId'), ctx.wrap('favorites.add', (db, request, params) => {
      const user = requireUser(db, request)
      const nft = findNft(db, pathParam(params, 'nftId'))
      const favorites = db.favorites[user.id] ?? []
      if (!favorites.includes(nft.id)) favorites.push(nft.id)
      db.favorites[user.id] = favorites
      return HttpResponse.json<Favorites>({ userId: user.id, nftIds: favorites })
    })),
    http.delete(ctx.url('/favorites/:nftId'), ctx.wrap('favorites.remove', (db, request, params) => {
      const user = requireUser(db, request)
      const nft = findNft(db, pathParam(params, 'nftId'))
      db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== nft.id)
      return new HttpResponse(null, { status: 204 })
    })),
  ]
}
