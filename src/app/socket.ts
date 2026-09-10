import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/contracts/socket'
import { env } from './env'

export type MarketplaceSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function createMarketplaceSocket(): MarketplaceSocket {
  return io(env.socketUrl, {
    autoConnect: false,
    forceNew: true,
    transports: ['websocket'],
    withCredentials: true,
  })
}
