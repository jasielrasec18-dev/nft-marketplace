import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().startsWith('/').default('/api'),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  VITE_MOCK_ENABLED: z.enum(['true', 'false']).default('false'),
  VITE_MOCK_SCENARIO: z.literal('default').default('default'),
  VITE_SOCKET_URL: z.url().default('http://localhost:3001'),
})

const parsed = envSchema.parse(import.meta.env)
export const env = {
  apiBaseUrl: parsed.VITE_API_BASE_URL,
  apiTimeoutMs: parsed.VITE_API_TIMEOUT_MS,
  mocksEnabled: parsed.VITE_MOCK_ENABLED === 'true',
  mockScenario: parsed.VITE_MOCK_SCENARIO,
  socketUrl: parsed.VITE_SOCKET_URL,
}
