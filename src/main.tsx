import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/app/env'
import '@/styles/globals.css'

async function bootstrap() {
  if (env.mocksEnabled) {
    const { startMockWorker } = await import('@/mocks/browser')
    await startMockWorker()
  }
  const root = document.getElementById('root')
  const { default: App } = await import('./App')
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
