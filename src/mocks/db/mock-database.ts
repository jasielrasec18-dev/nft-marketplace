import type { ResetMockInput } from '@/contracts/mock-control'
import { createFixtures } from '../fixtures/database'
import { createPersistence, type MockStorage } from './persistence'
import type { MockDatabase } from './types'

export async function createMockDatabase(storage: MockStorage, initial: ResetMockInput = {}) {
  const persistence = createPersistence(storage)
  let state = persistence.load() ?? await createFixtures(initial)
  persistence.save(state)
  let queue: Promise<unknown> = Promise.resolve()
  let generation = 0

  function enqueue<T>(operation: () => Promise<T> | T): Promise<T> {
    const result = queue.then(operation)
    queue = result.catch(() => undefined)
    return result
  }

  return {
    get generation() { return generation },
    read(): MockDatabase { return structuredClone(state) },
    transaction<T>(operation: (draft: MockDatabase) => T | Promise<T>): Promise<T> {
      return enqueue(async () => {
        const draft = structuredClone(state)
        const result = await operation(draft)
        // Persist before publishing, so failed writes never report success.
        persistence.save(draft)
        state = draft
        return result
      })
    },
    reset(input: ResetMockInput = {}): Promise<void> {
      return enqueue(async () => {
        const fresh = await createFixtures(input)
        persistence.save(fresh)
        state = fresh
        generation += 1
      })
    },
  }
}
export type MockDatabaseStore = Awaited<ReturnType<typeof createMockDatabase>>
