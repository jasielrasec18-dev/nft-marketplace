import type { Account, Session } from '@/contracts/auth'
import { getScenario } from '../scenarios/config'
import { cookie, fail } from '../utils/responses'
import { expiresIn, now } from '../utils/clock'
import type { MockDatabase, StoredUser } from './types'

export function account(user: StoredUser): Account {
  return { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
}
export function currentUser(db: MockDatabase, request: Request, required = true): StoredUser | null {
  const token = cookie(request, 'jungle_session')
  if (!token) return required ? fail(401, 'UNAUTHORIZED', 'Entre para continuar.') : null
  const session = db.sessions.find((item) => item.token === token)
  if (!session) return fail(401, 'UNAUTHORIZED', 'Sessão inválida. Entre novamente.')
  if (Date.parse(session.expiresAt) <= now(db)) return fail(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  if (getScenario(db.scenario).unauthorized) return fail(401, 'UNAUTHORIZED', 'Acesso não autorizado neste cenário.')
  return db.users.find((user) => user.id === session.userId) ?? fail(401, 'UNAUTHORIZED', 'Sessão inválida.')
}
export function requireUser(db: MockDatabase, request: Request): StoredUser {
  return currentUser(db, request) ?? fail(401, 'UNAUTHORIZED', 'Entre para continuar.')
}
export function createSession(db: MockDatabase, user: StoredUser, request: Request): { session: Session; token: string } {
  const previousToken = cookie(request, 'jungle_session')
  db.sessions = db.sessions.filter((session) => session.token !== previousToken)
  const token = crypto.randomUUID()
  const expiresAt = expiresIn(db, getScenario(db.scenario).sessionLifetimeMs)
  db.sessions.push({ token, userId: user.id, expiresAt })
  return { session: { user: account(user), expiresAt }, token }
}
