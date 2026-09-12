import type { AxiosInstance } from 'axios'
import type { Order, CreateOrderInput } from '@/contracts/order'
export const getOrder = async (api: AxiosInstance, id: string, signal?: AbortSignal) => (await api.get<Order>('/orders/' + encodeURIComponent(id), { signal })).data
export const createOrder = async (api: AxiosInstance, input: CreateOrderInput, key: string) => (await api.post<Order>('/orders', input, { headers: { 'Idempotency-Key': key } })).data
