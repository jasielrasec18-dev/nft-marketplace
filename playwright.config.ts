import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'reports/playwright/results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mock-backend', testMatch: /mock-backend\.spec\.ts/ },
    { name: 'foundation', testMatch: /foundation\.spec\.ts/ },
    { name: 'desktop-chromium', testMatch: /(?:smoke|mock-browser|design-system|catalog|nft-detail|auth|cart|account|checkout|favorites|realtime|visual|accessibility)\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-chromium', testMatch: /(?:smoke|mock-browser|design-system|catalog|nft-detail|auth|cart|account|checkout|favorites|realtime|visual|accessibility)\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile-chromium', testMatch: /(?:smoke|mock-browser|design-system|catalog|nft-detail|auth|cart|account|checkout|favorites|realtime|visual|accessibility)\.spec\.ts/, use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run dev:mock -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
})
