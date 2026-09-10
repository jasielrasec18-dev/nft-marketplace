import type { EthAmount, IsoDate, ResourceId } from './common'
import type { NFTEdition } from './nft'
import type { OrderStatus } from './order'

export interface ResourceEvent {
  eventId: string
  version: number
  occurredAt: IsoDate
}
export interface NFTUpdatedEvent extends ResourceEvent {
  nftId: ResourceId
  priceEth: EthAmount
  availableQuantity: number
  editions: NFTEdition[]
}
export interface OrderUpdatedEvent extends ResourceEvent {
  orderId: ResourceId
  userId: ResourceId
  status: OrderStatus
}
export interface ServerToClientEvents {
  'nft.updated': (event: NFTUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
}
export interface ClientToServerEvents {
  'order.subscribe': (payload: { orderId: ResourceId }) => void
  'order.unsubscribe': (payload: { orderId: ResourceId }) => void
}
