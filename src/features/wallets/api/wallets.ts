import type { AxiosInstance } from 'axios'
import type { Wallet, WalletInput } from '@/contracts/wallet'
export const getWallets = async (api: AxiosInstance, signal: AbortSignal) => (await api.get<Wallet[]>('/wallets', { signal })).data
export async function saveWallet(api: AxiosInstance, input: { id?: string; values: WalletInput }) {
  return input.id ? (await api.patch<Wallet>('/wallets/' + encodeURIComponent(input.id), input.values)).data
    : (await api.post<Wallet>('/wallets', input.values)).data
}
