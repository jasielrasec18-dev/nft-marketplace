import { z } from 'zod'
import { createOrderInputSchema } from '@/contracts/requests'
import type { CreateOrderInput } from '@/contracts/order'
const intentSchema = z.object({ userId: z.string(), key: z.string().uuid(), input: createOrderInputSchema, orderId: z.string().optional() })
export type PurchaseIntent = z.infer<typeof intentSchema>
const storageKey = (userId: string) => 'jungle.purchase-intent.' + userId
export function readIntent(userId: string): PurchaseIntent | undefined {
  try { const value = intentSchema.safeParse(JSON.parse(sessionStorage.getItem(storageKey(userId)) ?? 'null')); return value.success && value.data.userId === userId ? value.data : undefined }
  catch { return undefined }
}
export function saveIntent(intent: PurchaseIntent) { sessionStorage.setItem(storageKey(intent.userId), JSON.stringify(intent)) }
export function newIntent(userId: string, input: CreateOrderInput): PurchaseIntent {
  const intent = { userId, input, key: crypto.randomUUID() }
  saveIntent(intent)
  return intent
}
export function clearIntent(userId: string, orderId?: string) {
  const intent = readIntent(userId)
  if (!orderId || intent?.orderId === orderId) sessionStorage.removeItem(storageKey(userId))
}
