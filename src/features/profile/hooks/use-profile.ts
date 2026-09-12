import type { Profile } from '@/contracts/profile'
import type { Session } from '@/contracts/auth'
import { privateKeys, sessionKeys } from '@/app/query/keys'
import { useServices } from '@/app/providers/services-context'
import { useAccountIdentity } from '@/features/account/account-context'
import { useAccountMutation, useAccountResource } from '@/features/account/use-account-resource'
import { getProfile, updateProfile, updateAvatar, updatePassword } from '../api/profile'
export const useProfile = () => useAccountResource('profile', getProfile, (profile, id) => profile.userId === id)
function useAcceptProfile() {
  const { queryClient } = useServices()
  const { userId } = useAccountIdentity()
  return (profile: Profile) => {
    if (profile.userId !== userId) return
    queryClient.setQueryData(privateKeys.profile(userId), profile)
    queryClient.setQueryData<Session>(sessionKeys.all, (session) => session?.user.id === userId
      ? { ...session, user: { ...session.user, name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl } } : session)
  }
}
export function useUpdateProfile() { return useAccountMutation('profile', updateProfile, useAcceptProfile()) }
export function useUpdateAvatar() { return useAccountMutation('profile', updateAvatar, useAcceptProfile()) }
export function useUpdatePassword() { return useAccountMutation('profile', updatePassword, () => {}) }
