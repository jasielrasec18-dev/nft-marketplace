import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Heart, LoaderCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/ui/form-field'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { NFTCard } from '@/components/shared/nft-card'
import { NFTCardSkeleton } from '@/components/shared/nft-card-skeleton'
import { NFTGridSkeleton } from '@/components/shared/nft-grid-skeleton'
import { NFTDetailSkeleton } from '@/components/shared/nft-detail-skeleton'
import { CartSummarySkeleton } from '@/components/shared/cart-summary-skeleton'
import { QuantitySelector } from '@/components/shared/quantity-selector'
import { ETHPrice } from '@/components/shared/eth-price'

// Development-only examples. No fixtures, requests, persistence or business flows.
export function DesignSystemPage() {
  const [quantity, setQuantity] = useState(1)
  const [favorite, setFavorite] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  return <div className="space-y-12">
    <div className="max-w-2xl space-y-4"><p className="type-label uppercase tracking-widest text-primary">KURIO / Fundação visual</p>
      <h1 className="type-page">Design System</h1>
      <p className="type-body text-muted-foreground">Área de desenvolvimento. Os exemplos abaixo validam componentes de apresentação e não realizam operações no marketplace.</p>
    </div>
    <section aria-labelledby="type-title" className="space-y-4">
      <h2 id="type-title" className="type-section">Identidade e tipografia</h2>
      <div className="grid gap-4 sm:grid-cols-3">{['background', 'card', 'primary'].map((token) => <div key={token} className="rounded-md border border-border p-4" style={{ background: `var(--${token})`, color: token === 'primary' ? 'var(--primary-foreground)' : undefined }}>{token}</div>)}</div>
      <p className="type-display max-w-3xl">Seja dono do futuro da arte digital</p>
      <p className="type-metadata text-muted-foreground">Monoespaçada · escala responsiva · preço decimal</p><ETHPrice value="1.190000000000000001" />
    </section>
    <Separator />
    <section aria-labelledby="buttons-title" className="space-y-4">
      <h2 id="buttons-title" className="type-section">Botões e estados</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Button>Primário</Button><Button variant="secondary">Secundário</Button><Button variant="outline">Contorno</Button><Button variant="ghost">Discreto</Button><Button variant="destructive">Remover</Button>
        <Button variant="link" asChild><Link to="/">Voltar à Home</Link></Button>
        <Button disabled>Indisponível</Button><Button disabled aria-busy="true"><LoaderCircle className="animate-spin" aria-hidden="true" />Carregando</Button>
        <Button variant="outline" size="icon" aria-label="Pesquisar exemplo"><Search /></Button>
      </div>
      <div className="flex flex-wrap gap-3"><Badge>Edição limitada</Badge><Badge variant="outline">Coleção</Badge><Badge variant="unavailable">Esgotado</Badge></div>
    </section>
    <section aria-labelledby="fields-title" className="space-y-6">
      <h2 id="fields-title" className="type-section">Campos e seleção</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <FormField label="Nome de exibição" description="Como seu nome será apresentado." required>{(props) => <Input {...props} required placeholder="Seu nome" />}</FormField>
        <FormField label="E-mail de exemplo" error="Informe um e-mail válido.">{(props) => <Input {...props} type="email" defaultValue="exemplo" />}</FormField>
        <FormField label="Campo indisponível">{(props) => <Input {...props} disabled placeholder="Indisponível" />}</FormField>
        <FormField label="Rede de exemplo" description="Seleção local para testar o controle.">{(props) => <Select defaultValue="ethereum"><SelectTrigger {...props}><SelectValue placeholder="Selecione uma rede" /></SelectTrigger><SelectContent><SelectItem value="ethereum">Ethereum</SelectItem><SelectItem value="polygon">Polygon</SelectItem><SelectItem value="solana" disabled>Solana · indisponível</SelectItem></SelectContent></Select>}</FormField>
      </div>
      <div className="flex items-center gap-2"><Checkbox id="demo-check" /><Label htmlFor="demo-check">Receber novidades (exemplo)</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="disabled-check" disabled /><Label htmlFor="disabled-check">Opção indisponível</Label></div>
      <RadioGroup defaultValue="first" aria-label="Opções de exemplo" className="max-w-md">
        {([['first', 'Primeira opção'], ['second', 'Segunda opção'], ['disabled', 'Opção de rádio indisponível']] as const).map(([value, label]) => <div key={value} className="flex items-center gap-2 rounded-md border border-border bg-card px-2"><RadioGroupItem id={`demo-${value}`} value={value} disabled={value === 'disabled'} /><Label className="flex min-h-11 flex-1 items-center" htmlFor={`demo-${value}`}>{label}</Label></div>)}
      </RadioGroup>
      <QuantitySelector value={quantity} onValueChange={setQuantity} min={1} max={3} aria-label="Quantidade de exemplo" />
    </section>
    <section aria-labelledby="layers-title" className="space-y-4">
      <h2 id="layers-title" className="type-section">Diálogo e painel</h2>
      <div className="flex flex-wrap gap-3">
        <Dialog><DialogTrigger asChild><Button>Abrir diálogo</Button></DialogTrigger><DialogContent>
          <DialogTitle>Exemplo de diálogo</DialogTitle><DialogDescription>Teste Tab, Shift+Tab e Escape. O foco retorna ao botão de abertura.</DialogDescription>
          <div className="mt-6 space-y-6"><FormField label="Campo do diálogo">{(props) => <Input {...props} />}</FormField><DialogClose asChild><Button variant="outline">Concluir exemplo</Button></DialogClose></div>
        </DialogContent></Dialog>
        <Sheet><SheetTrigger asChild><Button variant="outline">Abrir painel</Button></SheetTrigger><SheetContent>
          <SheetTitle>Exemplo de painel</SheetTitle><SheetDescription>Base para navegação e filtros em telas menores.</SheetDescription>
          <div className="mt-6 flex items-center gap-2"><Checkbox id="panel-check" /><Label htmlFor="panel-check">Opção do painel</Label></div>
        </SheetContent></Sheet>
      </div>
    </section>
    <section aria-labelledby="cards-title" className="space-y-4">
      <h2 id="cards-title" className="type-section">Cards de apresentação</h2>
      <p className="type-small text-muted-foreground">Imagens individuais das obras ainda não foram fornecidas. Os links abaixo retornam à Home temporária.</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6">
        <NFTCard name="Obra de exemplo #042" collection="Coleção de exemplo" price="1.19" favorite={favorite} onFavoriteChange={setFavorite} renderLink={(contents) => <Link to="/">{contents}</Link>} />
        <NFTCard name="Obra de exemplo #009" collection="Coleção de exemplo" price="0.000000000000000001" soldOut renderLink={(contents) => <Link to="/">{contents}</Link>} />
        <NFTCardSkeleton />
      </div>
    </section>
    <section aria-labelledby="feedback-title" className="space-y-5">
      <h2 id="feedback-title" className="type-section">Feedback</h2>
      <InlineAlert>Mensagem informativa contextual.</InlineAlert><InlineAlert variant="success">Exemplo visual de confirmação.</InlineAlert><InlineAlert variant="warning">Exemplo visual de atenção.</InlineAlert><InlineAlert variant="error">Exemplo visual de erro.</InlineAlert>
      <EmptyState icon={<Heart />} title="Nenhum item por aqui" description="Uma mensagem contextual poderá orientar o próximo passo." />
      <ErrorState title="Não foi possível carregar o exemplo" description="Este estado não representa uma chamada de rede." onRetry={() => setRetryCount((count) => count + 1)} />
      <p role="status" className="type-caption text-muted-foreground">Tentativas locais: {retryCount}</p>
    </section>
    <section aria-labelledby="loading-title" className="space-y-4">
      <h2 id="loading-title" className="type-section">Estruturas de carregamento</h2>
      <Tabs defaultValue="grid"><TabsList aria-label="Estruturas de skeleton"><TabsTrigger value="grid">Grade</TabsTrigger><TabsTrigger value="detail">Detalhes</TabsTrigger><TabsTrigger value="summary">Resumo</TabsTrigger></TabsList>
        <TabsContent value="grid"><NFTGridSkeleton count={3} /></TabsContent>
        <TabsContent value="detail"><NFTDetailSkeleton /></TabsContent>
        <TabsContent value="summary"><div className="max-w-sm"><CartSummarySkeleton /></div></TabsContent>
      </Tabs>
    </section>
  </div>
}
