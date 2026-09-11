import { z } from 'zod'

export const scenarioIds = [
  'default', 'empty', 'slow-network', 'variable-latency', 'network-error',
  'server-error', 'service-unavailable', 'request-timeout', 'session-expired',
  'unauthorized', 'register-conflict', 'invalid-coupon', 'expired-coupon',
  'price-changed', 'sold-out', 'order-timeout', 'payment-confirmed', 'payment-declined',
] as const
export const scenarioIdSchema = z.enum(scenarioIds)
export type ScenarioId = z.infer<typeof scenarioIdSchema>
export const resetMockSchema = z.object({
  scenario: scenarioIdSchema.default('default'),
  now: z.iso.datetime().optional(),
  latencyMs: z.number().int().min(0).max(10000).optional(),
})
export type ResetMockInput = z.input<typeof resetMockSchema>
