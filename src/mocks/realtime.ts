import { http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { z } from 'zod'
import type { NFTUpdatedEvent, OrderUpdatedEvent } from '@/contracts/socket'
import type { MockDatabaseStore } from './db/mock-database'
import { currentUser } from './db/session'
import { settleDueOrders } from './db/orders'
import { bindRequestCookies } from './utils/responses'
import { isoNow, now } from './utils/clock'

export function createRealtimeMock(store: MockDatabaseStore, socketUrl: string, apiBase: string) {
  const url = new URL(socketUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/socket.io/'
  const endpoint = ws.link(url.href)
  type Connection = { io: ReturnType<typeof toSocketIo>; request: Request; orders: Set<string>; heartbeat: ReturnType<typeof setInterval> }
  const connections = new Set<Connection>()
  let paused = false
  let delivered = 0
  const history: ({ kind: 'nft.updated'; data: NFTUpdatedEvent } | { kind: 'order.updated'; data: OrderUpdatedEvent })[] = []
  function owner(connection: Connection) {
    try { return currentUser(store.read(), connection.request, false)?.id } catch { return undefined }
  }
  function emit(event: typeof history[number], remember = true) {
    if (remember) { history.push(event); if (history.length > 128) history.shift() }
    for (const connection of connections) {
      if (event.kind === 'order.updated' && (owner(connection) !== event.data.userId || !connection.orders.has(event.data.orderId))) continue
      connection.io.client.emit(event.kind, event.data)
      delivered++
    }
  }
  const handler = endpoint.addEventListener('connection', (connection) => {
    if (paused) { connection.client.close(1012, 'Simulated outage'); return }
    const io = toSocketIo(connection)
    const request = new Request(new URL(apiBase, location.origin))
    bindRequestCookies(request, Object.fromEntries(document.cookie.split(';').filter(Boolean).map((part) => {
      const separator = part.indexOf('=')
      return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1))]
    })))
    const entry: Connection = { io, request, orders: new Set(), heartbeat: setInterval(() => io.rawClient.send('2'), 10000) }
    connections.add(entry)
    io.client.on('order.subscribe', (_event, payload: unknown) => {
      const parsed = z.object({ orderId: z.string().max(100) }).safeParse(payload)
      if (parsed.success && entry.orders.size < 20 && store.read().orders.some((order) => order.id === parsed.data.orderId && order.userId === owner(entry))) entry.orders.add(parsed.data.orderId)
    })
    io.client.on('order.unsubscribe', (_event, payload: unknown) => {
      const parsed = z.object({ orderId: z.string() }).safeParse(payload)
      if (parsed.success) entry.orders.delete(parsed.data.orderId)
    })
    connection.client.addEventListener('close', () => { clearInterval(entry.heartbeat); connections.delete(entry) })
  })
  const stopObserving = store.observe((previous, next) => {
    for (const nft of next.nfts) if (previous.nfts.find((entry) => entry.id === nft.id)?.version !== nft.version) {
      emit({ kind: 'nft.updated', data: { eventId: `nft:${nft.id}:${nft.version}`, version: nft.version, occurredAt: isoNow(next), nftId: nft.id, priceEth: nft.priceEth, availableQuantity: nft.availableQuantity, editions: nft.editions } })
    }
    for (const order of next.orders) if (previous.orders.find((entry) => entry.id === order.id)?.version !== order.version) {
      emit({ kind: 'order.updated', data: { eventId: `order:${order.id}:${order.version}`, version: order.version, occurredAt: order.updatedAt, orderId: order.id, userId: order.userId, status: order.status } })
    }
  })
  const timer = setInterval(() => {
    const db = store.read()
    if (db.payments.some((payment) => Date.parse(payment.dueAt) <= now(db))) void store.transaction(settleDueOrders)
  }, 500)
  const controls = [
    http.post(`${apiBase}/__mock/realtime/disconnect`, () => {
      paused = true
      for (const connection of connections) connection.io.rawClient.close(1012, 'Simulated outage')
      return HttpResponse.json({ paused })
    }),
    http.post(`${apiBase}/__mock/realtime/reconnect`, () => { paused = false; return HttpResponse.json({ paused }) }),
    http.post(`${apiBase}/__mock/realtime/replay`, () => { for (const event of [...history].reverse()) emit(event, false); return HttpResponse.json({ replayed: history.length }) }),
    http.get(`${apiBase}/__mock/realtime/status`, () => HttpResponse.json({ connections: connections.size, delivered, paused, retained: history.length })),
  ]
  return { handlers: [handler, ...controls], dispose() {
    clearInterval(timer); stopObserving()
    for (const connection of connections) { clearInterval(connection.heartbeat); connection.io.rawClient.close() }
    connections.clear(); history.length = 0
  } }
}
