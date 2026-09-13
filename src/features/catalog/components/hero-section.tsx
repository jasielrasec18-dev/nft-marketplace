import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { NFT } from '@/contracts/nft'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageOff } from 'lucide-react'
import { artworkSources } from '@/lib/artwork'

export function HeroSection({ nft, loading }: { nft?: NFT; loading: boolean }) {
  return <section aria-labelledby="hero-title" className="grid grid-cols-[1.1fr_1fr] items-center gap-4 rounded-xl bg-card p-4 sm:gap-8 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:bg-transparent lg:px-8 lg:py-0">
    <div className="space-y-3 sm:space-y-5">
      <p className="type-caption text-muted-foreground">Bem-vindo à Kurio</p>
      <h1 id="hero-title" className="text-base leading-snug font-bold uppercase tracking-tight sm:text-3xl lg:text-4xl">Seja dono do futuro da arte digital</h1>
      <p className="type-caption max-w-lg text-muted-foreground sm:text-sm"><span className="sm:hidden">Descubra NFTs selecionados e novas formas de criar.</span><span className="hidden sm:inline">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital e faça parte da cultura da internet.</span></p>
      <Button asChild size="sm" className="rounded-full sm:rounded-md"><a href="#catalog">Explorar<ArrowRight aria-hidden="true" /></a></Button>
    </div>
    <div className="min-w-0">
      {nft ? <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="block rounded-xl"><img src={nft.imageUrl} {...artworkSources(nft.imageUrl, '(min-width: 1024px) 480px, 45vw')} alt={nft.name} width={480} height={480} fetchPriority="high" loading="eager" className="aspect-square w-full rounded-xl object-cover" /></Link> :
        loading ? <Skeleton className="aspect-square w-full rounded-xl" /> : <div className="flex aspect-square items-center justify-center rounded-xl bg-secondary"><ImageOff className="size-10 text-muted-foreground" aria-label="Imagem de destaque indisponível" /></div>}
    </div>
  </section>
}
