import { catalogSearchSchema, type CatalogSearch } from '@/contracts/nft'
import { ethAmountSchema } from '@/contracts/common'
import { compareEth } from '@/lib/money'

export const defaultCatalogSearch = catalogSearchSchema.parse({})
export type CatalogChange = (patch: Partial<CatalogSearch>) => void

export function parsePriceRange(min: string, max: string) {
  const low = min.trim() ? ethAmountSchema.safeParse(min.trim()) : undefined
  const high = max.trim() ? ethAmountSchema.safeParse(max.trim()) : undefined
  if (low && !low.success || high && !high.success) {
    return { error: 'Use valores ETH não negativos, com ponto e até 18 casas decimais.' } as const
  }
  const priceMin = low?.data
  const priceMax = high?.data
  if (priceMin && priceMax && compareEth(priceMin, priceMax) > 0) {
    return { error: 'O preço mínimo deve ser menor ou igual ao máximo.' } as const
  }
  return { priceMin, priceMax } as const
}
