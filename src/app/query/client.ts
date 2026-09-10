import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/errors'

export function shouldRetryQuery(failureCount: number, error: Error) {
  if (axios.isCancel(error) || failureCount >= 2) return false
  return error instanceof ApiError && (
    error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' ||
    (error.status !== undefined && error.status >= 500)
  )
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetryQuery,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  })
}
