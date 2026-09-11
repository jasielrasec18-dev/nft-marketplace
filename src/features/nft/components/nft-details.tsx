import type { NFT } from '@/contracts/nft'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function NFTDetails({ nft }: { nft: NFT }) {
  return <section aria-label="Detalhes do NFT">
    <Tabs defaultValue="description">
      <TabsList aria-label="Informações do NFT"><TabsTrigger value="description">Detalhes do NFT</TabsTrigger><TabsTrigger value="information">Informações</TabsTrigger></TabsList>
      <TabsContent value="description"><h2 className="sr-only">Descrição</h2><p className="type-body max-w-3xl whitespace-pre-line text-muted-foreground">{nft.description}</p></TabsContent>
      <TabsContent value="information">
        <h2 className="sr-only">Informações da obra</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-muted-foreground">Coleção</dt><dd className="mt-2">{nft.collection}</dd></div>
          <div><dt className="text-muted-foreground">Identificador</dt><dd className="mt-2 break-all">{nft.id}</dd></div>
          <div><dt className="text-muted-foreground">Disponibilidade total</dt><dd className="mt-2">{nft.availableQuantity} unidades</dd></div>
          <div><dt className="text-muted-foreground">Edições</dt><dd className="mt-2">{nft.editions.map((edition) => edition.name).join(', ')}</dd></div>
        </dl>
      </TabsContent>
    </Tabs>
  </section>
}
