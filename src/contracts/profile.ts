import { z } from 'zod'
import type { ResourceId } from './common'

export const profileInputSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(100),
  email: z.email('Informe um e-mail válido.'),
  bio: z.string().max(500).default(''),
})
export type ProfileInput = z.infer<typeof profileInputSchema>
export interface Profile extends ProfileInput {
  userId: ResourceId
  avatarUrl: string | null
}
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Informe sua senha atual.'),
  newPassword: z.string().min(8, 'Use pelo menos 8 caracteres.'),
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'As senhas devem ser iguais.',
})
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export interface AvatarInput { imageDataUrl: string }
