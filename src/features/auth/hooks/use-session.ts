import { useIsMutating, useQuery } from '@tanstack/react-query'
import { useServices } from '@/app/providers/services-context'
import { sessionKeys } from '@/app/query/keys'
import { sessionOptions } from '../session-query'

export function useSession() {
  const services = useServices()
  const changing = useIsMutating({ mutationKey: sessionKeys.mutations }) > 0
  return useQuery({ ...sessionOptions(services), enabled: !changing })
}
