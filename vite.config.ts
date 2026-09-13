import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pre-transform lazy entry pages so development starts without import waterfalls.
  server: { warmup: { clientFiles: ['./src/routes/home-page.tsx', './src/routes/nft-detail-page.tsx', './src/routes/auth-page.tsx', './src/routes/cart-page.tsx', './src/routes/checkout-page.tsx', './src/routes/order-page.tsx', './src/routes/account/account-layout.tsx', './src/routes/account/profile-page.tsx', './src/routes/account/wallets-page.tsx', './src/routes/design-system-page.tsx'] } },

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)([\\/]|$)/, priority: 40 },
            { name: 'validation', test: /node_modules[\\/]zod[\\/]/, priority: 30 },
            { name: 'interface', test: /node_modules[\\/](@radix-ui|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/, priority: 20 },
            { name: 'shared', minShareCount: 2, minSize: 20000, priority: 1 },
          ],
        },
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
