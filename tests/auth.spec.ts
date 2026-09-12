import { test, expect, type Page } from '@playwright/test'
import type { AxiosInstance } from 'axios'
import type { Cart } from '../src/contracts/cart'
import type { Session } from '../src/contracts/auth'

async function control<T = unknown>(page: Page, method: string, url: string, data?: unknown): Promise<T> {
  return page.evaluate(async (input) => {
    const path = '/src/api/client.ts'
    const module = await import(path) as { createApiClient: (options: { baseURL: string; timeoutMs: number }) => AxiosInstance }
    return (await module.createApiClient({ baseURL: '/api', timeoutMs: 10000 }).request(input)).data as T
  }, { method, url, data })
}
const dialog = (page: Page, register = false) => page.getByRole('dialog', { name: register ? 'Criar conta' : 'Entrar', exact: true })
async function account(page: Page) {
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    const menu = page.getByRole('dialog', { name: 'KURIO', exact: true })
    if (!await menu.isVisible()) await page.getByRole('button', { name: 'Abrir menu' }).click()
    return menu
  }
  return page.getByRole('banner')
}
async function enterFromHeader(page: Page) {
  await (await account(page)).getByRole('link', { name: 'Entrar', exact: true }).click()
  await expect(dialog(page).getByLabel(/^E-mail/)).toBeVisible()
}
async function fillLogin(page: Page, email = 'collector@example.com', password = 'Jungle123!') {
  await dialog(page).getByLabel(/^E-mail/).fill(email)
  await dialog(page).getByLabel(/^Senha/).fill(password)
}
async function signIn(page: Page, email = 'collector@example.com') {
  await fillLogin(page, email)
  await dialog(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
}
async function signOut(page: Page) {
  await (await account(page)).getByRole('button', { name: 'Sair', exact: true }).click()
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await expect(page.getByRole('dialog', { name: 'KURIO', exact: true })).toHaveCount(0)
  }
  await expect((await account(page)).getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
  if ((page.viewportSize()?.width ?? 0) < 1024) await page.keyboard.press('Escape')
}
async function fillRegistration(page: Page, email = 'new@example.com') {
  const form = dialog(page, true)
  await form.getByLabel(/^Nome/).fill('Nova Colecionadora')
  await form.getByLabel(/^E-mail/).fill(email)
  await form.getByLabel(/^Senha/).fill('NewPassword123!')
  await form.getByLabel(/^Confirmar senha/).fill('NewPassword123!')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/design-system')
  await expect(page.getByRole('heading', { name: 'Design System', exact: true })).toBeVisible({ timeout: 15000 })
  await control(page, 'POST', '/__mock/reset', { scenario: 'default', latencyMs: 0, now: '2026-09-11T12:00:00.000Z' })
})

test('direct Login and Register have responsive accessible dialogs and no horizontal overflow', async ({ page }, info) => {
  await page.goto('/login')
  await expect(dialog(page).getByLabel(/^E-mail/)).toBeFocused()
  await expect(dialog(page).getByLabel(/^Senha/)).toHaveAttribute('autocomplete', 'current-password')
  await expect(dialog(page).getByRole('button', { name: 'Continuar com Google' })).toBeDisabled()
  expect(await control<Session>(page, 'GET', '/auth/session')).toBeNull()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('login.png'), animations: 'disabled' })
  await dialog(page).getByRole('link', { name: 'Criar conta' }).click()
  await expect(dialog(page, true).getByLabel(/^Nome/)).toBeFocused()
  await expect(dialog(page, true).getByLabel(/^Nome/)).toHaveAttribute('autocomplete', 'name')
  await expect(dialog(page, true).getByLabel(/^Senha/)).toHaveAttribute('autocomplete', 'new-password')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('register.png'), animations: 'disabled' })
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 500 })
  await dialog(page, true).getByRole('button', { name: 'Criar conta', exact: true }).scrollIntoViewIfNeeded()
  await expect(dialog(page, true).getByRole('button', { name: 'Criar conta', exact: true })).toBeInViewport()
})

test('login uses HTTP and restores the session after refresh', async ({ page }) => {
  await page.goto('/login')
  const response = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/auth/login')
  await signIn(page)
  expect((await response).status()).toBe(200)
  expect(new URL(page.url()).pathname).toBe('/')
  await expect(await account(page)).toContainText('Alex Collector')
  if ((page.viewportSize()?.width ?? 0) < 1024) await page.keyboard.press('Escape')
  const restored = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/auth/session' && res.ok())
  await page.reload()
  expect((await (await restored).json() as NonNullable<Session>).user.id).toBe('user-1')
  await expect(await account(page)).toContainText('Alex Collector')
})

test('authenticated users skip Login and Register forms', async ({ page }) => {
  await control(page, 'POST', '/auth/login', { email: 'collector@example.com', password: 'Jungle123!' })
  await page.goto('/login?redirect=%2Fnfts%2Fnft-001')
  await expect(page.getByRole('heading', { level: 1, name: 'Golden Ape #001' })).toBeVisible()
  await page.goto('/register')
  await expect(page.getByRole('heading', { level: 1, name: 'Seja dono do futuro da arte digital' })).toBeVisible()
})

test('invalid credentials remain on Login without expiration loops or persisted plaintext password', async ({ page }) => {
  await page.goto('/login')
  await fillLogin(page, 'collector@example.com', 'DefinitelyWrong123!')
  await dialog(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('E-mail ou senha inválidos')
  expect(new URL(page.url()).pathname).toBe('/login')
  expect(new URL(page.url()).searchParams.get('reason')).toBeNull()
  await expect(dialog(page).getByLabel(/^Senha/)).toHaveValue('')
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain('DefinitelyWrong123!')
  expect(await control<Session>(page, 'GET', '/auth/session')).toBeNull()
  await signIn(page)
})

test('client validation focuses the first field and password controls support keyboard', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => { if (request.method() === 'POST' && /auth\/(login|register)$/.test(new URL(request.url()).pathname)) requests.push(request.url()) })
  await page.goto('/login')
  await dialog(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  const email = dialog(page).getByLabel(/^E-mail/)
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAttribute('aria-describedby', /error/)
  await email.fill('collector@example.com')
  await page.keyboard.press('Tab')
  await expect(dialog(page).getByLabel(/^Senha/)).toBeFocused()
  await page.keyboard.type('Jungle123!')
  await page.keyboard.press('Tab')
  await expect(dialog(page).getByRole('button', { name: 'Mostrar senha' })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(dialog(page).getByLabel(/^Senha/)).toHaveAttribute('type', 'text')
  await page.keyboard.press('Enter')
  await expect(dialog(page).getByLabel(/^Senha/)).toHaveAttribute('type', 'password')
  await page.keyboard.press('Shift+Tab')
  await expect(dialog(page).getByLabel(/^Senha/)).toBeFocused()
  expect(requests).toHaveLength(0)
  await page.keyboard.press('Enter')
  await expect(dialog(page)).toHaveCount(0)
})

test('registration validates confirmation and creates the API session without sending confirmation', async ({ page }) => {
  await page.goto('/register')
  await fillRegistration(page)
  await dialog(page, true).getByLabel(/^Confirmar senha/).fill('different')
  await dialog(page, true).getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(dialog(page, true).getByLabel(/^Confirmar senha/)).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog(page, true)).toContainText('As senhas devem ser iguais.')
  await dialog(page, true).getByLabel(/^Confirmar senha/).fill('NewPassword123!')
  const response = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/auth/register')
  await dialog(page, true).getByRole('button', { name: 'Criar conta', exact: true }).click()
  const result = await response
  expect(result.status()).toBe(201)
  expect(Object.keys(result.request().postDataJSON()).sort()).toEqual(['email', 'name', 'password'])
  await expect(dialog(page, true)).toHaveCount(0)
  expect((await control<Session>(page, 'GET', '/auth/session'))?.user.name).toBe('Nova Colecionadora')
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain('NewPassword123!')
  await page.reload()
  await expect(await account(page)).toContainText('Nova Colecionadora')
})

test('register-conflict associates the 409 with email and allows a corrected submission', async ({ page }) => {
  await page.goto('/register')
  await fillRegistration(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'register-conflict' })
  const response = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/auth/register')
  await dialog(page, true).getByRole('button', { name: 'Criar conta', exact: true }).click()
  expect((await response).status()).toBe(409)
  await expect(dialog(page, true).getByLabel(/^E-mail/)).toBeFocused()
  await expect(dialog(page, true).getByLabel(/^E-mail/)).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog(page, true)).toContainText('Este e-mail já está cadastrado.')
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
  await fillRegistration(page, 'corrected@example.com')
  await dialog(page, true).getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(dialog(page, true)).toHaveCount(0)
})

for (const scenario of ['network-error', 'server-error']) {
  test(`login ${scenario} is not a credential error and can be resubmitted`, async ({ page }) => {
    await page.goto('/login')
    await fillLogin(page)
    await control(page, 'PATCH', '/__mock/scenario', { scenario })
    await dialog(page).getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog(page).getByRole('alert')).toBeVisible()
    await expect(dialog(page).getByRole('alert')).not.toContainText('E-mail ou senha inválidos')
    await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
    await signIn(page)
  })
}

test('registration server failure keeps the form usable and never announces a fake session', async ({ page }) => {
  await page.goto('/register')
  await fillRegistration(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'server-error' })
  await dialog(page, true).getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(dialog(page, true).getByRole('alert')).toContainText('temporariamente indisponível')
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
  expect(await control<Session>(page, 'GET', '/auth/session')).toBeNull()
  await fillRegistration(page)
  await dialog(page, true).getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(dialog(page, true)).toHaveCount(0)
})

test('slow login prevents duplicate submission and disables close until it completes', async ({ page }) => {
  await page.goto('/login')
  await fillLogin(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'slow-network', latencyMs: 1800 })
  let submissions = 0
  page.on('request', (request) => { if (new URL(request.url()).pathname === '/api/auth/login') submissions++ })
  await dialog(page).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog(page).getByRole('button', { name: 'Entrando…' })).toBeDisabled()
  await expect(dialog(page).getByRole('button', { name: 'Fechar diálogo' })).toBeDisabled()
  await expect(dialog(page).getByLabel(/^Senha/)).toBeDisabled()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeVisible()
  await expect(dialog(page)).toHaveCount(0)
  expect(submissions).toBe(1)
})

test('login-register links preserve the complete return URL and modal close returns there', async ({ page }) => {
  const destination = '/nfts/nft-002?q=panther&collection=jungle&sort=name&page=2#details'
  await page.goto(destination)
  await expect(page.getByRole('heading', { level: 1, name: 'Jungle Panther #002' })).toBeVisible()
  await enterFromHeader(page)
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(destination)
  await dialog(page).getByRole('link', { name: 'Criar conta' }).click()
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(destination)
  await dialog(page, true).getByRole('link', { name: 'Entrar', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(new RegExp('/nfts/nft-002.*#details$'))
  await enterFromHeader(page)
  await signIn(page)
  expect(new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash).toBe(destination)
})

test('external return URL cannot redirect away after successful authentication', async ({ page }) => {
  await page.goto('/login?redirect=https%3A%2F%2Fevil.example%2Fsteal')
  await signIn(page)
  expect(new URL(page.url()).origin).toBe('http://127.0.0.1:4173')
  expect(new URL(page.url()).pathname).toBe('/')
})

test('logout is confirmed by HTTP and A to B to A never exposes the previous identity', async ({ page }) => {
  await page.goto('/login')
  await signIn(page)
  expect((await control<{ nftIds: string[] }>(page, 'GET', '/favorites')).nftIds).toEqual(['nft-001'])
  const response = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/auth/logout')
  await signOut(page)
  expect((await response).status()).toBe(204)
  expect(await control<Session>(page, 'GET', '/auth/session')).toBeNull()
  await enterFromHeader(page)
  await signIn(page, 'second@example.com')
  const controlsB = await account(page)
  await expect(controlsB).toContainText('Sam Collector')
  await expect(controlsB).not.toContainText('Alex Collector')
  expect((await control<{ nftIds: string[] }>(page, 'GET', '/favorites')).nftIds).toEqual(['nft-002'])
  await signOut(page)
  await enterFromHeader(page)
  await signIn(page)
  const controlsA = await account(page)
  await expect(controlsA).toContainText('Alex Collector')
  await expect(controlsA).not.toContainText('Sam Collector')
})

test('failed logout preserves the server session and offers explicit retry', async ({ page }) => {
  await page.goto('/login')
  await signIn(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'server-error' })
  const controls = await account(page)
  await controls.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(controls.getByRole('alert')).toContainText('Sua sessão foi mantida')
  await expect(controls).toContainText('Alex Collector')
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
  expect((await control<Session>(page, 'GET', '/auth/session'))?.user.id).toBe('user-1')
  await signOut(page)
})

test('session bootstrap distinguishes slow, network failure and authenticated restoration', async ({ page }) => {
  await page.goto('/login')
  await signIn(page)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'network-error' })
  await page.reload()
  const controls = await account(page)
  await expect(controls.getByText('Sessão não verificada.', { exact: true })).toBeVisible({ timeout: 10000 })
  await expect(controls.getByRole('link', { name: 'Entrar', exact: true })).toHaveCount(0)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
  await controls.getByRole('button', { name: 'Verificar sessão' }).click()
  await expect(controls).toContainText('Alex Collector')
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'slow-network', latencyMs: 2000 })
  await page.reload()
  const loading = await account(page)
  await expect(loading.getByRole('status')).toContainText('Verificando sessão')
  await expect(loading.getByRole('link', { name: 'Entrar', exact: true })).toHaveCount(0)
  await expect(loading).toContainText('Alex Collector')
})

test('private HTTP 401 expires the session and login returns to the original NFT context', async ({ page }) => {
  const destination = '/nfts/nft-002?q=panther&collection=&sort=name&page=1'
  await page.goto('/login?redirect=' + encodeURIComponent(destination))
  await signIn(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Jungle Panther #002' })).toBeVisible()
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'session-expired' })
  await control(page, 'POST', '/__mock/clock/advance', { milliseconds: 1001 })
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  await expect(dialog(page)).toBeVisible()
  await expect(dialog(page)).toContainText('Sua sessão expirou')
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(destination)
  await control(page, 'PATCH', '/__mock/scenario', { scenario: 'default' })
  await signIn(page)
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(destination)
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'adicionada(s) ao carrinho' })).toBeVisible()
})

test('guest cart is preserved and merged by the server when authenticating from NFT Detail', async ({ page }) => {
  await page.goto('/nfts/nft-002')
  await page.getByRole('button', { name: 'Aumentar quantidade de NFTs' }).click()
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'adicionada(s) ao carrinho' })).toBeVisible()
  await enterFromHeader(page)
  await signIn(page)
  const cart = await control<Cart>(page, 'GET', '/cart')
  expect(cart.owner).toEqual({ kind: 'user', id: 'user-1' })
  expect(cart.items.find((item) => item.nftId === 'nft-002')?.quantity).toBe(2)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Jungle Panther #002' })).toBeVisible()
  expect((await control<Cart>(page, 'GET', '/cart')).items.find((item) => item.nftId === 'nft-002')?.quantity).toBe(2)
})
