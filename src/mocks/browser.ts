import { setupWorker } from 'msw/browser'
import { env } from '@/app/env'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
export function startMockWorker() {
  return worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest(request, print) {
      const apiPath = new URL(env.apiBaseUrl, window.location.origin).pathname.replace(/\/$/, '')
      const requestPath = new URL(request.url).pathname
      if (requestPath === apiPath || requestPath.startsWith(`${apiPath}/`)) print.error()
    },
  })
}
