export function createRealtimeState() {
  let revision = 0
  let reconnects = 0
  const versions = new Map<string, number>()
  const eventIds = new Set<string>()
  const listeners = new Set<() => void>()
  const notify = () => { revision++; listeners.forEach((listener) => listener()) }
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    snapshot: () => revision,
    fingerprint(ids: string[]) { return JSON.stringify([reconnects, ids.map((id) => [id, versions.get(id) ?? 0])]) },
    accept(id: string, version: number, eventId: string) {
      if (eventIds.has(eventId) || version <= (versions.get(id) ?? 0)) return false
      eventIds.add(eventId)
      if (eventIds.size > 512) eventIds.delete(eventIds.values().next().value!)
      versions.delete(id); versions.set(id, version)
      if (versions.size > 256) versions.delete(versions.keys().next().value!)
      notify(); return true
    },
    reconnected() { reconnects++; notify() },
  }
}
