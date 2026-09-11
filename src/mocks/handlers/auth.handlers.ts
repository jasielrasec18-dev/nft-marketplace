import { http, HttpResponse } from 'msw'
import { loginSchema, registerSchema, type Session } from '@/contracts/auth'
import type { HandlerContext } from './context'
import { readBody, fail, cookie, sessionCookie } from '../utils/responses'
import { hashPassword } from '../utils/password'
import { nextId } from '../utils/clock'
import { account, createSession, currentUser } from '../db/session'
import { mergeGuestCart } from '../db/cart'
import { getScenario } from '../scenarios/config'

export function authHandlers(ctx: HandlerContext) {
  return [
    http.post(ctx.url('/auth/register'), ctx.wrap('auth.register', async (db, request) => {
      const input = await readBody(request, registerSchema.strict())
      const email = input.email.trim().toLowerCase()
      if (getScenario(db.scenario).registerConflict || db.users.some((user) => user.email === email)) {
        fail(409, 'EMAIL_ALREADY_EXISTS', 'Este e-mail já está cadastrado.')
      }
      const id = nextId(db, 'user')
      const passwordSalt = `jungle-demo-${id}`
      const user = {
        id, name: input.name, email, avatarUrl: null,
        passwordSalt, passwordHash: await hashPassword(input.password, passwordSalt),
      }
      db.users.push(user)
      db.profiles.push({ userId: id, name: input.name, email, bio: '', avatarUrl: null })
      db.favorites[id] = []
      mergeGuestCart(db, request, id)
      const result = createSession(db, user, request)
      return HttpResponse.json(result.session, { status: 201, headers: { 'Set-Cookie': sessionCookie(result.token) } })
    })),
    http.post(ctx.url('/auth/login'), ctx.wrap('auth.login', async (db, request) => {
      const input = await readBody(request, loginSchema.strict())
      const user = db.users.find((item) => item.email === input.email.trim().toLowerCase())
      if (!user || await hashPassword(input.password, user.passwordSalt) !== user.passwordHash) {
        fail(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.')
      }
      mergeGuestCart(db, request, user.id)
      const result = createSession(db, user, request)
      return HttpResponse.json(result.session, { headers: { 'Set-Cookie': sessionCookie(result.token) } })
    })),
    http.get(ctx.url('/auth/session'), ctx.wrap('auth.session', (db, request) => {
      const user = currentUser(db, request, false)
      if (!user) return HttpResponse.json<Session>(null)
      const session = db.sessions.find((item) => item.token === cookie(request, 'jungle_session'))
        ?? fail(401, 'UNAUTHORIZED', 'Sessão inválida.')
      return HttpResponse.json<Session>({ user: account(user), expiresAt: session.expiresAt })
    })),
    http.post(ctx.url('/auth/logout'), ctx.wrap('auth.logout', (db, request) => {
      db.sessions = db.sessions.filter((session) => session.token !== cookie(request, 'jungle_session'))
      return new HttpResponse(null, { status: 204, headers: { 'Set-Cookie': sessionCookie('') } })
    })),
  ]
}
