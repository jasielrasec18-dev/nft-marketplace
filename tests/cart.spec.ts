import { test, expect, type Page } from '@playwright/test'
import type { AxiosInstance } from 'axios'
import type { Cart } from '../src/contracts/cart'
import type { Quote } from '../src/contracts/quote'

async function control<T = unknown>(page: Page, method: string, url: string, data?: unknown): Promise<T> {
  return page.evaluate(async (input) => {
    const path = '/src/api/client.ts'
    const module = await import(path) as { createApiClient: (options: { baseURL: string; timeoutMs: number }) => AxiosInstance }
    return (await module.createApiClient({ baseURL: '/api', timeoutMs: 10000 }).request(input)).data as T
  }, { method, url, data })
}
const title = (page: Page) => page.getByRole('heading', { name: 'Carrinho de NFTs', exact: true })
const row = (page: Page, name = 'Golden Ape #001') => page.getByRole('listitem', { name: name + ' · Standard', exact: true })
const summary = (page: Page) => page.getByRole('complementary', { name: 'Resumo da carteira' })
const quantity = (page: Page, name = 'Golden Ape #001') => row(page, name).getByRole('group', { name: 'Quantidade de ' + name }).locator('output')
async function openCart(page: Page) {
  await page.getByRole('link', { name: /^Carrinho(?:,|$)/ }).filter({ visible: true }).click()
  await expect(title(page)).toBeVisible()
}
async function seed(page: Page, nftId = 'nft-001', amount = 1) {
  return control<Cart>(page, 'POST', '/cart/items', { nftId, editionId: 'standard', quantity: amount })
}
async function signIn(page: Page, email = 'collector@example.com') {
  const dialog = page.getByRole('dialog', { name: 'Entrar', exact: true })
  await dialog.getByLabel(/^E-mail/).fill(email)
  await dialog.getByLabel(/^Senha/).fill('Jungle123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toHaveCount(0)
}
async function account(page: Page) {
  if ((page.viewportSize()?.width ?? 0) >= 1024) return page.getByRole('banner')
  const menu = page.getByRole('dialog', { name: 'KURIO', exact: true })
  if (!await menu.isVisible()) await page.getByRole('button', { name: 'Abrir menu' }).click()
  return menu
}
async function applyCoupon(page: Page, code: string) {
  await summary(page).getByLabel('Código promocional', { exact: true }).fill(code)
  await summary(page).getByRole('button', { name: 'Aplicar', exact: true }).click()
}
async function ready(page: Page) {
  await expect(summary(page).getByTestId('quote-total')).toBeVisible()
}
test.beforeEach(async ({ page }) => {
  const initial = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/auth/session')
  await page.goto('/design-system')
  await (await initial).finished()
  await expect(page.getByRole('heading', { name: 'Design System', exact: true })).toBeVisible()
  await control(page, 'POST', '/__mock/reset', { scenario: 'default', latencyMs: 0, now: '2026-09-12T12:00:00.000Z' })
})

test('empty visitor cart has a real catalog return and shared zero indicator', async ({ page }) => {
  let cartReads = 0
  page.on('request', (request) => { if (request.method() === 'GET' && new URL(request.url()).pathname === '/api/cart') cartReads++ })
  const response = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/cart')
  await openCart(page)
  expect((await response).status()).toBe(200)
  expect(cartReads).toBe(1)
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Carrinho, 0 unidade(s)' }).filter({ visible: true })).toBeVisible()
  await page.getByRole('link', { name: 'Explorar catálogo', exact: true }).filter({ visible: true }).last().click()
  await expect(page.getByRole('list', { name: 'NFTs encontrados' })).toBeVisible()
})

test('guest detail addition persists, updates and removes through HTTP with live header count', async ({ page }) => {
  await page.goto('/nfts/nft-002')
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  await page.getByRole('link', { name: 'Ver carrinho', exact: true }).click()
  await ready(page)
  // Use the authoritative name so the test remains independent of artwork naming.
  const cart = await control<Cart>(page, 'GET', '/cart')
  const itemName = cart.items[0]!.nft.name
  expect(itemName.length).toBeGreaterThan(0)
  await page.reload()
  await expect(quantity(page, itemName)).toHaveText('1')
  const patch = page.waitForResponse((res) => res.request().method() === 'PATCH' && new URL(res.url()).pathname.startsWith('/api/cart/items/'))
  await row(page, itemName).getByRole('button', { name: 'Aumentar quantidade de ' + itemName.toLowerCase() }).click()
  expect((await patch).status()).toBe(200)
  await expect(quantity(page, itemName)).toHaveText('2')
  await expect(page.getByRole('link', { name: 'Carrinho, 2 unidade(s)' }).filter({ visible: true })).toBeVisible()
  await page.reload()
  await expect(quantity(page, itemName)).toHaveText('2')
  const removed = page.waitForResponse((res) => res.request().method() === 'DELETE')
  await row(page, itemName).getByRole('button', { name: 'Remover ' + itemName + ' do carrinho' }).click()
  expect((await removed).status()).toBe(204)
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('authenticated cart supports direct access, quantity bounds, removal and refresh', async ({ page }) => {
  await control(page, 'POST', '/auth/login', { email: 'collector@example.com', password: 'Jungle123!' })
  await page.goto('/cart')
  await ready(page)
  await expect(quantity(page)).toHaveText('1')
  await expect(row(page).getByRole('button', { name: 'Diminuir quantidade de golden ape #001' })).toBeDisabled()
  await row(page).getByRole('button', { name: 'Aumentar quantidade de golden ape #001' }).click()
  await expect(quantity(page)).toHaveText('2')
  await page.reload()
  await expect(quantity(page)).toHaveText('2')
  await row(page).getByRole('button', { name: 'Remover Golden Ape #001 do carrinho' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  expect((await control<Cart>(page, 'GET', '/cart')).owner).toEqual({ kind: 'user', id: 'user-1' })
})

test('authenticated detail add updates the same cart used by the header and Cart page', async ({ page }) => {
  await control(page, 'POST', '/auth/login', { email: 'collector@example.com', password: 'Jungle123!' })
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  await page.getByRole('link', { name: 'Ver carrinho', exact: true }).click()
  await expect(quantity(page)).toHaveText('2')
  expect((await control<Cart>(page, 'GET', '/cart')).items[0]?.quantity).toBe(2)
})

test('quote totals come from HTTP, coupon persists on refresh and removal recalculates', async ({ page }) => {
  await seed(page)
  await openCart(page)
  await ready(page)
  await expect(summary(page).getByTestId('quote-total')).toHaveText('1.195 ETH')
  const response = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/quote' && res.request().postDataJSON().couponCode === 'VALID10')
  await applyCoupon(page, 'valid10')
  const quote = await (await response).json() as Quote
  expect(quote.totalEth).toBe('1.076')
  await expect(summary(page).getByTestId('quote-total')).toHaveText('1.076 ETH')
  await expect(summary(page).getByTestId('quote-desconto')).toHaveText('0.119000000000000000 ETH')
  await page.reload()
  await ready(page)
  await expect(summary(page).getByTestId('quote-total')).toHaveText('1.076 ETH')
  await summary(page).getByRole('button', { name: 'Remover cupom' }).click()
  await expect(summary(page).getByTestId('quote-total')).toHaveText('1.195 ETH')
  expect((await control<Cart>(page, 'GET', '/cart')).couponCode).toBeNull()
})

for (const [scenario, message] of [['invalid-coupon', 'Cupom inválido.'], ['expired-coupon', 'Cupom expirado.']] as const) {
  test(scenario + ' associates the error with the field and preserves the cart', async ({ page }) => {
    await seed(page)
    await openCart(page)
    await ready(page)
    await control(page, 'PATCH', '/__mock/scenario', { scenario })
    await applyCoupon(page, 'VALID10')
    const field = summary(page).getByLabel('Código promocional', { exact: true })
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(field).toHaveAccessibleDescription('Erro: ' + message)
    await expect(field).toBeFocused()
    await expect(quantity(page)).toHaveText('1')
    await expect(summary(page).getByRole('button', { name: 'Finalizar compra', exact: true })).toBeDisabled()
    await summary(page).getByRole('button', { name: 'Remover cupom' }).click()
    await ready(page)
  })
}

test('quote failure leaves items intact and explicit retry restores the summary', async ({ page }) => {
  await seed(page)
  await openCart(page)
  await ready(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'server-error' })
  await applyCoupon(page, 'VALID10')
  await expect(summary(page).getByRole('heading', { name: 'Resumo indisponível' })).toBeVisible()
  await expect(quantity(page)).toHaveText('1')
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
  await summary(page).getByRole('button', { name: 'Tentar novamente' }).click()
  await ready(page)
})

for (const scenario of ['network-error', 'server-error'] as const) {
  test('cart ' + scenario + ' has an initial ErrorState and recovers with retry', async ({ page }) => {
    await seed(page)
    await control(page, 'PATCH', '/__mock/scenario', { scenario })
    await openCart(page)
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar seu carrinho' })).toBeVisible()
    await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await expect(quantity(page)).toHaveText('1')
    await ready(page)
  })
}

test('slow cart, quote and mutation expose pending states without duplicate quantity writes', async ({ page }) => {
  await seed(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'slow-network', latencyMs: null })
  await openCart(page)
  await expect(page.getByRole('status', { name: 'Carregando carrinho', exact: true })).toBeVisible()
  await expect(page.getByRole('status', { name: 'Carregando resumo', exact: true })).toBeVisible()
  await ready(page)
  let patches = 0
  page.on('request', (request) => { if (request.method() === 'PATCH' && request.url().includes('/cart/items/')) patches++ })
  await row(page).getByRole('button', { name: 'Aumentar quantidade de golden ape #001' }).click()
  await expect(row(page).getByRole('button', { name: 'Aumentar quantidade de golden ape #001' })).toBeDisabled()
  await page.keyboard.press('Enter')
  await expect(quantity(page)).toHaveText('2')
  expect(patches).toBe(1)
})

for (const kind of ['update', 'remove'] as const) {
  test(kind + ' failure keeps confirmed quantity and item and permits retry', async ({ page }) => {
    await seed(page)
    await openCart(page)
    await ready(page)
    await control(page, 'PATCH', '/__mock/scenario', { scenario: 'server-error' })
    const action = row(page).getByRole('button', { name: kind === 'update' ? 'Aumentar quantidade de golden ape #001' : 'Remover Golden Ape #001 do carrinho' })
    await action.click()
    await expect(page.getByRole('alert').filter({ hasText: 'Serviço temporariamente indisponível' })).toBeVisible()
    await expect(quantity(page)).toHaveText('1')
    await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
    await action.click()
    if (kind === 'update') await expect(quantity(page)).toHaveText('2')
    else await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })
}

test('price-changed renews API line prices and totals without realtime', async ({ page }) => {
  await seed(page)
  await openCart(page)
  await ready(page)
  await control(page, 'POST', '/__mock/realtime/disconnect')
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'price-changed' })
  const cart = await control<Cart>(page, 'GET', '/cart')
  await control(page, 'POST', '/quote', { cartId: cart.id, cartVersion: cart.version, couponCode: null, network: 'ethereum' })
  await page.getByRole('button', { name: 'Atualizar carrinho' }).click()
  await expect(summary(page).getByTestId('quote-total')).toHaveText('1.295 ETH')
  await expect(row(page)).toContainText('1.29 ETH')
})

test('sold-out refresh shows unavailable stock and prevents checkout', async ({ page }) => {
  await seed(page)
  await openCart(page)
  await ready(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'sold-out' })
  const cart = await control<Cart>(page, 'GET', '/cart')
  await control(page, 'POST', '/quote', { cartId: cart.id, cartVersion: cart.version, couponCode: null, network: 'ethereum' })
  await page.getByRole('button', { name: 'Atualizar carrinho' }).click()
  await expect(row(page)).toContainText('Edição esgotada')
  await expect(row(page).getByRole('button', { name: 'Aumentar quantidade de golden ape #001' })).toBeDisabled()
  await expect(summary(page).getByRole('button', { name: 'Finalizar compra', exact: true })).toBeDisabled()
})

test('guest merge sums duplicate editions once and preserves stock conflicts for explicit correction', async ({ page }) => {
  await seed(page, 'nft-001', 2)
  await control(page, 'PATCH', '/__mock/nfts/nft-001', { editionId: 'standard', availableQuantity: 1 })
  await page.goto('/login?redirect=%2Fcart')
  await signIn(page)
  await expect(quantity(page)).toHaveText('3')
  await expect(row(page)).toContainText('Quantidade acima do estoque')
  await row(page).getByRole('button', { name: 'Diminuir quantidade de golden ape #001' }).click()
  await expect(quantity(page)).toHaveText('1')
  await ready(page)
  await page.reload()
  await expect(quantity(page)).toHaveText('1')
  expect((await control<Cart>(page, 'GET', '/cart')).items.filter((item) => item.nftId === 'nft-001')).toHaveLength(1)
})

test('logout clears private cart presentation and user B never sees user A items', async ({ page }) => {
  await control(page, 'POST', '/auth/login', { email: 'collector@example.com', password: 'Jungle123!' })
  await page.goto('/cart')
  await expect(row(page)).toBeVisible()
  await (await account(page)).getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await expect(row(page)).toHaveCount(0)
  if ((page.viewportSize()?.width ?? 0) < 1024) await expect(page.getByRole('dialog', { name: 'KURIO', exact: true })).toHaveCount(0)
  await (await account(page)).getByRole('link', { name: 'Entrar', exact: true }).click()
  await signIn(page, 'second@example.com')
  await expect(title(page)).toBeVisible()
  await ready(page)
  await expect(row(page)).toHaveCount(0)
  const cart = await control<Cart>(page, 'GET', '/cart')
  expect(cart.owner).toEqual({ kind: 'user', id: 'user-2' })
  await expect(row(page, cart.items[0]!.nft.name)).toBeVisible()
})

test('visitor checkout connects, merges and returns to protected payment', async ({ page }) => {
  await seed(page, 'nft-002', 2)
  await openCart(page)
  await ready(page)
  await summary(page).getByRole('link', { name: 'Conectar e finalizar' }).click()
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/checkout')
  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira', exact: true })).toBeVisible()
  const cart = await control<Cart>(page, 'GET', '/cart')
  expect(cart.owner.kind).toBe('user')
  expect(cart.items.find((item) => item.nftId === 'nft-002')?.quantity).toBe(2)
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(title(page)).toBeVisible()
})

test('direct checkout guard restores unknown session and redirects a visitor safely', async ({ page }) => {
  await page.goto('/checkout')
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/checkout')
})

test('expired cart mutation routes to Login with cart return context', async ({ page }) => {
  await control(page, 'POST', '/auth/login', { email: 'collector@example.com', password: 'Jungle123!' })
  await page.goto('/cart')
  await ready(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'session-expired' })
  await control(page, 'POST', '/__mock/clock/advance', { milliseconds: 1001 })
  await row(page).getByRole('button', { name: 'Aumentar quantidade de golden ape #001' }).click()
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/cart')
  await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou. Entre novamente para continuar.' })).toBeVisible()
})

test('cart layout and keyboard controls remain accessible with exact small ETH values', async ({ page }, info) => {
  await seed(page)
  await seed(page, 'nft-002', 2)
  await seed(page, 'nft-003')
  await control(page, 'PATCH', '/__mock/nfts/nft-001', { priceEth: '0.000000000000000001' })
  await openCart(page)
  await ready(page)
  await expect(row(page)).toContainText('0.000000000000000001 ETH')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('cart.png'), fullPage: true, animations: 'disabled' })
  await row(page).screenshot({ path: info.outputPath('cart-item.png'), animations: 'disabled' })
  await summary(page).screenshot({ path: info.outputPath('cart-summary.png'), animations: 'disabled' })
  const plus = row(page).getByRole('button', { name: 'Aumentar quantidade de golden ape #001' })
  await plus.focus()
  await page.keyboard.press('Space')
  await expect(quantity(page)).toHaveText('2')
  await ready(page)
  const coupon = summary(page).getByLabel('Código promocional', { exact: true })
  await coupon.focus()
  await coupon.fill('VALID10')
  await page.keyboard.press('Tab')
  await expect(summary(page).getByRole('button', { name: 'Aplicar', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(coupon).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(summary(page).getByTestId('quote-desconto')).not.toHaveText('0 ETH')
  await ready(page)
  await summary(page).getByRole('link', { name: 'Conectar e finalizar' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible()
})

test('background cart failure preserves rows but blocks an outdated financial summary', async ({ page }) => {
  await seed(page)
  await openCart(page)
  await ready(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'server-error' })
  await page.getByRole('button', { name: 'Atualizar carrinho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Os últimos itens foram mantidos' })).toBeVisible()
  await expect(quantity(page)).toHaveText('1')
  await expect(summary(page).getByRole('button', { name: 'Finalizar compra', exact: true })).toBeDisabled()
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
  await summary(page).getByRole('button', { name: 'Tentar novamente' }).click()
  await ready(page)
})

test('quote expiry renews via HTTP even when the browser clock differs from the server', async ({ page }) => {
  await seed(page)
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') })
  await openCart(page)
  await ready(page)
  await control(page, 'PATCH', '/__mock/nfts/nft-001', { priceEth: '2' })
  await control(page, 'POST', '/__mock/clock/advance', { milliseconds: 300001 })
  const renewed = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/quote' && res.ok())
  await page.clock.fastForward(300001)
  const quote = await (await renewed).json() as Quote
  expect(quote.lines[0]?.unitPriceEth).toBe('2')
  await expect(summary(page).getByTestId('quote-total')).toHaveText('2.005 ETH')
})

test('late coupon quote cannot restore totals for the previous quantity', async ({ page }) => {
  await seed(page)
  await openCart(page)
  await ready(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'variable-latency', latencyMs: null })
  await applyCoupon(page, 'VALID10')
  await row(page).getByRole('button', { name: 'Aumentar quantidade de golden ape #001' }).click()
  await expect(summary(page).getByRole('link', { name: 'Conectar e finalizar' })).toHaveCount(0)
  await expect(quantity(page)).toHaveText('2')
  await expect(summary(page).getByTestId('quote-total')).toHaveText('2.147 ETH')
})
