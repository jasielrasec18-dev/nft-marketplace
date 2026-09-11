import type { AxiosInstance } from 'axios'
import type { NFT } from '@/contracts/nft'

export async function getNft(api: AxiosInstance, id: string, signal: AbortSignal): Promise<NFT> {
  return (await api.get<NFT>(`/nfts/${encodeURIComponent(id)}`, { signal })).data
}
