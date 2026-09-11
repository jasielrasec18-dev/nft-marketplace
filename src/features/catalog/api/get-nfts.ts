import type { AxiosInstance } from 'axios'
import type { CatalogSearch, NFTListResponse } from '@/contracts/nft'

export async function getNfts(api: AxiosInstance, filters: CatalogSearch, signal: AbortSignal): Promise<NFTListResponse> {
  const response = await api.get<NFTListResponse>('/nfts', { params: filters, signal })
  return response.data
}
