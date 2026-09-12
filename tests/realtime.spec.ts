import { test, expect, type Page } from '@playwright/test'
async function control(page: Page, path: string, data?: unknown, method = 'POST') {
  return page.evaluate(async ({ path, data, method }) => {
    const response = await fetch('/api' + path, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) })
    return response.json()
  }, { path, data, method })
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('debug', 'socket.io-client:*,engine.io-client:*'))
  page.on('console', (message) => console.log(message.text()))
  await page.goto('/design-system')
  await expect(page.getByRole('heading', { name: 'Design System', exact: true })).toBeVisible()
  await control(page, '/__mock/reset', { latencyMs: 0 })
})
test('real Socket.IO transport updates detail and ignores duplicate or older events', async ({ page }) => {
  await page.goto('/nfts/nft-001')
  await expect(page.getByTestId('nft-unit-price')).toHaveText('1.19 ETH')
  await expect.poll(async () => (await control(page, '/__mock/realtime/status', undefined, 'GET')).connections).toBe(1)
  await control(page, '/__mock/nfts/nft-001', { priceEth: '1.4' }, 'PATCH')
  await expect(page.getByTestId('nft-unit-price')).toHaveText('1.4 ETH')
  await control(page, '/__mock/nfts/nft-001', { priceEth: '1.6' }, 'PATCH')
  await expect(page.getByTestId('nft-unit-price')).toHaveText('1.6 ETH')
  await control(page, '/__mock/realtime/replay')
  await expect(page.getByTestId('nft-unit-price')).toHaveText('1.6 ETH')
  expect((await control(page, '/__mock/realtime/status', undefined, 'GET')).delivered).toBeGreaterThanOrEqual(4)
})
test('reconnection reconciles missed public changes through REST', async ({ page }) => {
  await page.goto('/nfts/nft-001')
  await expect.poll(async () => (await control(page, '/__mock/realtime/status', undefined, 'GET')).connections).toBe(1)
  await control(page, '/__mock/realtime/disconnect')
  await control(page, '/__mock/nfts/nft-001', { priceEth: '1.7' }, 'PATCH')
  await expect(page.getByTestId('nft-unit-price')).toHaveText('1.19 ETH')
  await control(page, '/__mock/realtime/reconnect')
  await expect(page.getByTestId('nft-unit-price')).toHaveText('1.7 ETH', { timeout: 15000 })
})
