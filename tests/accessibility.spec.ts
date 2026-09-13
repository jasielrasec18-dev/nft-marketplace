import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test('main journeys have no WCAG A/AA violations and reflow at narrow width', async ({ page }, testInfo) => {
  test.setTimeout(90000)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(async () => {
    await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ latencyMs: 0 }) })
    await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'collector@example.com', password: 'Jungle123!' }) })
  })
  for (const path of ['/', '/nfts/nft-001', '/cart', '/checkout', '/account/profile', '/account/wallets']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: /^Carregando/ })).toHaveCount(0)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    await testInfo.attach(path.replaceAll('/', '_') || 'home', { body: JSON.stringify(results, null, 2), contentType: 'application/json' })
    expect(results.violations, path).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/checkout')
  await expect(page.getByTestId('order-total')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
