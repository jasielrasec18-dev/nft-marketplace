import type { ScenarioId } from '@/contracts/mock-control'

export interface MockScenario {
  delays: readonly number[]
  failure?: 'network' | 500 | 503 | 'timeout'
  emptyCatalog?: boolean
  sessionLifetimeMs: number
  unauthorized?: boolean
  registerConflict?: boolean
  couponError?: 'INVALID_COUPON' | 'EXPIRED_COUPON'
  quoteEffect?: 'price' | 'stock'
  orderTimeout?: boolean
  payment: 'confirmed' | 'declined'
  paymentDelayMs: number
}

const normal: MockScenario = {
  delays: [120], sessionLifetimeMs: 60 * 60 * 1000,
  payment: 'confirmed', paymentDelayMs: 2500,
}
const overrides: Record<ScenarioId, Partial<MockScenario>> = {
  default: {},
  empty: { emptyCatalog: true },
  'slow-network': { delays: [1200] },
  'variable-latency': { delays: [1200, 200] },
  'network-error': { failure: 'network' },
  'server-error': { failure: 500 },
  'service-unavailable': { failure: 503 },
  'request-timeout': { failure: 'timeout' },
  'session-expired': { sessionLifetimeMs: 1000 },
  unauthorized: { unauthorized: true },
  'register-conflict': { registerConflict: true },
  'invalid-coupon': { couponError: 'INVALID_COUPON' },
  'expired-coupon': { couponError: 'EXPIRED_COUPON' },
  'price-changed': { quoteEffect: 'price' },
  'sold-out': { quoteEffect: 'stock' },
  'order-timeout': { orderTimeout: true },
  'payment-confirmed': { payment: 'confirmed' },
  'payment-declined': { payment: 'declined' },
}
export function getScenario(id: ScenarioId): MockScenario { return { ...normal, ...overrides[id] } }
