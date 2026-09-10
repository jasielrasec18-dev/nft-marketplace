import type { EthAmount, IsoDate, ResourceId } from './common'
import type { Network } from './wallet'

export interface QuoteInput {
  cartId: ResourceId
  cartVersion: number
  couponCode: string | null
  network: Network
}
export interface QuoteLine {
  nftId: ResourceId
  editionId: ResourceId
  name: string
  editionName: string
  imageUrl: string
  quantity: number
  unitPriceEth: EthAmount
  subtotalEth: EthAmount
  nftVersion: number
}
export interface QuoteTotals {
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
}
export interface Quote extends QuoteTotals {
  id: ResourceId
  cartId: ResourceId
  cartVersion: number
  lines: QuoteLine[]
  network: Network
  couponCode: string | null
  expiresAt: IsoDate
  version: number
}
