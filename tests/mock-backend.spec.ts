import { test, expect } from '@playwright/test'
import { setupServer } from 'msw/node'
import type { AxiosInstance } from 'axios'
import { createMockDatabase, type MockDatabaseStore } from '../src/mocks/db/mock-database'
import { createMemoryStorage, DATABASE_KEY, type MockStorage } from '../src/mocks/db/persistence'
import { createHandlers } from '../src/mocks/handlers'
import type { Cart } from '../src/contracts/cart'
import type { Order } from '../src/contracts/order'
import type { NFT } from '../src/contracts/nft'
import type { Paginated } from '../src/contracts/common'
import type { Profile } from '../src/contracts/profile'
import type { Wallet } from '../src/contracts/wallet'
import type { Session } from '../src/contracts/auth'
import { createTestClient, login, quoteFor, orderInput } from './helpers/mock-api'

let store: MockDatabaseStore
let storage: MockStorage
let server: ReturnType<typeof setupServer>
let api: AxiosInstance
const fixed = { now: '2026-09-10T12:00:00.000Z', latencyMs: 0 }

test.beforeEach(async () => {
  storage = createMemoryStorage()
  store = await createMockDatabase(storage, fixed)
  server = setupServer(...createHandlers(store, 'http://mock.local/api', 200))
  server.listen({ onUnhandledRequest: 'error' })
  api = createTestClient()
})
test.afterEach(() => server.close())

test('login validates credentials, exposes only account data and logout invalidates session', async () => {
  await expect(api.get('/profile')).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
  await expect(login(api, 'collector@example.com', 'wrong')).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
  const response = await login(api)
  expect(response.data.user.id).toBe('user-1')
  expect(response.data.user).not.toHaveProperty('passwordHash')
  expect((await api.get<Session>('/auth/session')).data?.user.id).toBe('user-1')
  await api.post('/auth/logout')
  expect((await api.get('/auth/session')).data).toBeNull()
  await expect(api.get('/favorites')).rejects.toMatchObject({ status: 401 })
  expect(storage.getItem(DATABASE_KEY)).not.toContain('Jungle123!')
})

test('registration validates, prevents concurrent duplicate emails and persists a hashed password', async () => {
  await expect(api.post('/auth/register', { name: '', email: 'bad', password: 'a' })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  const input = { name: 'New Collector', email: 'new@example.com', password: 'NewPassword123!' }
  const results = await Promise.allSettled([api.post('/auth/register', input), api.post('/auth/register', input)])
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: { status: 409, code: 'EMAIL_ALREADY_EXISTS' } })
  expect(storage.getItem(DATABASE_KEY)).not.toContain(input.password)
  const client = createTestClient()
  await login(client, input.email, input.password)
  expect((await client.get<Profile>('/profile')).data.name).toBe(input.name)
})

test('catalog combines filters, sorts decimal prices and paginates deterministically', async () => {
  const first = (await api.get<Paginated<NFT>>('/nfts', { params: { sort: 'price-asc', page: 1 } })).data
  const second = (await api.get<Paginated<NFT>>('/nfts', { params: { sort: 'price-asc', page: 2 } })).data
  expect(first.total).toBe(32)
  expect(first.items).toHaveLength(8)
  expect(first.items[0]?.priceEth).toBe('0.000000000000000001')
  expect(first.items.map((item) => item.id).filter((id) => second.items.some((item) => item.id === id))).toEqual([])
  const filtered = (await api.get<Paginated<NFT>>('/nfts?q=ape&collection=golden&priceMin=1&priceMax=2&sort=name')).data
  expect(filtered.total).toBe(4)
  expect(filtered.items.every((item) => item.collection === 'golden' && item.priceEth === '1.19')).toBe(true)
  expect((await api.get<Paginated<NFT>>('/nfts?q=missing')).data.total).toBe(0)
  await expect(api.get('/nfts/missing')).rejects.toMatchObject({ status: 404, code: 'NFT_NOT_FOUND' })
  await expect(api.get('/nfts?priceMin=5&priceMax=1')).rejects.toMatchObject({ status: 422, code: 'INVALID_PRICE_RANGE' })
})

test('users cannot read or mutate another user cart, quote, order, profile or wallet', async () => {
  const second = createTestClient()
  await login(api)
  await login(second, 'second@example.com')
  await api.post('/favorites/nft-003')
  expect((await second.get('/favorites')).data.nftIds).toEqual(['nft-002'])
  const cartA = (await api.get<Cart>('/cart')).data
  const cartB = (await second.get<Cart>('/cart')).data
  expect(cartA.owner.id).not.toBe(cartB.owner.id)
  await expect(second.patch(`/cart/items/${cartA.items[0]?.id}`, { quantity: 2 })).rejects.toMatchObject({ status: 404 })
  await expect(second.post('/quote', { cartId: cartA.id, cartVersion: cartA.version, couponCode: null, network: 'ethereum' })).rejects.toMatchObject({ status: 404 })
  const quote = await quoteFor(api)
  const order = (await api.post<Order>('/orders', orderInput(quote), { headers: { 'Idempotency-Key': 'private' } })).data
  await expect(second.get(`/orders/${order.id}`)).rejects.toMatchObject({ status: 404 })
  await expect(second.post('/orders', orderInput(quote), { headers: { 'Idempotency-Key': 'private' } })).rejects.toMatchObject({ status: 404 })
  await expect(second.patch('/wallets/wallet-user-1', { label: 'Hijacked' })).rejects.toMatchObject({ status: 404 })
  await expect(second.patch('/profile', { userId: 'user-1', name: 'Hijacked' })).rejects.toMatchObject({ status: 422 })
  expect((await api.get<Profile>('/profile')).data.name).toBe('Alex Collector')
})

test('cart validates quantities and editions, updates and removes consistently', async () => {
  await login(api)
  for (const quantity of [0, -1, 1.5]) {
    await expect(api.post('/cart/items', { nftId: 'nft-001', editionId: 'standard', quantity })).rejects.toMatchObject({ status: 422 })
  }
  await expect(api.post('/cart/items', { nftId: 'nft-001', editionId: 'missing', quantity: 1 })).rejects.toMatchObject({ code: 'INVALID_EDITION' })
  await expect(api.post('/cart/items', { nftId: 'nft-001', editionId: 'standard', quantity: 100 })).rejects.toMatchObject({ status: 409, code: 'OUT_OF_STOCK' })
  const added = (await api.post<Cart>('/cart/items', { nftId: 'nft-003', editionId: 'standard', quantity: 2 })).data
  const item = added.items.find((entry) => entry.nftId === 'nft-003')
  expect(item?.quantity).toBe(2)
  await api.patch(`/cart/items/${item?.id}`, { quantity: 3 })
  expect((await api.get<Cart>('/cart')).data.items.find((entry) => entry.id === item?.id)?.quantity).toBe(3)
  await api.delete(`/cart/items/${item?.id}`)
  expect((await api.get<Cart>('/cart')).data.items).toHaveLength(1)
})

test('guest cart merges exactly once on login and preserves unavailable quantities for review', async () => {
  const guestCart = (await api.post<Cart>('/cart/items', { nftId: 'nft-001', editionId: 'standard', quantity: 2 })).data
  expect(guestCart.owner.kind).toBe('guest')
  await login(api)
  expect((await api.get<Cart>('/cart')).data.items[0]?.quantity).toBe(3)
  await login(api)
  expect((await api.get<Cart>('/cart')).data.items[0]?.quantity).toBe(3)
})

test('quote computes exact ETH and rejects invalid, expired coupons and insufficient stock', async () => {
  await login(api)
  const quote = await quoteFor(api, 'valid10')
  expect(quote.subtotalEth).toBe('1.19')
  expect(quote.discountEth).toBe('0.119000000000000000')
  expect(quote.networkFeeEth).toBe('0.005')
  expect(quote.totalEth).toBe('1.076')
  await expect(quoteFor(api, 'INVALID')).rejects.toMatchObject({ status: 422, code: 'INVALID_COUPON' })
  await expect(quoteFor(api, 'EXPIRED10')).rejects.toMatchObject({ status: 422, code: 'EXPIRED_COUPON' })
  await api.patch('/__mock/nfts/nft-001', { availableQuantity: 0 })
  await expect(quoteFor(api)).rejects.toMatchObject({ status: 409, code: 'OUT_OF_STOCK' })
  expect((await api.get<NFT>('/nfts/nft-001')).data.availableQuantity).toBe(0)
  expect((await api.get<Cart>('/cart')).data.items[0]?.nft.availableQuantity).toBe(0)
})

test('concurrent repeated order requests create one order, reserve once and detect conflicting payloads', async () => {
  await login(api)
  const quote = await quoteFor(api)
  const input = orderInput(quote)
  const responses = await Promise.all([1, 2, 3].map(() => api.post<Order>('/orders', input, { headers: { 'Idempotency-Key': 'same-key' } })))
  expect(new Set(responses.map((response) => response.data.id)).size).toBe(1)
  expect(responses.map((response) => response.status).sort()).toEqual([200, 200, 201])
  expect((await api.get('/__mock/state')).data.counts.orders).toBe(1)
  expect((await api.get<NFT>('/nfts/nft-001')).data.editions[0]?.availableQuantity).toBe(7)
  await expect(api.post('/orders', { ...input, collector: { ...input.collector, name: 'Changed' } }, { headers: { 'Idempotency-Key': 'same-key' } })).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_CONFLICT' })
  await expect(api.post('/orders', input, { headers: { 'Idempotency-Key': 'different-key' } })).rejects.toMatchObject({ code: 'QUOTE_ALREADY_USED' })
})

test('order timeout happens after commit and retry recovers the persisted order after backend recreation', async () => {
  await login(api)
  const quote = await quoteFor(api)
  await api.patch('/__mock/scenario', { scenario: 'order-timeout' })
  const input = orderInput(quote)
  await expect(api.post('/orders', input, { headers: { 'Idempotency-Key': 'timeout-key' }, timeout: 50 })).rejects.toMatchObject({ code: 'TIMEOUT' })
  expect((await api.get('/__mock/state')).data.counts.orders).toBe(1)
  server.close()
  store = await createMockDatabase(storage, fixed)
  server = setupServer(...createHandlers(store, 'http://mock.local/api', 200))
  server.listen({ onUnhandledRequest: 'error' })
  const recovered = await api.post<Order>('/orders', input, { headers: { 'Idempotency-Key': 'timeout-key' } })
  expect(recovered.status).toBe(200)
  expect(recovered.data.status).toBe('pending')
  expect((await api.get('/__mock/state')).data.counts.orders).toBe(1)
  expect((await api.get<Order>(`/orders/${recovered.data.id}`)).data.id).toBe(recovered.data.id)
})

test('confirmation preserves snapshot, removes only purchased quantities and is terminal', async () => {
  await login(api)
  const quote = await quoteFor(api)
  const order = (await api.post<Order>('/orders', orderInput(quote), { headers: { 'Idempotency-Key': 'confirm' } })).data
  await api.post('/cart/items', { nftId: 'nft-001', editionId: 'standard', quantity: 1 })
  await api.patch('/__mock/nfts/nft-001', { priceEth: '9.5' })
  await api.post('/__mock/clock/advance', { milliseconds: 2500 })
  const confirmed = (await api.get<Order>(`/orders/${order.id}`)).data
  expect(confirmed.status).toBe('confirmed')
  expect(confirmed.transactionReference).toBe(`SIMULATED-${order.id}`)
  expect(confirmed.snapshot).toEqual(order.snapshot)
  expect(confirmed.snapshot.lines[0]?.unitPriceEth).toBe('1.19')
  expect((await api.get<Cart>('/cart')).data.items[0]?.quantity).toBe(1)
  await expect(api.post(`/__mock/orders/${order.id}/settle`, { status: 'declined' })).rejects.toMatchObject({ status: 409, code: 'ORDER_TERMINAL' })
})

test('declined payments preserve cart, release reservations and remain retrievable', async () => {
  await api.patch('/__mock/scenario', { scenario: 'payment-declined' })
  await login(api)
  const quote = await quoteFor(api)
  const order = (await api.post<Order>('/orders', orderInput(quote), { headers: { 'Idempotency-Key': 'decline' } })).data
  await api.post('/__mock/clock/advance', { milliseconds: 2500 })
  expect((await api.get<Order>(`/orders/${order.id}`)).data.status).toBe('declined')
  expect((await api.get<Cart>('/cart')).data.items[0]?.quantity).toBe(1)
  expect((await api.get<NFT>('/nfts/nft-001')).data.editions[0]?.availableQuantity).toBe(8)
})

test('price changes and quote expiry require review instead of silently accepting stale values', async () => {
  await login(api)
  const quote = await quoteFor(api)
  await api.patch('/__mock/scenario', { scenario: 'price-changed' })
  await expect(api.post('/orders', orderInput(quote), { headers: { 'Idempotency-Key': 'price' } })).rejects.toMatchObject({ status: 409, code: 'QUOTE_CHANGED' })
  expect((await api.get<NFT>('/nfts/nft-001')).data.priceEth).toBe('1.29')
  const fresh = await quoteFor(api)
  expect(fresh.lines[0]?.unitPriceEth).toBe('1.29')
  await api.post('/__mock/clock/advance', { milliseconds: 300001 })
  await expect(api.post('/orders', orderInput(fresh), { headers: { 'Idempotency-Key': 'expired' } })).rejects.toMatchObject({ code: 'QUOTE_EXPIRED' })
})

test('session expires under a controlled clock and reset restores a known database', async () => {
  await api.patch('/__mock/scenario', { scenario: 'session-expired' })
  await login(api)
  expect((await api.get<Session>('/auth/session')).data?.user.id).toBe('user-1')
  await api.post('/__mock/clock/advance', { milliseconds: 1001 })
  await expect(api.get('/profile')).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED' })
  await api.post('/__mock/reset', fixed)
  expect((await api.get('/auth/session')).data).toBeNull()
  expect((await api.get('/__mock/state')).data.counts).toEqual({ users: 2, nfts: 32, orders: 0, quotes: 0 })
})

test('network failure, HTTP 500/503 and timeout are distinct and recover without modifying UI', async () => {
  for (const [scenario, code, status] of [
    ['network-error', 'NETWORK_ERROR', undefined],
    ['server-error', 'SERVICE_UNAVAILABLE', 500],
    ['service-unavailable', 'SERVICE_UNAVAILABLE', 503],
  ] as const) {
    await api.patch('/__mock/scenario', { scenario })
    await expect(api.get('/nfts')).rejects.toMatchObject({ code, status })
  }
  await api.patch('/__mock/scenario', { scenario: 'request-timeout' })
  await expect(api.get('/nfts', { timeout: 50 })).rejects.toMatchObject({ code: 'TIMEOUT' })
  await api.patch('/__mock/scenario', { scenario: 'default' })
  expect((await api.get<Paginated<NFT>>('/nfts')).data.total).toBe(32)
})

test('variable latency returns a later search first in a reproducible sequence', async () => {
  await api.patch('/__mock/scenario', { scenario: 'variable-latency', latencyMs: null })
  const sequence: string[] = []
  await Promise.all([
    api.get('/nfts?q=ape').then(() => sequence.push('A')),
    api.get('/nfts?q=fox').then(() => sequence.push('B')),
  ])
  expect(sequence).toEqual(['B', 'A'])
})

test('profile, avatar, password and wallets persist and validate ownership and conflicts', async () => {
  await login(api)
  await api.patch('/profile', { name: 'Updated Collector', bio: 'My collection' })
  await expect(api.patch('/profile', { email: 'second@example.com' })).rejects.toMatchObject({ status: 409 })
  const avatar = 'data:image/png;base64,aGVsbG8='
  await api.patch('/profile/avatar', { imageDataUrl: avatar })
  expect((await api.get<Profile>('/profile')).data.avatarUrl).toBe(avatar)
  const wallet = (await api.post<Wallet>('/wallets', { label: 'Secondary', address: '0x' + '3'.repeat(40), network: 'polygon', role: 'secondary' })).data
  await api.patch(`/wallets/${wallet.id}`, { label: 'Updated wallet' })
  expect((await api.get<Wallet[]>('/wallets')).data.find((item) => item.id === wallet.id)?.label).toBe('Updated wallet')
  await expect(api.post('/wallets', { label: 'Duplicate', address: '0x' + '4'.repeat(40), network: 'polygon', role: 'secondary' })).rejects.toMatchObject({ code: 'WALLET_ROLE_CONFLICT' })
  await api.patch('/profile/password', { currentPassword: 'Jungle123!', newPassword: 'ChangedPassword123!', confirmPassword: 'ChangedPassword123!' })
  await expect(login(createTestClient())).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  await login(createTestClient(), 'collector@example.com', 'ChangedPassword123!')
  expect(storage.getItem(DATABASE_KEY)).not.toContain('ChangedPassword123!')
})

test('corrupted persistence is reset and failed transactions never publish partial state', async () => {
  storage.setItem(DATABASE_KEY, '{"schemaVersion":1,"users":[]}')
  const restored = await createMockDatabase(storage, fixed)
  expect(restored.read().users).toHaveLength(2)
  await expect(restored.transaction((db) => { db.nfts = []; throw new Error('rollback') })).rejects.toThrow('rollback')
  expect(restored.read().nfts).toHaveLength(32)
})

test('two users competing for the last edition cannot oversell', async () => {
  const second = createTestClient()
  await login(api)
  await login(second, 'second@example.com')
  const otherCart = (await second.get<Cart>('/cart')).data
  await second.delete(`/cart/items/${otherCart.items[0]?.id}`)
  await second.post('/cart/items', { nftId: 'nft-001', editionId: 'standard', quantity: 1 })
  await api.patch('/__mock/nfts/nft-001', { editionId: 'standard', availableQuantity: 1 })
  const quoteA = await quoteFor(api)
  const quoteB = await quoteFor(second)
  const results = await Promise.allSettled([
    api.post<Order>('/orders', orderInput(quoteA), { headers: { 'Idempotency-Key': 'last-a' } }),
    second.post<Order>('/orders', { ...orderInput(quoteB), walletId: 'wallet-user-2' }, { headers: { 'Idempotency-Key': 'last-b' } }),
  ])
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: { code: 'OUT_OF_STOCK' } })
  expect((await api.get<NFT>('/nfts/nft-001')).data.editions[0]?.availableQuantity).toBe(0)
})

test('a quote created before refresh remains valid after restoring persisted JSON', async () => {
  await login(api)
  const quote = await quoteFor(api, 'VALID10')
  server.close()
  store = await createMockDatabase(storage, fixed)
  server = setupServer(...createHandlers(store, 'http://mock.local/api', 200))
  server.listen({ onUnhandledRequest: 'error' })
  const order = await api.post<Order>('/orders', orderInput(quote), { headers: { 'Idempotency-Key': 'after-refresh' } })
  expect(order.status).toBe(201)
  expect(order.data.snapshot.totalEth).toBe('1.076')
})

test('reset revokes old sessions even after another user logs in', async () => {
  await login(api)
  const admin = createTestClient()
  await admin.post('/__mock/reset', fixed)
  await login(admin, 'second@example.com')
  await expect(api.get('/profile')).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
  expect((await admin.get<Profile>('/profile')).data.userId).toBe('user-2')
})

test('reset prevents delayed mutations from changing the fresh fixtures', async () => {
  await login(api)
  await api.patch('/__mock/scenario', { scenario: 'slow-network', latencyMs: 500 })
  const pending = api.post('/favorites/nft-003').catch((error: unknown) => error)
  await expect.poll(() => store.read().requestCounts['favorites.add']).toBe(1)
  await api.post('/__mock/reset', fixed)
  expect(await pending).toMatchObject({ status: 409, code: 'MOCK_RESET' })
  await login(api)
  expect((await api.get('/favorites')).data.nftIds).toEqual(['nft-001'])
})

test('empty, slow, unauthorized, conflict, coupon and sold-out scenarios are selectable without duplicating handlers', async () => {
  await api.patch('/__mock/scenario', { scenario: 'empty' })
  expect((await api.get<Paginated<NFT>>('/nfts')).data.total).toBe(0)
  await api.patch('/__mock/scenario', { scenario: 'register-conflict' })
  await expect(api.post('/auth/register', { name: 'New', email: 'new@example.com', password: 'Password123!' })).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS' })
  await login(api)
  await api.patch('/__mock/scenario', { scenario: 'unauthorized' })
  await expect(api.get('/favorites')).rejects.toMatchObject({ status: 401 })
  for (const [scenario, code] of [['invalid-coupon', 'INVALID_COUPON'], ['expired-coupon', 'EXPIRED_COUPON']] as const) {
    await api.patch('/__mock/scenario', { scenario })
    await expect(quoteFor(api, 'VALID10')).rejects.toMatchObject({ code })
  }
  await api.patch('/__mock/scenario', { scenario: 'sold-out' })
  const quote = await quoteFor(api)
  await expect(api.post('/orders', orderInput(quote), { headers: { 'Idempotency-Key': 'sold' } })).rejects.toMatchObject({ code: 'OUT_OF_STOCK' })
  expect((await api.get<Cart>('/cart')).data.items[0]?.nft.availableQuantity).toBe(0)
  await api.patch('/__mock/scenario', { scenario: 'slow-network', latencyMs: null })
  const started = performance.now()
  await api.get('/nfts')
  expect(performance.now() - started).toBeGreaterThanOrEqual(1100)
})

test('storage quota failure rolls back the transaction instead of returning false success', async () => {
  const target = createMemoryStorage()
  let failWrites = false
  const persisted = await createMockDatabase({
    getItem: (key) => target.getItem(key),
    removeItem: (key) => target.removeItem(key),
    setItem: (key, value) => {
      if (failWrites) throw new Error('Quota exceeded')
      target.setItem(key, value)
    },
  }, fixed)
  failWrites = true
  await expect(persisted.transaction((db) => { db.favorites['user-1'] = [] })).rejects.toThrow('Quota exceeded')
  expect(persisted.read().favorites['user-1']).toEqual(['nft-001'])
})
