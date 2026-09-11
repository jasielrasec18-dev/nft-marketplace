import type { StoredUser } from '../db/types'
import { hashPassword } from '../utils/password'

export async function createUsers(): Promise<StoredUser[]> {
  return Promise.all([
    { id: 'user-1', name: 'Alex Collector', email: 'collector@example.com' },
    { id: 'user-2', name: 'Sam Collector', email: 'second@example.com' },
  ].map(async (user) => {
    const passwordSalt = `jungle-demo-${user.id}`
    return { ...user, avatarUrl: null, passwordSalt, passwordHash: await hashPassword('Jungle123!', passwordSalt) }
  }))
}
