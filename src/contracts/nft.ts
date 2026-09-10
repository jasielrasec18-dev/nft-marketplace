import { z } from 'zod'
import { ethAmountSchema } from './common'
import type { EthAmount, ResourceId } from './common'

export interface NFTEdition {
  id: ResourceId
  name: string
  availableQuantity: number
}

export interface NFT {
  id: ResourceId
  name: string
  description: string
  collection: string
  imageUrl: string
  gallery: string[]
  priceEth: EthAmount
  editions: NFTEdition[]
  availableQuantity: number
  version: number
}

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(100).catch(''),
  collection: z.string().trim().max(100).catch(''),
  priceMin: ethAmountSchema.optional().catch(undefined),
  priceMax: ethAmountSchema.optional().catch(undefined),
  sort: z.enum(['recent', 'price-asc', 'price-desc', 'name']).catch('recent'),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
})
export type CatalogSearch = z.infer<typeof catalogSearchSchema>
