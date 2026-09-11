import { Link, useParams, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NFTPlaceholderPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const search = useSearch({ from: '/nfts/$nftId' })
  return <section className="max-w-2xl space-y-5">
    <p className="type-label text-primary">NFT · {nftId}</p>
    <h1 className="type-page">Detalhes do NFT</h1>
    <p className="type-body text-muted-foreground">Esta página está em construção. Os detalhes da obra serão implementados na próxima etapa.</p>
    <Button asChild><Link to="/" search={search} hash="catalog">Voltar ao catálogo</Link></Button>
  </section>
}
