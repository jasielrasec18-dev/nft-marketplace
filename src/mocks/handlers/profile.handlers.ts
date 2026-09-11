import { http, HttpResponse } from 'msw'
import { profileInputSchema, passwordChangeSchema } from '@/contracts/profile'
import { avatarSchema } from '@/contracts/requests'
import { requireUser } from '../db/session'
import { readBody, fail, cookie } from '../utils/responses'
import { hashPassword } from '../utils/password'
import type { HandlerContext } from './context'

export function profileHandlers(ctx: HandlerContext) {
  return [
    http.get(ctx.url('/profile'), ctx.wrap('profile.get', (db, request) => {
      const user = requireUser(db, request)
      return HttpResponse.json(db.profiles.find((item) => item.userId === user.id) ?? fail(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.'))
    })),
    http.patch(ctx.url('/profile'), ctx.wrap('profile.update', async (db, request) => {
      const user = requireUser(db, request)
      const input = await readBody(request, profileInputSchema.partial().strict().refine((value) => Object.keys(value).length > 0, 'Informe um campo.'))
      const profile = db.profiles.find((item) => item.userId === user.id) ?? fail(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.')
      const email = input.email?.trim().toLowerCase()
      if (email && db.users.some((item) => item.id !== user.id && item.email === email)) fail(409, 'EMAIL_ALREADY_EXISTS', 'Este e-mail já está cadastrado.')
      if (input.name !== undefined) { profile.name = input.name; user.name = input.name }
      if (email !== undefined) { profile.email = email; user.email = email }
      if (input.bio !== undefined) profile.bio = input.bio
      return HttpResponse.json(profile)
    })),
    http.patch(ctx.url('/profile/password'), ctx.wrap('profile.password', async (db, request) => {
      const user = requireUser(db, request)
      const input = await readBody(request, passwordChangeSchema)
      if (await hashPassword(input.currentPassword, user.passwordSalt) !== user.passwordHash) {
        fail(422, 'INVALID_CREDENTIALS', 'A senha atual não confere.')
      }
      user.passwordHash = await hashPassword(input.newPassword, user.passwordSalt)
      const currentToken = cookie(request, 'jungle_session')
      db.sessions = db.sessions.filter((session) => session.userId !== user.id || session.token === currentToken)
      return new HttpResponse(null, { status: 204 })
    })),
    http.patch(ctx.url('/profile/avatar'), ctx.wrap('profile.avatar', async (db, request) => {
      const user = requireUser(db, request)
      const input = await readBody(request, avatarSchema)
      const profile = db.profiles.find((item) => item.userId === user.id) ?? fail(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.')
      user.avatarUrl = input.imageDataUrl
      profile.avatarUrl = input.imageDataUrl
      return HttpResponse.json(profile)
    })),
  ]
}
