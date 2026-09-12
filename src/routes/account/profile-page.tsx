import { useProfile } from '@/features/profile/hooks/use-profile'
import { ProfileForm } from '@/features/profile/components/profile-form'
import { AvatarForm } from '@/features/profile/components/avatar-form'
import { PasswordForm } from '@/features/profile/components/password-form'
import { AccountSkeleton } from '@/features/account/account-skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
export function ProfilePage() {
  const profile = useProfile()
  return <div className="max-w-4xl space-y-6"><h1 className="type-page">Perfil do colecionador</h1>
    {profile.isPending ? <AccountSkeleton label="Carregando perfil" /> : !profile.data ? <ErrorState title="Não foi possível carregar o perfil" description={profile.error?.message} onRetry={() => void profile.refetch()} />
      : <>{profile.isError && <InlineAlert variant="warning">Os últimos dados do perfil foram mantidos.</InlineAlert>}<ProfileForm profile={profile.data} /><AvatarForm profile={profile.data} /><PasswordForm /></>}
  </div>
}
