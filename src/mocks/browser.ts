import { setupWorker } from 'msw/browser'
import { env } from '@/app/env'
import { createHandlers } from './handlers'
import { createMockDatabase } from './db/mock-database'

export async function startMockWorker() {
  const store = await createMockDatabase(localStorage, { scenario: env.mockScenario })
  const worker = setupWorker(...createHandlers(store, env.apiBaseUrl, env.apiTimeoutMs + 5000))
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest(request, print) {
      const apiPath = new URL(env.apiBaseUrl, window.location.origin).pathname.replace(/\/$/, '')
      const requestPath = new URL(request.url).pathname
      if (requestPath === apiPath || requestPath.startsWith(`${apiPath}/`)) print.error()
    },
  })
  if (import.meta.hot) import.meta.hot.dispose(() => worker.stop())
  return worker
}
