import { test, expect } from '@playwright/test'

test('boots with MSW, keeps URL through refresh and has no horizontal overflow', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?q=ape&collection=golden&priceMin=0.5&sort=price-asc&page=2')
  await expect(page.getByRole('heading', { name: 'Uma nova coleção começa aqui.' })).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain('/mockServiceWorker.js')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('q')).toBe('ape')
  expect(new URL(page.url()).searchParams.get('page')).toBe('2')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('unknown route renders 404 and a working return link', async ({ page }) => {
  await page.goto('/pagina-inexistente')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page.getByRole('heading', { name: 'Uma nova coleção começa aqui.' })).toBeVisible()
})

test('keyboard skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})
