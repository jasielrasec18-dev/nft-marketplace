import { Gem, Palette, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'

const pillars = [
  { icon: Gem, title: 'Sua coleção', text: 'Um espaço para descobrir arte digital.' },
  { icon: Palette, title: 'Criadores em destaque', text: 'Arte e histórias de quem cria.' },
  { icon: Sparkles, title: 'Novas descobertas', text: 'Explore diferentes formas de expressão.' },
]
export function AppFooter() {
  return <footer className="mt-12 pb-24 lg:pb-6">
    <PageContainer>
      <div className="grid gap-6 bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">{pillars.map(({ icon: Icon, title, text }) => <div key={title} className="space-y-3 sm:border-l sm:border-primary/40 sm:pl-5 first:sm:border-0 first:sm:pl-0">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden="true" /></span>
        <h2 className="type-card">{title}</h2><p className="type-caption text-muted-foreground">{text}</p>
      </div>)}
        <div className="space-y-3"><h2 className="type-card">Antecipe-se ao próximo lançamento</h2><FormField label="Newsletter" description="Inscrições disponíveis em breve.">{(props) => <Input {...props} type="email" disabled placeholder="Seu e-mail" />}</FormField><Button disabled size="sm">Em breve</Button></div>
      </div>
      <div className="flex flex-col gap-3 bg-secondary px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><span className="type-label tracking-widest">KURIO</span><p className="type-caption text-muted-foreground">Feito para colecionadores, criadores e cultura.</p></div>
      <div className="grid gap-6 bg-card p-6 sm:grid-cols-3">
        <div><h2 className="type-card">Explore</h2><nav aria-label="Links do rodapé" className="mt-2 flex flex-col items-start"><Link to="/" className="type-caption inline-flex min-h-11 items-center">Início</Link><Link to="/" search hash="catalog" className="type-caption inline-flex min-h-11 items-center">Catálogo de NFTs</Link><Link to="/" search hash="journal" className="type-caption inline-flex min-h-11 items-center">Diário da Cunhagem</Link></nav></div>
        <div className="space-y-3"><h2 className="type-card">Meu perfil</h2><nav aria-label="Conta" className="flex flex-col items-start"><Link to="/account/profile" className="type-caption inline-flex min-h-11 items-center">Dados do perfil</Link><Link to="/account/wallets" className="type-caption inline-flex min-h-11 items-center">Minhas carteiras</Link></nav></div>
        <div className="space-y-3"><h2 className="type-card">Sobre esta experiência</h2><p className="type-caption text-muted-foreground">Marketplace de demonstração. Colecionáveis, contas e pagamentos simulados.</p></div>
      </div>
      <p className="type-caption pt-5 text-center text-muted-foreground">Jungle Gaming · Frontend Challenge · Demonstração</p>
    </PageContainer>
  </footer>
}
