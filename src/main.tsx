import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/app/env'
import '@/styles/globals.css'

async function bootstrap() {
  // Download independent UI modules while MSW starts. Socket.IO itself is
  // imported afterward so its transport captures the intercepted WebSocket.
  const views = Promise.all([
    import('@/app/router'),
    location.pathname === '/' ? import('@/routes/home-page')
      : location.pathname.startsWith('/nfts/') ? import('@/routes/nft-detail-page') : Promise.resolve(),
  ])
  const mocks = env.mocksEnabled
    ? import('@/mocks/browser').then(({ startMockWorker }) => startMockWorker())
    : Promise.resolve()
  await Promise.all([views, mocks])
  const { default: App } = await import('./App')
  const root = document.getElementById('root')
  if (!root) throw new Error('Elemento root não encontrado.')
  createRoot(root).render(<StrictMode><App /></StrictMode>)
}
void bootstrap().catch(() => {
  const root = document.getElementById('root')
  if (root) {
    const message = document.createElement('p')
    message.setAttribute('role', 'alert')
    message.textContent = 'Não foi possível iniciar a aplicação. Recarregue a página para tentar novamente.'
    root.replaceChildren(message)
  }
})
