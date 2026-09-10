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
