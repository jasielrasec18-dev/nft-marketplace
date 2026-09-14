import '@/styles/globals.css'

async function bootstrap() {
  // Keep the entry independent of React/Zod so the worker download starts
  // alongside the UI, instead of waiting for the interface dependency tree.
  const renderer = Promise.all([import('react'), import('react-dom/client')])
  const application = import('./App')
  const views = Promise.all([
    import('@/app/router'),
    location.pathname === '/' ? import('@/routes/home-page')
      : location.pathname.startsWith('/nfts/') ? import('@/routes/nft-detail-page') : Promise.resolve(),
  ])
  const mocks = import.meta.env.VITE_MOCK_ENABLED === 'true'
    ? import('@/mocks/browser').then(({ startMockWorker }) => startMockWorker())
    : Promise.resolve()
  await Promise.all([views, mocks])
  // Requests start after the worker; the socket module loads on first connection.
  const [{ default: App }, [{ StrictMode, createElement }, { createRoot }]] = await Promise.all([application, renderer])
  const root = document.getElementById('root')
  if (!root) throw new Error('Elemento root não encontrado.')
  createRoot(root).render(createElement(StrictMode, null, createElement(App)))
}
void bootstrap().catch((error) => {
  console.error('Falha ao inicializar a aplicação:', error)
  const root = document.getElementById('root')
  if (root) {
    const message = document.createElement('p')
    message.setAttribute('role', 'alert')
    message.textContent = 'Não foi possível iniciar a aplicação. Recarregue a página para tentar novamente.'
    root.replaceChildren(message)
  }
})
