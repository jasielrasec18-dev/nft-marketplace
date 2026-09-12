import { z } from 'zod'

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value) || [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return '/'
  try {
    const url = new URL(value, 'https://marketplace.invalid')
    const pathname = decodeURIComponent(url.pathname)
    const allowed = pathname === '/' || /^\/nfts\/[a-zA-Z0-9_-]+$/.test(pathname) ||
      /^\/(checkout|account\/(profile|wallets)|orders(?:\/[a-zA-Z0-9_-]+)?)$/.test(pathname)
    if (url.origin !== 'https://marketplace.invalid' || !allowed) return '/'
    return url.pathname + url.search + url.hash
  } catch { return '/' }
}
export const authSearchSchema = z.object({
  redirect: z.unknown().optional().transform(safeReturnTo).catch('/'),
  reason: z.enum(['expired']).optional().catch(undefined),
})
