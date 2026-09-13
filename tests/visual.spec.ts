import { test, expect } from '@playwright/test'
// Use one pixel density so responsive image selection does not depend on a larger cached candidate.
test.use({ deviceScaleFactor: 3 })
for (const [name, route] of [['home', '/'], ['detail', '/nfts/nft-001'], ['cart', '/cart'], ['checkout', '/checkout']] as const) {
  test(name + ' visual baseline', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.evaluate(async () => {
      const send = (path: string, body: unknown) => fetch('/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      await send('/__mock/reset', { latencyMs: 0, now: '2026-09-12T12:00:00.000Z' })
      await send('/auth/login', { email: 'collector@example.com', password: 'Jungle123!' })
    })
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    if (name === 'home') await expect(page.getByRole('article').first()).toBeVisible()
    if (name === 'detail') await expect(page.getByTestId('nft-unit-price')).toHaveText('1.19 ETH')
    if (name === 'cart') await expect(page.getByRole('link', { name: 'Continuar para finalização', exact: true })).toBeEnabled()
    if (name === 'checkout') await expect(page.getByTestId('order-total')).toHaveText('1.195 ETH')
    await page.evaluate(async () => {
      await document.fonts.ready
      for (const image of document.images) { image.loading = 'eager'; await image.decode().catch(() => undefined) }
    })
    await expect(page).toHaveScreenshot(name + '.png', { fullPage: true, scale: 'css', animations: 'disabled', maxDiffPixelRatio: 0.001, timeout: 10000 })
  })
}
