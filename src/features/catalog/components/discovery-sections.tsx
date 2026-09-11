import { ArrowRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NFT } from '@/contracts/nft'

// Editorial copy is static; collection identities and artworks always come from HTTP.
const articles = [
  { title: 'Como funciona a propriedade de NFTs', text: 'Um NFT identifica um registro digital. Os direitos de uso de uma obra dependem da licença definida pelo criador.', icon: '01' },
  { title: 'Um olhar para novos criadores', text: 'Explore coleções, conheça diferentes linguagens e observe os detalhes que tornam cada obra única.', icon: '02' },
  { title: 'Raridade, atributos e procedência', text: 'Leia a descrição da coleção e confira seus atributos. Uma edição limitada é uma característica da obra, não uma promessa de valor.', icon: '03' },
  { title: 'Sua coleção começa com curiosidade', text: 'Use a busca e combine filtros para descobrir obras. Neste marketplace, todas as contas e transações serão simuladas.', icon: '04' },
]
export function DiscoverySections({ items }: { items: NFT[] }) {
  const first = items[0]
  const second = items.find((item) => item.collection !== first?.collection)
  return <div className="space-y-14">
    <section aria-label="Explore o marketplace" className="grid gap-6 md:grid-cols-2">
      {[{ title: 'Novas obras para sua coleção', text: 'Descubra os lançamentos do catálogo.', image: first },
        { title: 'Arte digital e muito mais', text: 'Explore coleções e novas perspectivas.', image: second }].map((panel) => <article key={panel.title} className="grid grid-cols-[1fr_1.1fr] items-center overflow-hidden rounded-lg bg-card">
          {panel.image ? <img src={panel.image.imageUrl} alt={panel.image.name} width={480} height={480} loading="lazy" className="aspect-square h-full w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-secondary"><BookOpen className="size-8 text-primary" aria-hidden="true" /></div>}
          <div className="space-y-3 p-4 text-center"><h2 className="type-card">{panel.title}</h2><p className="type-caption text-muted-foreground">{panel.text}</p><Button asChild size="sm"><a href="#catalog">Explorar<ArrowRight aria-hidden="true" /></a></Button></div>
        </article>)}
    </section>
    <section id="journal" aria-labelledby="journal-title" className="scroll-mt-6 space-y-7">
      <div className="space-y-2 text-center"><h2 id="journal-title" className="type-section">Diário da Cunhagem</h2><p className="type-caption text-muted-foreground">Histórias e ideias para explorar o universo da arte digital.</p></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{articles.map((article, index) => <article key={article.title} className="overflow-hidden rounded-md bg-card">
        {items[index] ? <img src={items[index].imageUrl} alt="" width={480} height={360} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-secondary text-4xl text-primary" aria-hidden="true">{article.icon}</div>}
        <div className="space-y-3 p-4"><p className="type-caption text-primary">Notas da Kurio · {article.icon}</p><h3 className="type-card">{article.title}</h3><p className="type-caption text-muted-foreground">{article.text}</p></div>
      </article>)}</div>
    </section>
  </div>
}
