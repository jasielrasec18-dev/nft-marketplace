import axios from 'axios'
import { normalizeApiError } from './errors'

export function createApiClient(options: { baseURL: string; timeoutMs: number }, onUnauthorized?: () => void) {
  const client = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeoutMs,
    withCredentials: true,
    headers: { Accept: 'application/json' },
  })

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      // Preserve Axios cancellation so aborted requests never become UI failures.
      if (axios.isCancel(error)) return Promise.reject(error)
      const normalized = normalizeApiError(error)
      if (normalized.status === 401) onUnauthorized?.()
      return Promise.reject(normalized)
    },
  )
  return client
}
