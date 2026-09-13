import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { NFT } from '@/contracts/nft'
import { Button } from '@/components/ui/button'
import { artworkSources } from '@/lib/artwork'

function Artwork({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  return failed || !src
    ? <div role="img" aria-label="Imagem da obra indisponível" className="flex aspect-square items-center justify-center rounded-xl bg-secondary text-muted-foreground"><ImageOff className="size-12" aria-hidden="true" /></div>
    : <img src={src} {...artworkSources(src, '(min-width: 768px) 50vw, 90vw')} alt={name} width={480} height={480} fetchPriority="high" decoding="async" onError={() => setFailed(true)} className="aspect-square w-full rounded-xl object-cover sm:rounded-md" />
}

export function NFTGallery({ nft }: { nft: NFT }) {
  const images = [...new Set([nft.imageUrl, ...nft.gallery].filter(Boolean))]
  const [selected, setSelected] = useState(images[0] ?? '')
  const current = images.includes(selected) ? selected : images[0] ?? ''
  return <section aria-label="Galeria do NFT" className={images.length > 1 ? 'min-w-0 lg:grid lg:grid-cols-[4rem_minmax(0,1fr)] lg:gap-4' : 'min-w-0'}>
    <div className="rounded-2xl bg-card p-3 sm:rounded-md lg:col-start-2"><Artwork key={current} src={current} name={nft.name} /></div>
    {images.length > 1 && <div role="group" aria-label="Selecionar imagem" className="mt-3 flex flex-wrap gap-3 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:flex-col">
      {images.map((src, index) => <Button key={src} variant="outline" aria-label={`Ver imagem ${index + 1} de ${nft.name}`} aria-pressed={current === src} onClick={() => setSelected(src)} className="size-16 overflow-hidden p-1 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary">
        <img src={src} alt="" width={64} height={64} loading="lazy" className="aspect-square w-full rounded-sm object-cover" />
      </Button>)}
    </div>}
  </section>
}
