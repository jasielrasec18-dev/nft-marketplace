import { test, expect, type Page, type Locator } from '@playwright/test'
import type { AxiosInstance } from 'axios'
import type { NFTListResponse } from '../src/contracts/nft'

async function control(page: Page, method: string, url: string, data?: unknown) {
  return page.evaluate(async (input) => {
    const modulePath = '/src/api/client.ts'
    const module = await import(modulePath) as { createApiClient: (options: { baseURL: string; timeoutMs: number }) => AxiosInstance }
    const api = module.createApiClient({ baseURL: '/api', timeoutMs: 10000 })
    return (await api.request({ method: input.method, url: input.url, data: input.data })).data
  }, { method, url, data })
}
const grid = (page: Page) => page.getByRole('list', { name: 'NFTs encontrados' })
async function search(page: Page, value: string) {
  await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill(value)
  await page.getByRole('searchbox', { name: 'Buscar NFTs' }).press('Enter')
}
async function filters(page: Page): Promise<Locator> {
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    return page.getByRole('dialog', { name: 'Filtrar NFTs' })
  }
  return page.getByRole('complementary', { name: 'Filtros do catálogo' })
}
async function sort(page: Page, label: string) {
  await page.getByRole('combobox', { name: 'Ordenar por' }).click()
  await page.getByRole('option', { name: label, exact: true }).click()
}
test.beforeEach(async ({ page }) => {
  await page.goto('/design-system')
  await expect(page.getByRole('heading', { name: 'Design System', exact: true })).toBeVisible({ timeout: 15000 })
  await control(page, 'POST', '/__mock/reset', { scenario: 'default', latencyMs: 0, now: '2026-09-10T12:00:00.000Z' })
})

test('Home renders API cards, responsive sections and working catalog anchor', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  await expect(page.getByRole('heading', { name: 'Seja dono do futuro da arte digital' })).toBeVisible()
  await expect(grid(page).getByRole('heading').first()).toHaveText('Pixel Fox #032')
  await expect(page.getByRole('status').filter({ hasText: '32 NFTs encontrados' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Diário da Cunhagem' })).toBeVisible()
  const images = grid(page).getByRole('img')
  await expect(images).toHaveCount(8)
  await expect.poll(() => images.first().evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  const media = await images.first().boundingBox()
  expect(Math.abs((media?.width ?? 0) - (media?.height ?? 0))).toBeLessThan(1)
  await page.getByRole('region', { name: 'Seja dono do futuro da arte digital' }).getByRole('link', { name: 'Explorar' }).click()
  await expect(page).toHaveURL(/#catalog$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const expectedColumns = (page.viewportSize()?.width ?? 0) >= 1024 ? 3 : 2
  expect(await grid(page).evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(expectedColumns)
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('home.png'), fullPage: true })
  await page.getByRole('region', { name: 'Seja dono do futuro da arte digital' }).screenshot({ animations: 'disabled', path: testInfo.outputPath('hero.png') })
  await grid(page).screenshot({ animations: 'disabled', path: testInfo.outputPath('catalog.png') })
  expect(errors).toEqual([])
})

test('search, collection and exact price filters combine in the HTTP request and reset page', async ({ page }) => {
  await page.goto('/?page=2')
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  await search(page, '  ape  ')
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('ape')
  await expect(page).toHaveURL(/page=1/)
  await expect(grid(page).getByRole('heading').first()).toHaveText('Golden Ape #029')
  const form = await filters(page)
  await form.getByRole('radio', { name: /golden/i }).click()
  await form.getByRole('textbox', { name: 'Preço mínimo (ETH)' }).fill('1.000000000000000001')
  await form.getByRole('textbox', { name: 'Preço máximo (ETH)' }).fill('2')
  const response = page.waitForResponse((res) => {
    const url = new URL(res.url())
    return url.pathname === '/api/nfts' && url.searchParams.get('priceMin') === '1.000000000000000001'
  })
  await form.getByRole('button', { name: 'Aplicar filtros' }).click()
  const result = await response
  const requestParams = new URL(result.url()).searchParams
  expect(requestParams.get('q')).toBe('ape')
  expect(requestParams.get('collection')).toBe('golden')
  expect(requestParams.get('page')).toBe('1')
  expect(requestParams.get('priceMax')).toBe('2')
  const data = await result.json() as NFTListResponse
  expect(data.total).toBe(4)
  expect(data.items.every((nft) => nft.priceEth === '1.19')).toBe(true)
  await expect(grid(page).getByRole('article')).toHaveCount(4)
  await sort(page, 'Maior preço')
  await expect(page).toHaveURL(/sort=price-desc/)
  expect(new URL(page.url()).searchParams.get('collection')).toBe('golden')
})

test('URL state survives history, refresh and the NFT detail round trip', async ({ page }) => {
  await page.goto('/?q=&collection=&sort=price-asc&page=2')
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  await search(page, 'ape')
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('ape')
  const a = page.url()
  await search(page, 'owl')
  await expect(grid(page).getByRole('heading').first()).toContainText('Cosmic Owl')
  const b = page.url()
  await page.goBack()
  await expect(page).toHaveURL(a)
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('ape')
  await expect(grid(page).getByRole('heading').first()).toContainText('Golden Ape')
  await page.goForward()
  await expect(page).toHaveURL(b)
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('owl')
  await page.reload()
  await expect(grid(page).getByRole('heading').first()).toContainText('Cosmic Owl')
  await expect(page.getByRole('combobox', { name: 'Ordenar por' })).toContainText('Menor preço')
  await grid(page).getByRole('link').first().click()
  await expect(page).toHaveURL(/\/nfts\/nft-/)
  await expect(page.getByRole('heading', { level: 1, name: /Cosmic Owl/ })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('owl')
  await expect(grid(page).getByRole('heading').first()).toContainText('Cosmic Owl')
})

test('API pagination, current page and invalid/out-of-range URLs remain coherent', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('button', { name: 'Página 2', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(grid(page).getByRole('heading').first()).toHaveText('Pixel Fox #024')
  await page.reload()
  await expect(grid(page).getByRole('heading').first()).toHaveText('Pixel Fox #024')
  await page.goto('/?page=999')
  await expect(page.getByRole('heading', { name: 'Esta página não tem resultados' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Paginação do catálogo' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Ir para a primeira página' }).click()
  await expect(grid(page).getByRole('heading').first()).toHaveText('Pixel Fox #032')
  await page.goto('/?page=-9&sort=banana&priceMin=-1')
  await expect(grid(page).getByRole('heading').first()).toHaveText('Pixel Fox #032')
  await expect(page.getByRole('combobox', { name: 'Ordenar por' })).toContainText('Mais recentes')
})

test('price validation rejects malformed and reversed ranges before navigation', async ({ page }) => {
  await page.goto('/')
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  const original = page.url()
  const form = await filters(page)
  await form.getByRole('textbox', { name: 'Preço mínimo (ETH)' }).fill('-1')
  await form.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(form.getByText(/Use valores ETH não negativos/)).toBeVisible()
  expect(page.url()).toBe(original)
  await form.getByRole('textbox', { name: 'Preço mínimo (ETH)' }).fill('3')
  await form.getByRole('textbox', { name: 'Preço máximo (ETH)' }).fill('1')
  await form.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(form.getByText(/O preço mínimo deve ser menor/)).toBeVisible()
  expect(page.url()).toBe(original)
})

test('empty search can clear filters and the empty scenario has no pagination', async ({ page }) => {
  await page.goto('/?q=obra-inexistente')
  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros', exact: true }).last().click()
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'empty' })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Paginação do catálogo' })).toHaveCount(0)
})

for (const scenario of ['network-error', 'server-error']) {
  test(`${scenario} displays an error and retry recovers`, async ({ page }) => {
    await control(page, 'PATCH', '/__mock/scenario', { scenario })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar os NFTs' })).toBeVisible({ timeout: 15000 })
    await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default', latencyMs: 0 })
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await expect(grid(page).getByRole('article')).toHaveCount(8)
  })
}

test('slow network displays skeleton without blocking the Hero', async ({ page }) => {
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'slow-network', latencyMs: 2500 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Seja dono do futuro da arte digital' })).toBeVisible()
  await expect(page.getByRole('status', { name: 'Carregando NFTs', exact: true })).toBeVisible()
  await expect(grid(page).getByRole('article')).toHaveCount(8, { timeout: 10000 })
  await expect(page.getByRole('status', { name: 'Carregando NFTs', exact: true })).toHaveCount(0)
})

test('variable latency cancels obsolete searches and never restores their results', async ({ page }) => {
  await page.goto('/')
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'variable-latency', latencyMs: null })
  const oldRequest = page.waitForRequest((req) => new URL(req.url()).pathname === '/api/nfts' && new URL(req.url()).searchParams.get('q') === 'ape')
  await search(page, 'ape')
  await oldRequest
  await search(page, 'owl')
  await expect(grid(page).getByRole('heading').first()).toContainText('Cosmic Owl')
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('owl')
  // A control HTTP call with the old request's latency lets its server work settle.
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default', latencyMs: 1500 })
  await control(page, 'GET', '/nfts?q=fox')
  await expect(grid(page).getByRole('heading').first()).toContainText('Cosmic Owl')
  expect(new URL(page.url()).searchParams.get('q')).toBe('owl')
})

test('background refresh retains cards, updates prices and preserves data after failure', async ({ page }) => {
  await page.goto('/')
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  await control(page, 'PATCH', '/__mock/nfts/nft-032', { priceEth: '9.123' })
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'slow-network', latencyMs: 2000 })
  await page.getByRole('button', { name: 'Atualizar catálogo' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Atualizando' })).toBeVisible()
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  await expect(page.getByRole('status', { name: 'Carregando NFTs', exact: true })).toHaveCount(0)
  await expect(grid(page).getByRole('article').first()).toContainText('9.123 ETH')
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'server-error', latencyMs: 0 })
  await page.getByRole('button', { name: 'Atualizar catálogo' }).click()
  await expect(page.getByText('Não foi possível atualizar.', { exact: false })).toBeVisible({ timeout: 15000 })
  await expect(grid(page).getByRole('article')).toHaveCount(8)
})

test('filter draft can be dismissed and applied with keyboard, preserving accessible focus', async ({ page }) => {
  await page.goto('/')
  await expect(grid(page).getByRole('article')).toHaveCount(8)
  const isMobile = (page.viewportSize()?.width ?? 0) < 1024
  const original = page.url()
  let form = await filters(page)
  await form.getByRole('radio', { name: /golden/i }).click()
  expect(page.url()).toBe(original)
  if (isMobile) {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Abrir filtros' })).toBeFocused()
    form = await filters(page)
    await expect(form.getByRole('radio', { name: 'Todas as coleções' })).toBeChecked()
    await form.getByRole('radio', { name: /golden/i }).click()
  }
  const apply = form.getByRole('button', { name: 'Aplicar filtros' })
  await apply.focus()
  await page.keyboard.press('Enter')
  await expect(grid(page).getByRole('heading').first()).toContainText('Golden Ape')
  expect(new URL(page.url()).searchParams.get('collection')).toBe('golden')
  if (isMobile) await expect(page.getByRole('dialog', { name: 'Filtrar NFTs' })).toHaveCount(0)
})

test('supported sorts reorder API results instead of sorting a local page', async ({ page }) => {
  await page.goto('/')
  await expect(grid(page).getByRole('heading').first()).toHaveText('Pixel Fox #032')
  await sort(page, 'Menor preço')
  await expect(grid(page).getByRole('heading').first()).toHaveText('Pixel Fox #004')
  await expect(grid(page).getByRole('article').first()).toContainText('0.000000000000000001 ETH')
  await sort(page, 'Maior preço')
  await expect(grid(page).getByRole('heading').first()).toHaveText('Cosmic Owl #007')
  await sort(page, 'Nome A–Z')
  await expect(grid(page).getByRole('heading').first()).toHaveText('Cosmic Owl #003')
})
