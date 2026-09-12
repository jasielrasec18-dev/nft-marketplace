import { databaseSchema } from './schema'
import type { MockDatabase } from './types'
import { demoArtwork } from '../fixtures/artwork'

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
        const database = databaseSchema.parse(JSON.parse(serialized))

        const isTemplate = (url: string) => /(?:^|\/)hero(?:-[\w-]+)?\.png(?:$|\?)/.test(url)
        const currentArtwork = (url: string, collection: string) => isTemplate(url)
          ? demoArtwork(collection)
          : /^\/artwork\/(?:golden|jungle|cosmic|pixel|default)\.svg$/.test(url) ? url.replace(/\.svg$/, '.png') : url
        for (const nft of database.nfts) {
          nft.imageUrl = currentArtwork(nft.imageUrl, nft.collection)
          nft.gallery = nft.gallery.map((url) => currentArtwork(url, nft.collection))
        }
        return database
      } catch {
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
