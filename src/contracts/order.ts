import { z } from 'zod'
import type { IsoDate, ResourceId } from './common'
import type { QuoteLine, QuoteTotals } from './quote'
import type { Network } from './wallet'

export const collectorSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.'),
  email: z.email('Informe um e-mail válido.'),
})
export type Collector = z.infer<typeof collectorSchema>
export interface CreateOrderInput {
  quoteId: ResourceId
  quoteVersion: number
  walletId: ResourceId
  collector: Collector
}
export type OrderStatus = 'pending' | 'confirmed' | 'declined'
export interface OrderSnapshot extends Readonly<QuoteTotals> {
  readonly lines: readonly Readonly<QuoteLine>[]
  readonly collector: Readonly<Collector>
  readonly walletAddress: string
  readonly network: Network
  readonly couponCode: string | null
}
export interface Order {
  id: ResourceId
  userId: ResourceId
  status: OrderStatus
  snapshot: OrderSnapshot
  transactionReference: string | null
  declineReason: string | null
  createdAt: IsoDate
  updatedAt: IsoDate
  version: number
}
