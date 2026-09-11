import type { MockDatabase } from '../db/types'

export function now(db: MockDatabase): number {
  return (db.clock.fixedNow ?? Date.now()) + db.clock.offsetMs
}
export function isoNow(db: MockDatabase): string { return new Date(now(db)).toISOString() }
export function expiresIn(db: MockDatabase, milliseconds: number): string {
  return new Date(now(db) + milliseconds).toISOString()
}
export function nextId(db: MockDatabase, prefix: string): string {
  db.sequence += 1
  return `${prefix}-${String(db.sequence).padStart(6, '0')}`
}
