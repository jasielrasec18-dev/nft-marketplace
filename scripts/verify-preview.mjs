import { chromium, expect } from '@playwright/test'
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'

// Verify the built demo without Vite's source imports or a separate API server.
const origin = 'http://127.0.0.1:4175'
const config = JSON.parse(await readFile('vercel.json', 'utf8'))
expect(config.buildCommand).toBe('npm run build:mock')
expect(config.outputDirectory).toBe('dist')
expect(config.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' })
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { stdio: 'ignore', windowsHide: true })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(origin)).ok) { ready = true; break } } catch { /* starting */ }
    await delay(200)
  }
  if (!ready) throw new Error('Build preview did not start on port 4175.')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const request = (path, body, method = 'POST', headers = {}) => page.evaluate(async ({ path, body, method, headers }) => {
    const response = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) })
    if (!response.ok) throw new Error(path + ': HTTP ' + response.status)
    return response.status === 204 ? null : response.json()
  }, { path, body, method, headers })
  await page.goto(origin + '/nfts/nft-001')
  await expect(page.getByTestId('nft-unit-price')).toHaveText('1.19 ETH', { timeout: 15000 })
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await expect.poll(async () => (await request('/__mock/realtime/status', undefined, 'GET')).connections).toBe(1)
  await request('/__mock/nfts/nft-001', { priceEth: '1.4' }, 'PATCH')
  await expect(page.getByTestId('nft-unit-price')).toHaveText('1.4 ETH')
  await request('/__mock/reset', { latencyMs: 0, now: '2026-09-12T12:00:00.000Z' })
  await page.goto(origin + '/checkout')
  await expect(page.getByRole('dialog', { name: 'Entrar', exact: true })).toBeVisible()
  await request('/auth/login', { email: 'collector@example.com', password: 'Jungle123!' })
  const routes = [
    ['/', 'Seja dono do futuro da arte digital'],
    ['/nfts/nft-001', 'Golden Ape #001'],
    ['/cart', 'Carrinho de NFTs'],
    ['/checkout', 'Pagamento com carteira'],
    ['/account/profile', 'Perfil do colecionador'],
    ['/account/wallets', 'Minhas carteiras'],
  ]
  for (const [path, heading] of routes) {
    const response = await page.goto(origin + path)
    expect(response.status()).toBe(200)
    await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible({ timeout: 15000 })
    await page.reload()
    await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible()
  }
  const cart = await request('/cart', undefined, 'GET')
  const quote = await request('/quote', { cartId: cart.id, cartVersion: cart.version, couponCode: null, network: 'ethereum' })
  const order = await request('/orders', { quoteId: quote.id, quoteVersion: quote.version, walletId: 'wallet-user-1', collector: { name: 'Alex Collector', email: 'collector@example.com' } }, 'POST', { 'Idempotency-Key': 'preview-purchase' })
  await page.goto(origin + '/orders/' + order.id)
  await expect(page.getByRole('heading', { name: 'Pagamento em processamento', exact: true })).toBeVisible()
  await expect.poll(async () => (await request('/__mock/realtime/status', undefined, 'GET')).subscriptions).toBe(1)
  await request('/__mock/orders/' + order.id + '/settle', { status: 'confirmed' })
  await expect(page.getByRole('heading', { name: 'Pedido confirmado', exact: true })).toBeVisible()
  expect((await request('/__mock/realtime/status', undefined, 'GET')).privateDelivered).toBeGreaterThan(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Recibo da compra', exact: true })).toBeVisible()
  expect(errors).toEqual([])
  const result = { measuredAt: new Date().toISOString(), status: 'PASS', environment: 'local optimized Vite preview; Vercel configuration checked, publication not performed', routes: [...routes.map(([path]) => path), '/orders/:orderId'], checks: ['direct navigation and refresh', 'private route login', 'MSW service worker', 'Socket.IO public price event', 'Socket.IO private order event', 'persisted receipt', 'no page errors'] }
  await mkdir('reports/validation', { recursive: true })
  await writeFile('reports/validation/preview.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
} finally {
  await browser?.close()
  preview.kill()
}
