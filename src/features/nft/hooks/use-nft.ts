import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/app/providers/services-context'
import { nftKeys } from '@/app/query/keys'
import { getNft } from '../api/get-nft'

export function useNft(id: string) {
  const { api } = useServices()
  return useQuery({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => getNft(api, id, signal),
  })
}
