import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { AppServices } from '@/app/services'
import { ServicesContext } from './services-context'

export function AppProviders({ services, children }: PropsWithChildren<{ services: AppServices }>) {
  return (
    <ServicesContext value={services}>
      <QueryClientProvider client={services.queryClient}>{children}</QueryClientProvider>
    </ServicesContext>
  )
}
