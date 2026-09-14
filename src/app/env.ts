import { z } from 'zod'
import { scenarioIdSchema } from '@/contracts/mock-control'

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return '/api'
      const trimmed = val.trim()
      return trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed) ? trimmed : `/${trimmed}`
    })
    .default('/api'),
  VITE_API_TIMEOUT_MS: z
    .unknown()
    .transform((val) => {
      const num = Number(val)
      return Number.isFinite(num) && num > 0 ? Math.floor(num) : 10000
    })
    .default(10000),
  VITE_MOCK_ENABLED: z
    .unknown()
    .transform((val) => {
      const str = String(val ?? '').toLowerCase().trim()
      return str === 'true' || str === '1' || str === 'yes' ? 'true' : 'false'
    })
    .default('false'),
  VITE_MOCK_SCENARIO: scenarioIdSchema.catch('default').default('default'),
  VITE_SOCKET_URL: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return 'https://socket.jungle.test'
      const trimmed = val.trim()
      try {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
        return url.href.replace(/\/$/, '')
      } catch {
        return 'https://socket.jungle.test'
      }
    })
    .default('https://socket.jungle.test'),
})

const result = envSchema.safeParse(import.meta.env)
const parsed = result.success
  ? result.data
  : {
      VITE_API_BASE_URL: '/api',
      VITE_API_TIMEOUT_MS: 10000,
      VITE_MOCK_ENABLED: 'true',
      VITE_MOCK_SCENARIO: 'default' as const,
      VITE_SOCKET_URL: 'https://socket.jungle.test',
    }

export const env = {
  apiBaseUrl: parsed.VITE_API_BASE_URL,
  apiTimeoutMs: parsed.VITE_API_TIMEOUT_MS,
  mocksEnabled: parsed.VITE_MOCK_ENABLED === 'true' || import.meta.env.VITE_MOCK_ENABLED === 'true' || import.meta.env.MODE === 'mock',
  mockScenario: parsed.VITE_MOCK_SCENARIO,
  socketUrl: parsed.VITE_SOCKET_URL,
}
