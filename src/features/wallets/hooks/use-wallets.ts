import type { Wallet } from '@/contracts/wallet'
import { privateKeys } from '@/app/query/keys'
import { useServices } from '@/app/providers/services-context'
import { useAccountIdentity } from '@/features/account/account-context'
import { useAccountMutation, useAccountResource } from '@/features/account/use-account-resource'
import { getWallets, saveWallet } from '../api/wallets'
export const useWallets = () => useAccountResource('wallets', getWallets, (wallets, id) => wallets.every((wallet) => wallet.userId === id))
export function useSaveWallet() {
  const { queryClient } = useServices()
  const { userId } = useAccountIdentity()
  return useAccountMutation('wallets', saveWallet, (wallet) => {
    if (wallet.userId !== userId) return
    queryClient.setQueryData<Wallet[]>(privateKeys.wallets(userId), (previous) => previous
      ? [...previous.filter((entry) => entry.id !== wallet.id), wallet] : undefined)
    void queryClient.invalidateQueries({ queryKey: privateKeys.wallets(userId) })
  })
}
