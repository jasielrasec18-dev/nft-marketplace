import { createContext, useContext } from 'react'
export const AccountContext = createContext<{ userId: string; generation: number } | null>(null)
export function useAccountIdentity() {
  const identity = useContext(AccountContext)
  if (!identity) throw new Error('Account layout required')
  return identity
}
