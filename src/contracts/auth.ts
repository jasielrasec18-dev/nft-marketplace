import { z } from 'zod'
import type { IsoDate, ResourceId } from './common'

export interface Account {
  id: ResourceId
  name: string
  email: string
  avatarUrl: string | null
}

export type Session = { user: Account; expiresAt: IsoDate } | null

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Informe seu nome.'),
  password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
})
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
