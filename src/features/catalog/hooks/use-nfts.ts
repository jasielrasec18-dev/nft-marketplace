import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/app/providers/services-context'
import { nftKeys } from '@/app/query/keys'
import type { CatalogSearch } from '@/contracts/nft'
import { getNfts } from '../api/get-nfts'

export function useNfts(filters: CatalogSearch) {
  const { api } = useServices()
  return useQuery({
    queryKey: nftKeys.list(filters),
    queryFn: ({ signal }) => getNfts(api, filters, signal),
  })
}
