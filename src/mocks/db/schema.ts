import { z } from 'zod'
import { ethAmountSchema } from '@/contracts/common'
import { scenarioIdSchema } from '@/contracts/mock-control'
import { networkSchema, walletInputSchema } from '@/contracts/wallet'
import { profileInputSchema } from '@/contracts/profile'
import { collectorSchema } from '@/contracts/order'
import type { MockDatabase } from './types'

const id = z.string().min(1)
const date = z.iso.datetime()
const integer = z.number().int().nonnegative()
const version = z.number().int().positive()
const account = z.object({ id, name: z.string(), email: z.email(), avatarUrl: z.string().nullable() })
const edition = z.object({ id, name: z.string(), availableQuantity: integer })
const nft = z.object({
  id, name: z.string(), description: z.string(), collection: z.string(), imageUrl: z.string(),
  gallery: z.array(z.string()), priceEth: ethAmountSchema, editions: z.array(edition),
  availableQuantity: integer, version, createdAt: date,
})
const cart = z.object({
  id, owner: z.object({ kind: z.enum(['guest', 'user']), id }),
  items: z.array(z.object({ id, nftId: id, editionId: id, quantity: z.number().int().positive() })),
  couponCode: z.string().nullable(), version,
})
const totals = {
  subtotalEth: ethAmountSchema, discountEth: ethAmountSchema, networkFeeEth: ethAmountSchema, totalEth: ethAmountSchema,
}
const line = z.object({
  nftId: id, editionId: id, name: z.string(), editionName: z.string(), imageUrl: z.string(),
  quantity: z.number().int().positive(), unitPriceEth: ethAmountSchema, subtotalEth: ethAmountSchema, nftVersion: version,
})
const quote = z.object({
  id, cartId: id, cartVersion: version, lines: z.array(line), ...totals, network: networkSchema,
  couponCode: z.string().nullable(), expiresAt: date, version,
})
const order = z.object({
  id, userId: id, status: z.enum(['pending', 'confirmed', 'declined']),
  snapshot: z.object({
    lines: z.array(line), ...totals, collector: collectorSchema, walletAddress: z.string(),
    network: networkSchema, couponCode: z.string().nullable(),
  }),
  transactionReference: z.string().nullable(), declineReason: z.string().nullable(),
  createdAt: date, updatedAt: date, version,
})
export const databaseSchema: z.ZodType<MockDatabase> = z.object({
  schemaVersion: z.literal(1), sequence: integer, scenario: scenarioIdSchema,
  clock: z.object({ fixedNow: z.number().nullable(), offsetMs: z.number() }),
  latencyMs: integer.nullable(), requestCounts: z.record(z.string(), integer), effects: z.array(z.string()),
  users: z.array(account.extend({ passwordHash: z.string(), passwordSalt: z.string() })),
  sessions: z.array(z.object({ token: id, userId: id, expiresAt: date })),
  nfts: z.array(nft), favorites: z.record(z.string(), z.array(id)), carts: z.array(cart),
  profiles: z.array(profileInputSchema.extend({ userId: id, avatarUrl: z.string().nullable() })),
  wallets: z.array(walletInputSchema.extend({ id, userId: id })),
  coupons: z.array(z.object({ code: id, discountRate: z.string().regex(/^0(?:\.\d+)?$|^1$/), expiresAt: date })),
  quotes: z.array(z.object({ userId: id, quote, orderId: id.nullable() })),
  orders: z.array(order),
  idempotency: z.array(z.object({ userId: id, key: id, fingerprint: z.string(), orderId: id })),
  payments: z.array(z.object({ orderId: id, dueAt: date, outcome: z.enum(['confirmed', 'declined']) })),
})
