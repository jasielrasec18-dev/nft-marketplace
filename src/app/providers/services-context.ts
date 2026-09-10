import { createContext, useContext } from 'react'
import type { AppServices } from '@/app/services'

export const ServicesContext = createContext<AppServices | null>(null)
export function useServices() {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices precisa de AppProviders.')
  return services
}
