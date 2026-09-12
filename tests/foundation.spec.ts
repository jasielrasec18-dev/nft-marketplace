import { test, expect } from '@playwright/test'
import { QueryClient } from '@tanstack/react-query'
import { eth, sumEth, subtractEth, multiplyEth, formatEth, compareEth } from '../src/lib/money'
import { catalogSearchSchema } from '../src/contracts/nft'
import { ApiError, normalizeApiError } from '../src/api/errors'
import { shouldRetryQuery } from '../src/app/query/client'
import { cartKeys, privateKeys, nftKeys, sessionKeys } from '../src/app/query/keys'
import { clearSessionCache } from '../src/app/query/clear-session'
import { AxiosError, CanceledError } from 'axios'

test('ETH preserves 18 decimals and large amounts without floating point loss', () => {
  expect(sumEth([eth('0.1'), eth('0.2')])).toBe('0.3')
  expect(sumEth([eth('9007199254740993'), eth('0.000000000000000001')])).toBe('9007199254740993.000000000000000001')
  expect(multiplyEth(eth('1.19'), 3)).toBe('3.57')
  expect(subtractEth(eth('3.57'), eth('0.57'))).toBe('3')
  expect(compareEth(eth('1.19'), eth('1.190000'))).toBe(0)
  expect(formatEth(eth('1.23456789'))).toBe('1.234568 ETH')
})

test('rejects invalid ETH values, negative results and fractional quantities', () => {
  for (const invalid of ['-1', '1e-3', 'NaN', 'Infinity', '1,19', '0.0000000000000000001']) {
    expect(() => eth(invalid)).toThrow()
  }
  expect(() => subtractEth(eth('1'), eth('2'))).toThrow()
  expect(() => multiplyEth(eth('1'), 1.5)).toThrow()
})

test('catalog search normalizes invalid URL input without losing combined filters', () => {
  const filters = catalogSearchSchema.parse({ q: ' ape ', collection: 'golden', priceMin: '0.5', priceMax: '3', sort: 'price-asc', page: '2' })
  expect(filters).toEqual({ q: 'ape', collection: 'golden', priceMin: '0.5', priceMax: '3', sort: 'price-asc', page: 2 })
  const fallback = catalogSearchSchema.parse({ page: '-1', sort: 'unknown', priceMin: 'NaN' })
  expect(fallback.page).toBe(1)
  expect(fallback.sort).toBe('recent')
  expect(fallback.priceMin).toBeUndefined()
})

test('private query keys distinguish users and visitors', () => {
  expect(cartKeys.detail({ kind: 'user', id: 'a' })).not.toEqual(cartKeys.detail({ kind: 'guest', id: 'a' }))
  expect(privateKeys.favorites('a')).not.toEqual(privateKeys.favorites('b'))
  expect(nftKeys.list(catalogSearchSchema.parse({ q: 'ape' }))).not.toEqual(nftKeys.list(catalogSearchSchema.parse({ q: 'cat' })))
})

test('session cleanup cancels in-flight data and preserves public and guest resources', async () => {
  const client = new QueryClient()
  const userKey = privateKeys.profile('a')
  const guestKey = cartKeys.detail({ kind: 'guest', id: 'visitor' })
  client.setQueryData(userKey, { name: 'Collector A' })
  client.setQueryData(privateKeys.profile('b'), { name: 'Collector B' })
  client.setQueryData(nftKeys.detail('nft-1'), { name: 'Public NFT' })
  client.setQueryData(guestKey, { items: ['nft-1'] })
  client.setQueryData(sessionKeys.all, { user: { id: 'a' } })
  let disconnected = false
  let canceled = false
  const pending = client.fetchQuery({
    queryKey: privateKeys.wallets('a'),
    queryFn: ({ signal }) => new Promise<string>((resolve, reject) => {
      signal.addEventListener('abort', () => { canceled = true; reject(new Error('aborted')) })
      void resolve
    }),
  }).catch(() => undefined)
  await clearSessionCache(client, () => { disconnected = true })
  await pending
  expect(disconnected).toBe(true)
  expect(canceled).toBe(true)
  expect(client.getQueriesData({ queryKey: privateKeys.all })).toEqual([])
  expect(client.getQueryData(sessionKeys.all)).toBeNull()
  expect(client.getQueryData(guestKey)).toEqual({ items: ['nft-1'] })
  expect(client.getQueryData(nftKeys.detail('nft-1'))).toEqual({ name: 'Public NFT' })
  client.clear()
})

test('retries only transient query failures and never cancellation or business conflicts', () => {
  expect(shouldRetryQuery(0, new ApiError('Network', { code: 'NETWORK_ERROR' }))).toBe(true)
  expect(shouldRetryQuery(1, new ApiError('Server', { code: 'HTTP_ERROR', status: 503 }))).toBe(true)
  expect(shouldRetryQuery(2, new ApiError('Server', { code: 'HTTP_ERROR', status: 503 }))).toBe(false)
  for (const status of [401, 403, 404, 409, 422]) {
    expect(shouldRetryQuery(0, new ApiError('Failure', { code: 'HTTP_ERROR', status }))).toBe(false)
  }
  expect(shouldRetryQuery(0, new CanceledError())).toBe(false)
  expect(shouldRetryQuery(0, new Error('Programming error'))).toBe(false)
})

test('normalizes timeouts and network errors without exposing internal error text', () => {
  expect(normalizeApiError(new AxiosError('internal', 'ECONNABORTED')).code).toBe('TIMEOUT')
  expect(normalizeApiError(new AxiosError('internal', 'ERR_NETWORK')).code).toBe('NETWORK_ERROR')
  expect(normalizeApiError(new Error('internal')).message).not.toContain('internal')
})

test('auth return URLs preserve internal context and reject external or cyclic destinations', async () => {
  const { safeReturnTo, authSearchSchema } = await import('../src/features/auth/redirect')
  expect(authSearchSchema.parse({})).toEqual({ redirect: '/' })
  for (const unsafe of ['https://evil.example', '//evil.example', '/\\evil.example', '/login', '/register?redirect=/login', '/not-a-route', '/nfts/%2f%2fevil', '/nfts/%255cevil', '/checkout\n', '/%00', null]) {
    expect(safeReturnTo(unsafe)).toBe('/')
  }
  for (const safe of ['/?collection=golden&page=3#catalog', '/nfts/nft-001?q=Golden%20Ape#details', '/checkout?step=review', '/account/profile', '/account/wallets', '/orders/order-1']) {
    expect(safeReturnTo(safe)).toBe(safe)
  }
})

test('session transitions remove private caches, preserve public and guest data, and reject stale completion', async () => {
  const { createSessionLifecycle } = await import('../src/features/auth/session-lifecycle')
  const client = new QueryClient()
  const lifecycle = createSessionLifecycle(client, () => {})
  const session = (id: string) => ({ user: { id, name: id, email: id + '@example.com', avatarUrl: null }, expiresAt: '2027-01-01T00:00:00.000Z' })
  client.setQueryData(sessionKeys.all, session('a'))
  client.setQueryData(nftKeys.detail('nft-001'), { name: 'Public NFT' })
  const guest = cartKeys.detail({ kind: 'guest', id: 'guest-1' })
  client.setQueryData(guest, { items: ['guest item'] })
  for (const destination of ['b', 'a']) {
    const previous = client.getQueryData<{ user: { id: string } }>(sessionKeys.all)!.user.id
    client.setQueryData(privateKeys.favorites(previous), { nftIds: ['private-' + previous] })
    client.setQueryData(privateKeys.profile(previous), { name: previous })
    client.setQueryData(privateKeys.wallets(previous), { wallets: ['private wallet'] })
    client.setQueryData(privateKeys.orders(previous), { orders: ['private order'] })
    client.setQueryData(cartKeys.detail({ kind: 'user', id: previous }), { items: ['private cart'] })
    const transition = await lifecycle.begin()
    await lifecycle.commit(session(destination), transition.version)
    transition.finish()
    expect(client.getQueriesData({ queryKey: privateKeys.all })).toEqual([])
    expect(client.getQueryData(sessionKeys.all)).toEqual(session(destination))
  }
  const oldVersion = lifecycle.current()
  let expirationRedirects = 0
  lifecycle.onExpired(() => { expirationRedirects++ })
  lifecycle.expire(oldVersion)
  lifecycle.expire(oldVersion)
  expect(expirationRedirects).toBe(1)
  expect(client.getQueryData(sessionKeys.all)).toBeNull()
  await expect(lifecycle.commit(session('b'), oldVersion)).rejects.toBeInstanceOf(CanceledError)
  expect(client.getQueryData(nftKeys.detail('nft-001'))).toEqual({ name: 'Public NFT' })
  expect(client.getQueryData(guest)).toEqual({ items: ['guest item'] })
  client.clear()
})

test('Axios excludes invalid login from global expiration and ignores stale private 401 responses', async () => {
  const { createApiClient } = await import('../src/api/client')
  let version = 0
  let expirations = 0
  const api = createApiClient({ baseURL: '/api', timeoutMs: 1000, sessionVersion: () => version }, () => { expirations++ })
  api.defaults.adapter = async (config) => {
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
      status: 401, statusText: 'Unauthorized', config, headers: {},
      data: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
    })
  }
  await expect(api.post('/auth/login', { email: 'a@example.com', password: 'wrong' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  expect(expirations).toBe(0)
  let sendLate!: () => void
  let started!: () => void
  const requestStarted = new Promise<void>((resolve) => { started = resolve })
  api.defaults.adapter = (config) => new Promise((_resolve, reject) => {
    sendLate = () => reject(new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, {
      status: 401, statusText: 'Unauthorized', config, headers: {},
      data: { code: 'SESSION_EXPIRED', message: 'Expired' },
    }))
    started()
  })
  const late = api.get('/profile').catch((error: unknown) => error)
  await requestStarted
  version++
  sendLate()
  expect(await late).toBeInstanceOf(CanceledError)
  expect(expirations).toBe(0)
  const current = api.get('/profile').catch((error: unknown) => error)
  // The adapter signals readiness for this request through a fresh promise.
  await new Promise<void>((resolve) => {
    const original = started
    started = () => { original(); resolve() }
  })
  sendLate()
  expect(await current).toMatchObject({ code: 'SESSION_EXPIRED' })
  expect(expirations).toBe(1)
})
