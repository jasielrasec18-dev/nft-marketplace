import { RouterProvider } from '@tanstack/react-router'
import { createAppRouter } from '@/app/router'
import { createAppServices } from '@/app/services'
import { AppProviders } from '@/app/providers/app-providers'

const services = createAppServices()
const router = createAppRouter(services)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    services.disconnectSocket()
    services.queryClient.clear()
  })
}

export default function App() {
  return <AppProviders services={services}><RouterProvider router={router} /></AppProviders>
}
