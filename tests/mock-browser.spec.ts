import { test, expect, type Page } from '@playwright/test'
import type { AxiosInstance } from 'axios'
import type { Cart } from '../src/contracts/cart'
import type { Quote } from '../src/contracts/quote'
import type { Order } from '../src/contracts/order'
import type { Session } from '../src/contracts/auth'

async function request<T>(page: Page, method: string, url: string, data?: unknown): Promise<T> {
  return page.evaluate(async (input) => {
    const modulePath = '/src/api/client.ts'
    const module = await import(modulePath) as { createApiClient: (options: { baseURL: string; timeoutMs: number }) => AxiosInstance }
    const client = module.createApiClient({ baseURL: '/api', timeoutMs: 10000 })
    return (await client.request({ method: input.method, url: input.url, data: input.data })).data as T
  }, { method, url, data })
}

test('real service worker serves Axios, restores session/order after refresh, and settles payment', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await request(page, 'POST', '/__mock/reset', { now: '2026-09-10T12:00:00.000Z', latencyMs: 0 })
  const session = await request<Session>(page, 'POST', '/auth/login', { email: 'collector@example.com', password: 'Jungle123!' })
  expect(session?.user.id).toBe('user-1')
  const cart = await request<Cart>(page, 'GET', '/cart')
  const quote = await request<Quote>(page, 'POST', '/quote', { cartId: cart.id, cartVersion: cart.version, couponCode: 'VALID10', network: 'ethereum' })
  const order = await page.evaluate(async (input) => {
    const modulePath = '/src/api/client.ts'
    const module = await import(modulePath) as { createApiClient: (options: { baseURL: string; timeoutMs: number }) => AxiosInstance }
    const api = module.createApiClient({ baseURL: '/api', timeoutMs: 10000 })
    return (await api.post<Order>('/orders', input, { headers: { 'Idempotency-Key': 'browser-purchase' } })).data
  }, { quoteId: quote.id, quoteVersion: quote.version, walletId: 'wallet-user-1', collector: { name: 'Alex Collector', email: 'collector@example.com' } })
  expect(order.status).toBe('pending')
  expect(order.snapshot.totalEth).toBe('1.076')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect((await request<Session>(page, 'GET', '/auth/session'))?.user.id).toBe('user-1')
  expect((await request<Order>(page, 'GET', `/orders/${order.id}`)).status).toBe('pending')
  await request(page, 'POST', '/__mock/clock/advance', { milliseconds: 2500 })
  const confirmed = await request<Order>(page, 'GET', `/orders/${order.id}`)
  expect(confirmed.status).toBe('confirmed')
  expect(confirmed.snapshot).toEqual(order.snapshot)
  expect((await request<Cart>(page, 'GET', '/cart')).items).toHaveLength(0)
  await request(page, 'POST', '/__mock/reset', { latencyMs: 0 })
  expect(await request<Session>(page, 'GET', '/auth/session')).toBeNull()
  expect(errors).toEqual([])
})
