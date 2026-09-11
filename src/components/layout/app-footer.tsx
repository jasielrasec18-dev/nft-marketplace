import { Gem, Palette, Sparkles } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'

const pillars = [
  { icon: Gem, title: 'Sua coleção', text: 'Um espaço para descobrir arte digital.' },
  { icon: Palette, title: 'Criadores em destaque', text: 'Arte e histórias de quem cria.' },
  { icon: Sparkles, title: 'Novas descobertas', text: 'Explore diferentes formas de expressão.' },
]
export function AppFooter() {
  return <footer className="mt-12 pb-6">
    <PageContainer>
      <div className="grid gap-6 bg-card p-6 sm:grid-cols-3">{pillars.map(({ icon: Icon, title, text }) => <div key={title} className="space-y-3 sm:border-l sm:border-primary/40 sm:pl-5 first:sm:border-0 first:sm:pl-0">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden="true" /></span>
        <h2 className="type-card">{title}</h2><p className="type-caption text-muted-foreground">{text}</p>
      </div>)}</div>
      <div className="flex flex-col gap-3 bg-secondary px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><span className="type-label tracking-widest">KURIO</span><p className="type-caption text-muted-foreground">Feito para colecionadores, criadores e cultura.</p></div>
      <p className="type-caption pt-5 text-center text-muted-foreground">Jungle Gaming · Frontend Challenge · Demonstração</p>
    </PageContainer>
  </footer>
}
