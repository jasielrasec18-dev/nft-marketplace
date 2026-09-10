import { z } from 'zod'
import type { ResourceId } from './common'

export const networkSchema = z.enum(['ethereum', 'polygon'])
export type Network = z.infer<typeof networkSchema>
export const walletInputSchema = z.object({
  label: z.string().trim().min(2, 'Informe um nome para a carteira.').max(60),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço simulado válido.'),
  network: networkSchema,
  role: z.enum(['primary', 'secondary']),
})
export type WalletInput = z.infer<typeof walletInputSchema>
export interface Wallet extends WalletInput {
  id: ResourceId
  userId: ResourceId
}
export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'declined'
