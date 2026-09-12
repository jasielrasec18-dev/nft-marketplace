import type { AxiosInstance } from 'axios'
import type { LoginInput, RegisterInput, Session } from '@/contracts/auth'
import { ApiError } from '@/api/errors'

export async function getSession(api: AxiosInstance, signal: AbortSignal): Promise<Session> {
  try { return (await api.get<Session>('/auth/session', { signal })).data }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
export async function login(api: AxiosInstance, input: LoginInput): Promise<Session> {
  return (await api.post<Session>('/auth/login', input)).data
}
export async function register(api: AxiosInstance, input: RegisterInput): Promise<Session> {
  return (await api.post<Session>('/auth/register', input)).data
}
export async function logout(api: AxiosInstance): Promise<void> {
  await api.post('/auth/logout')
}
