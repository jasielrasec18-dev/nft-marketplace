import axios from 'axios'
import { apiErrorBodySchema } from '@/contracts/common'
import type { ApiErrorBody } from '@/contracts/common'

export class ApiError extends Error {
  readonly status: number | undefined
  readonly code: string
  readonly fieldErrors: ApiErrorBody['fieldErrors']

  constructor(message: string, options: { status?: number; code: string; fieldErrors?: ApiErrorBody['fieldErrors'] }) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.fieldErrors = options.fieldErrors
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError<unknown>(error)) {
    const body = apiErrorBodySchema.safeParse(error.response?.data)
    const status = error.response?.status
    if (body.success) return new ApiError(body.data.message, { ...body.data, status })
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('O servidor demorou para responder. Tente novamente.', { code: 'TIMEOUT' })
    }
    if (status === 401) return new ApiError('Sua sessão expirou. Entre novamente.', { status, code: 'UNAUTHORIZED' })
    if (!error.response) return new ApiError('Não foi possível conectar. Verifique sua conexão.', { code: 'NETWORK_ERROR' })
    return new ApiError('Não foi possível concluir a solicitação.', { status, code: 'HTTP_ERROR' })
  }
  return new ApiError('Ocorreu um erro inesperado. Tente novamente.', { code: 'UNKNOWN_ERROR' })
}
