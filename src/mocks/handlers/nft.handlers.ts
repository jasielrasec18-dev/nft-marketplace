import { http, HttpResponse } from 'msw'
import { catalogSearchSchema } from '@/contracts/nft'
import type { NFT } from '@/contracts/nft'
import type { Paginated } from '@/contracts/common'
import { compareEth } from '@/lib/money'
import { findNft } from '../db/catalog'
import { getScenario } from '../scenarios/config'
import { fail } from '../utils/responses'
import { pathParam, type HandlerContext } from './context'

export function nftHandlers(ctx: HandlerContext) {
  return [
    http.get(ctx.url('/nfts'), ctx.wrap('nfts.list', (db, request) => {
      const search = catalogSearchSchema.parse(Object.fromEntries(new URL(request.url).searchParams))
      if (search.priceMin && search.priceMax && compareEth(search.priceMin, search.priceMax) > 0) {
        fail(422, 'INVALID_PRICE_RANGE', 'O preço mínimo deve ser menor ou igual ao máximo.')
      }
      let items = getScenario(db.scenario).emptyCatalog ? [] : db.nfts.filter((nft) =>
        (!search.q || `${nft.name} ${nft.description}`.toLowerCase().includes(search.q.toLowerCase())) &&
        (!search.collection || nft.collection === search.collection) &&
        (!search.priceMin || compareEth(nft.priceEth, search.priceMin) >= 0) &&
        (!search.priceMax || compareEth(nft.priceEth, search.priceMax) <= 0))
      items = [...items].sort((left, right) => {
        const tie = left.id.localeCompare(right.id, 'en')
        if (search.sort === 'price-asc') return compareEth(left.priceEth, right.priceEth) || tie
        if (search.sort === 'price-desc') return compareEth(right.priceEth, left.priceEth) || tie
        if (search.sort === 'name') return left.name.localeCompare(right.name, 'en') || tie
        return right.createdAt.localeCompare(left.createdAt) || tie
      })
      const pageSize = 8
      return HttpResponse.json<Paginated<NFT>>({
        items: items.slice((search.page - 1) * pageSize, search.page * pageSize),
        page: search.page, pageSize, total: items.length,
      })
    })),
    http.get(ctx.url('/nfts/:id'), ctx.wrap('nfts.detail', (db, _request, params) =>
      HttpResponse.json(findNft(db, pathParam(params, 'id'))))),
  ]
}
