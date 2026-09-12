import type { AxiosInstance } from 'axios'
import type { Profile, ProfileInput, PasswordChangeInput, AvatarInput } from '@/contracts/profile'
export const getProfile = async (api: AxiosInstance, signal: AbortSignal) => (await api.get<Profile>('/profile', { signal })).data
export const updateProfile = async (api: AxiosInstance, input: ProfileInput) => (await api.patch<Profile>('/profile', input)).data
export const updateAvatar = async (api: AxiosInstance, input: AvatarInput) => (await api.patch<Profile>('/profile/avatar', input)).data
export const updatePassword = async (api: AxiosInstance, input: PasswordChangeInput) => { await api.patch('/profile/password', input) }
