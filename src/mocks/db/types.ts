import type { Account } from '@/contracts/auth'
import type { Cart, CartItemInput } from '@/contracts/cart'
import type { NFT } from '@/contracts/nft'
import type { Order, OrderStatus } from '@/contracts/order'
import type { Profile } from '@/contracts/profile'
import type { Quote } from '@/contracts/quote'
import type { Wallet } from '@/contracts/wallet'
import type { ScenarioId } from '@/contracts/mock-control'

export interface StoredUser extends Account { passwordHash: string; passwordSalt: string }
export interface StoredSession { token: string; userId: string; expiresAt: string }
export interface StoredCart extends Omit<Cart, 'items'> {
  items: (CartItemInput & { id: string })[]
}
export interface StoredQuote { userId: string; quote: Quote; orderId: string | null }
export interface Coupon { code: string; discountRate: string; expiresAt: string }
export interface IdempotencyRecord { userId: string; key: string; fingerprint: string; orderId: string }
export interface PaymentSchedule { orderId: string; dueAt: string; outcome: Exclude<OrderStatus, 'pending'> }

export interface MockDatabase {
  schemaVersion: 1
  sequence: number
  scenario: ScenarioId
  clock: { fixedNow: number | null; offsetMs: number }
  latencyMs: number | null
  requestCounts: Record<string, number>
  effects: string[]
  users: StoredUser[]
  sessions: StoredSession[]
  nfts: NFT[]
  favorites: Record<string, string[]>
  carts: StoredCart[]
  profiles: Profile[]
  wallets: Wallet[]
  coupons: Coupon[]
  quotes: StoredQuote[]
  orders: Order[]
  idempotency: IdempotencyRecord[]
  payments: PaymentSchedule[]
}
