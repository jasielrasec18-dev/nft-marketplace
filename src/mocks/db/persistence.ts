import { databaseSchema } from './schema'
import type { MockDatabase } from './types'

export const DATABASE_KEY = 'jungle.mock-database.v1'
export interface MockStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
export function createPersistence(storage: MockStorage) {
  return {
    load(): MockDatabase | null {
      const serialized = storage.getItem(DATABASE_KEY)
      if (!serialized) return null
      try {
        return databaseSchema.parse(JSON.parse(serialized))
      } catch {
        // Old or corrupted mock data cannot enter the running database.
        storage.removeItem(DATABASE_KEY)
        return null
      }
    },
    save(database: MockDatabase) { storage.setItem(DATABASE_KEY, JSON.stringify(database)) },
    clear() { storage.removeItem(DATABASE_KEY) },
  }
}
export function createMemoryStorage(): MockStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}
