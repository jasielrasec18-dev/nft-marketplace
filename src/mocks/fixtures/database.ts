import type { ResetMockInput } from '@/contracts/mock-control'
import type { MockDatabase } from '../db/types'
import { createNfts } from './nfts'
import { createUsers } from './users'

export async function createFixtures(input: ResetMockInput = {}): Promise<MockDatabase> {
  const users = await createUsers()
  return {
    schemaVersion: 1, sequence: 0, scenario: input.scenario ?? 'default',
    clock: { fixedNow: input.now ? Date.parse(input.now) : null, offsetMs: 0 },
    latencyMs: input.latencyMs ?? null, requestCounts: {}, effects: [],
    users, sessions: [], nfts: createNfts(),
    favorites: { 'user-1': ['nft-001'], 'user-2': ['nft-002'] },
    carts: users.map((user) => ({
      id: `cart-${user.id}`, owner: { kind: 'user', id: user.id }, couponCode: null, version: 1,
      items: [{ id: `item-${user.id}`, nftId: user.id === 'user-1' ? 'nft-001' : 'nft-002', editionId: 'standard', quantity: 1 }],
    })),
    profiles: users.map((user) => ({ userId: user.id, name: user.name, email: user.email, bio: '', avatarUrl: null })),
    wallets: users.map((user, index) => ({
      id: `wallet-${user.id}`, userId: user.id, label: 'Carteira principal',
      address: `0x${String(index + 1).repeat(40)}`, network: 'ethereum', role: 'primary',
    })),
    coupons: [
      { code: 'VALID10', discountRate: '0.1', expiresAt: '2099-01-01T00:00:00.000Z' },
      { code: 'EXPIRED10', discountRate: '0.1', expiresAt: '2000-01-01T00:00:00.000Z' },
    ],
    quotes: [], orders: [], idempotency: [], payments: [],
  }
}
