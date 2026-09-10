import type { CartOwner } from '@/contracts/cart'
import type { CatalogSearch } from '@/contracts/nft'
import type { QuoteInput } from '@/contracts/quote'

export const sessionKeys = { all: ['session'] as const }
export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => ['nfts', 'list'] as const,
  list: (filters: CatalogSearch) => ['nfts', 'list', filters] as const,
  detail: (id: string) => ['nfts', 'detail', id] as const,
}
export const privateKeys = {
  all: ['private'] as const,
  user: (userId: string) => ['private', userId] as const,
  favorites: (userId: string) => ['private', userId, 'favorites'] as const,
  profile: (userId: string) => ['private', userId, 'profile'] as const,
  wallets: (userId: string) => ['private', userId, 'wallets'] as const,
  orders: (userId: string) => ['private', userId, 'orders'] as const,
  order: (userId: string, orderId: string) => ['private', userId, 'orders', orderId] as const,
}
export const cartKeys = {
  detail: (owner: CartOwner) => owner.kind === 'user'
    ? [...privateKeys.user(owner.id), 'cart'] as const
    : ['guest', owner.id, 'cart'] as const,
}
export const quoteKeys = {
  all: (userId: string) => [...privateKeys.user(userId), 'quotes'] as const,
  detail: (userId: string, input: QuoteInput) => [...privateKeys.user(userId), 'quotes', input] as const,
}
