import { useRef, useState } from 'react'
import { isCancel } from 'axios'
import { UserRound } from 'lucide-react'
import { avatarSchema } from '@/contracts/requests'
import type { Profile } from '@/contracts/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { useUpdateAvatar } from '../hooks/use-profile'
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}
export function AvatarForm({ profile }: { profile: Profile }) {
  const update = useUpdateAvatar()
  const fileInput = useRef<HTMLInputElement>(null)
  const selection = useRef(0)
  const [preview, setPreview] = useState<string>()
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)
  const pending = reading || update.isPending
  return <section aria-labelledby="avatar-title" className="space-y-4 border-t border-border pt-6">
    <h2 id="avatar-title" className="type-section">Avatar</h2>
    <div className="flex flex-wrap items-center gap-5">
      {profile.avatarUrl ? <img src={profile.avatarUrl} alt={'Avatar de ' + profile.name} className="size-20 rounded-full object-cover" /> : <div role="img" aria-label={'Avatar de ' + profile.name + ' ainda não definido'} className="flex size-20 items-center justify-center rounded-full bg-card"><UserRound className="size-8 text-primary" /></div>}
      {preview && <figure className="space-y-2"><img src={preview} alt="Prévia do novo avatar, ainda não salvo" className="size-20 rounded-full object-cover" /><figcaption className="type-caption text-muted-foreground">Prévia — ainda não salva</figcaption></figure>}
    </div>
    <form aria-label="Atualizar avatar" className="max-w-lg space-y-4" onSubmit={async (event) => {
      event.preventDefault()
      if (!preview || pending) return
      setError(undefined); setSuccess(false)
      try { await update.submit({ imageDataUrl: preview }); setPreview(undefined); if (fileInput.current) fileInput.current.value = ''; setSuccess(true) }
      catch (cause) { if (!isCancel(cause)) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o avatar.'); fileInput.current?.focus() } }
    }}>
      <FormField label="Escolher imagem" description="PNG, JPEG ou WebP de até 250 KB." error={error}>{(props) => <Input {...props} ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" disabled={pending} onChange={async (event) => {
        const file = event.target.files?.[0]
        const current = ++selection.current
        setPreview(undefined); setError(undefined); setSuccess(false)
        if (!file) return
        if (file.size > 250 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Use uma imagem PNG, JPEG ou WebP de até 250 KB.'); return }
        setReading(true)
        try { const data = await readImage(file); const parsed = avatarSchema.safeParse({ imageDataUrl: data }); if (!parsed.success) throw new Error('Use uma imagem PNG, JPEG ou WebP de até 250 KB.'); if (current === selection.current) setPreview(parsed.data.imageDataUrl) }
        catch (cause) { if (current === selection.current) setError(cause instanceof Error ? cause.message : 'Não foi possível ler a imagem.') }
        finally { if (current === selection.current) setReading(false) }
      }} />}</FormField>
      {success && <InlineAlert variant="success">Avatar atualizado.</InlineAlert>}
      <Button type="submit" disabled={!preview || pending} aria-busy={pending}>{pending ? 'Processando imagem…' : 'Salvar avatar'}</Button>
    </form>
  </section>
}
