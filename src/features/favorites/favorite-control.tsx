import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { CanceledError } from 'axios'
import type { Favorites } from '@/contracts/favorites'
import { privateKeys, sessionKeys } from '@/app/query/keys'
import { useServices } from '@/app/providers/services-context'
import { useSession } from '@/features/auth/hooks/use-session'
import { safeReturnTo } from '@/features/auth/redirect'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'

export function FavoriteControl({ nftId, name }: { nftId: string; name: string }) {
  const { api, sessionLifecycle } = useServices()
  const client = useQueryClient()
  const session = useSession()
  const changing = useIsMutating({ mutationKey: sessionKeys.mutations }) > 0
  const userId = session.data?.user.id
  const generation = sessionLifecycle.current()
  const key = privateKeys.favorites(userId ?? 'anonymous')
  const writing = useIsMutating({ mutationKey: key }) > 0
  const navigate = useNavigate()
  const href = useLocation({ select: (location) => location.href })
  const query = useQuery({
    queryKey: key,
    enabled: !!userId && !changing && !writing,
    queryFn: async ({ signal }) => {
      sessionLifecycle.assertCurrent(generation)
      const { data } = await api.get<Favorites>('/favorites', { signal })
      sessionLifecycle.assertCurrent(generation)
      if (data.userId !== userId) throw new CanceledError('Account changed')
      return data
    },
  })
  const mutation = useMutation({
    mutationKey: [...key, 'mutation'],
    scope: { id: (userId ?? '') + ':favorites' },
    gcTime: 0,
    onMutate: async (favorite: boolean) => {
      sessionLifecycle.assertCurrent(generation)
      await client.cancelQueries({ queryKey: key })
      sessionLifecycle.assertCurrent(generation)
      const previous = client.getQueryData<Favorites>(key)
      if (previous) client.setQueryData<Favorites>(key, { ...previous, nftIds: favorite ? [...new Set([...previous.nftIds, nftId])] : previous.nftIds.filter((id) => id !== nftId) })
      return { previous }
    },
    mutationFn: async (favorite: boolean) => {
      sessionLifecycle.assertCurrent(generation)
      if (!userId) throw new CanceledError('Login required')
      if (favorite) await api.post('/favorites/' + encodeURIComponent(nftId))
      else await api.delete('/favorites/' + encodeURIComponent(nftId))
      sessionLifecycle.assertCurrent(generation)
    },
    onError: (_error, _input, context) => {
      if (sessionLifecycle.current() === generation && context?.previous) client.setQueryData(key, context.previous)
    },
    onSettled: () => { if (sessionLifecycle.current() === generation) void client.invalidateQueries({ queryKey: key }) },
  })
  const selected = !!userId && !changing && (query.data?.nftIds.includes(nftId) ?? false)
  return <div className="space-y-3">
    <Button variant="outline" aria-label={(selected ? 'Remover favorito ' : 'Favoritar ') + name} aria-pressed={selected} disabled={changing || session.isPending || writing || !!userId && query.isPending} onClick={() => {
      if (!userId) { void navigate({ to: '/login', search: { redirect: safeReturnTo(href) } }); return }
      if (query.isError) { void query.refetch(); return }
      mutation.mutate(!selected)
    }}><Heart aria-hidden="true" className={selected ? 'fill-primary text-primary' : ''} />{query.isError ? 'Tentar carregar favoritos' : selected ? 'Remover favorito' : 'Favoritar'}</Button>
    {mutation.isError && <InlineAlert variant="error">Não foi possível alterar o favorito. O estado anterior foi restaurado. Tente novamente.</InlineAlert>}
    {query.isError && <InlineAlert variant="error">Não foi possível carregar seus favoritos.</InlineAlert>}
    {mutation.isSuccess && <p role="status" className="type-small text-success">{mutation.variables ? 'Favorito adicionado.' : 'Favorito removido.'}</p>}
  </div>
}
