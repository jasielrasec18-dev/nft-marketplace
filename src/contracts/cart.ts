import type { ResourceId } from './common'
import type { NFT } from './nft'

export type CartOwner = { kind: 'guest'; id: string } | { kind: 'user'; id: ResourceId }

export interface CartItemInput {
  nftId: ResourceId
  editionId: ResourceId
  quantity: number
}

export interface CartItem extends CartItemInput {
  id: ResourceId
  nft: NFT
}

export interface Cart {
  id: ResourceId
  owner: CartOwner
  items: CartItem[]
  couponCode: string | null
  version: number
}
