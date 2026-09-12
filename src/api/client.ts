import axios, { CanceledError, type InternalAxiosRequestConfig } from 'axios'
import { normalizeApiError, type ApiError } from './errors'

export function createApiClient(
  options: { baseURL: string; timeoutMs: number; sessionVersion?: () => number },
  onUnauthorized?: (error: ApiError, version: number) => void,
) {
  const client = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeoutMs,
    withCredentials: true,
    headers: { Accept: 'application/json' },
  })
  const versions = new WeakMap<InternalAxiosRequestConfig, number>()
  client.interceptors.request.use((config) => {
    versions.set(config, options.sessionVersion?.() ?? 0)
    return config
  })
  client.interceptors.response.use(
    (response) => {
      const path = response.config.url ?? ''
      const privateResponse = /^\/(auth\/session|favorites|cart|profile|wallets|orders|quote)(?:\/|$)/.test(path)
      if (privateResponse && options.sessionVersion && versions.get(response.config) !== options.sessionVersion()) {
        throw new CanceledError('Session changed')
      }
      return response
    },
    (error: unknown) => {
      if (axios.isCancel(error)) return Promise.reject(error)
      const normalized = normalizeApiError(error)
      const config = axios.isAxiosError(error) ? error.config : undefined
      if (config && options.sessionVersion && versions.get(config) !== options.sessionVersion()) return Promise.reject(new CanceledError('Session changed'))
      const credentialRequest = /^\/auth\/(login|register)$/.test(config?.url ?? '')
      if (normalized.status === 401 && !credentialRequest) onUnauthorized?.(normalized, config ? versions.get(config) ?? 0 : 0)
      return Promise.reject(normalized)
    },
  )
  return client
}
