# Arquitetura — fundação (fases 0 e 1)

## Escopo e organização

A implementação atual cria infraestrutura, contratos e uma página mínima. A separação prevista é:

```text
UI → hooks da feature → TanStack Query → Axios → REST → MSW → MockDatabase
```

Nenhum componente, hook ou query function contém respostas fictícias. Os handlers estão vazios: os comportamentos de negócio serão implementados na fase 2.

`features/` reserva auth, catalog, nft, favorites, cart, checkout, orders, profile e wallets. Os contratos compartilhados ficam em `contracts/`; componentes reutilizáveis em `components/`. Diretórios vazios têm `.gitkeep` para sobreviver ao checkout. Não foram criadas abstrações de storage ou idempotência sem uma implementação de negócio para exercitá-las.

## Router e providers

TanStack Router usa declaração em código, adequada à pequena árvore inicial e sem exigir geração de arquivos. A raiz recebe os serviços tipados, tem layout, estado de erro e 404. A rota `/` valida busca com Zod; entrada opcional e saída normalizada são tipos distintos. Busca, coleção, faixa ETH, ordenação e página já possuem contrato. Aplicar filtros e reiniciar a página serão responsabilidades da feature de catálogo.

Há uma instância de serviços por aplicação: Axios, QueryClient e Socket.IO. `AppProviders` disponibiliza os serviços e o QueryClient. Hooks de feature usarão `useServices()`; componentes visuais não deverão chamar Axios diretamente. O bootstrap aguarda MSW quando habilitado, inclusive em build de demonstração.

Rotas privadas, recuperação de sessão e redirecionamento ao fluxo anterior serão adicionados junto à autenticação. As futuras URLs são `/nfts/$nftId`, `/cart`, `/checkout`, `/orders/$orderId`, `/login`, `/register`, `/account/profile` e `/account/wallets`. Não existem telas falsas para elas nesta fase.

## Contratos REST propostos

Os tipos estão implementados; os endpoints abaixo são o plano para os handlers da fase 2, não APIs já funcionais. Prefixo comum: `/api`.

| Recurso | Endpoints planejados | Contratos |
| --- | --- | --- |
| Sessão/conta | GET /session, POST /auth/login, /auth/register, /auth/logout | Account, Session, LoginInput, RegisterInput |
| NFTs | GET /nfts, GET /nfts/:id | NFT, NFTEdition, CatalogSearch, Paginated |
| Favoritos | GET /favorites, PUT/DELETE /favorites/:nftId | Favorites |
| Carrinho | GET /cart, POST /cart/items, PATCH/DELETE /cart/items/:id | Cart, CartItem, CartOwner |
| Cotação | POST /quotes | QuoteInput, Quote, QuoteLine, QuoteTotals |
| Pedidos | POST /orders, GET /orders/:id | CreateOrderInput, Order, OrderSnapshot |
| Perfil | GET/PATCH /profile, PUT /profile/avatar, PATCH /profile/password | Profile, AvatarInput, PasswordChangeInput |
| Carteiras | GET/POST /wallets, PATCH /wallets/:id | Wallet, WalletInput |

Erros usam `{ code, message, fieldErrors? }`; campos inválidos, sessão, permissão, ausência, conflitos e falhas transitórias terão status HTTP apropriados. Datas usam strings ISO. Quantidades e versões são números inteiros. O backend simulado validará payloads; os contratos TypeScript não substituem validação na fronteira HTTP.

## HTTP, cancelamento e sessão

Axios centraliza prefixo, timeout, credenciais e normalização de erros. Cada futura query deve repassar o `signal` recebido do TanStack Query ao Axios. Cancelamentos continuam como cancelamentos, não viram mensagens de falha.

HTTP 401 chama a limpeza central: desconecta o socket, remove listeners, cancela consultas privadas e de sessão, remove cache privado e limpa o cache de mutations. Dados públicos e o carrinho visitante permanecem. A UI de login e a proteção de rota serão integradas na fase 6. Em mutations futuras, callbacks assíncronos devem verificar a identidade da sessão antes de aplicar efeitos, pois limpar um cache não cancela uma operação já enviada.

Senhas não entram nos contratos de resposta nem em storage. Os schemas de senha representam somente entrada de formulário/HTTP. Hash e persistência de credenciais fictícias pertencem ao backend simulado futuro.

## Política do TanStack Query

- Consultas: `staleTime = 30 s`, `gcTime = 5 min`.
- Refetch de dados obsoletos ao montar (padrão do Query), recuperar foco e reconectar.
- Até duas novas tentativas apenas para rede, timeout e HTTP 5xx. Atrasos de 1 e 2 segundos; teto de 5 segundos.
- Sem retry para cancelamento, erro de programação e HTTP 4xx.
- Mutations sem retry automático. Reenvio de pedido precisará manter a mesma chave de idempotência.
- Quote e session poderão sobrescrever os tempos quando as respectivas features forem implementadas; uma cotação expirada nunca poderá ser usada para comprar.

Chaves públicas: `['nfts', 'list', filters]` e `['nfts', 'detail', id]`. Chaves privadas têm prefixo `['private', userId]`; favoritos, perfil, carteiras, pedidos, carrinho e cotações ficam sob esse prefixo. Carrinho visitante: `['guest', guestId, 'cart']`. Cotações incluem parâmetros de entrada e versão do carrinho.

A fase de favoritos implementará cancelamento, snapshot, alteração otimista, rollback e invalidação. Não há mutation otimista fictícia nesta base.

## ETH, cotação e pedidos

`EthAmount` é uma string validada e marcada por Zod: não negativa, sem notação exponencial, com até 18 casas decimais. `big.js` tem construtor isolado e modo estrito. Soma, subtração, multiplicação por quantidade e comparação não convertem ETH para `number`. Arredondamento acontece apenas na apresentação e nunca altera a fonte de verdade.

Regras de desconto, taxa e total pertencerão à cotação da API. O contrato guarda itens, versões, cupom, rede, totais e expiração. Criar pedido informa quoteId e quoteVersion; a simulação deverá revalidar e exigir nova revisão quando houver mudança.

O pedido já tem snapshot somente leitura de itens, preços, totais, coletor, rede e endereço. Sua implementação deverá copiar esses valores, sem referências mutáveis ao catálogo. Os estados são pending, confirmed e declined. O futuro POST /orders aceitará `Idempotency-Key`; retry após timeout usará a mesma chave e payload diferente produzirá conflito.

## MSW e tempo real

`src/mocks/browser.ts` inicia o worker versionado em `public/`. Importação dinâmica separa o código dos mocks. Assets e requests alheios ao prefixo REST passam normalmente; endpoints REST sem handler geram erro explícito.

A MockDatabase, persistência local, reset e cenários ainda não existem. A validação de ambiente aceita somente `default` para evitar aparentar cenários implementados. Serão adicionados progressivamente com testes.

Socket.IO é o cliente real, tipado para `nft.updated` e `order.updated`. Cada evento tem eventId, versão e data; pedidos também identificam o usuário. O transporte previsto é WebSocket para integração futura com MSW e um binding compatível com Socket.IO. Não há conexão automática, servidor externo, callbacks simulando socket ou atualização direta de cache pelos mocks.

A implementação futura deverá descartar eventos duplicados/antigos, limpar listeners ao encerrar a sessão, invalidar cotações ao mudar NFT e reconciliar recursos ativos via REST após reconectar. A compatibilidade do binding será validada nessa etapa.

## Interface e qualidade

Tailwind v4 usa plugin Vite e tokens CSS. shadcn/ui foi configurado manualmente para projeto existente; o Button usa Slot, CVA e cn, com tokens locais. As demais primitivas virão na fase 3. O padrão foi consultado na [documentação shadcn/ui](https://ui.shadcn.com/docs/installation/vite).

A página mínima usa landmarks, idioma pt-BR, título, descrição, skip link e foco visível. Movimento reduzido é respeitado. Cores são provisórias da descrição, não extraídas do Figma; fontes de sistema evitam dependência externa nesta base.

Playwright cobre precisão monetária, validação de URL, isolamento e limpeza de cache, retries, erros e smoke tests de boot/404/teclado em Chromium a 390, 768 e 1440 px. Testes de compra, autenticação, Socket.IO e baselines visuais serão adicionados com as features correspondentes.

Lighthouse e code splitting de páginas completas ficam para a fase de qualidade. Não existem auditorias, scores nem publicação nesta entrega de infraestrutura.

## Verificação desta entrega

TypeScript, ESLint sem warnings, build padrão, build com mocks e os 16 testes Playwright passaram. Os smoke tests verificam o worker ativo e os viewports de 390, 768 e 1440 px. No ambiente restrito deste workspace o Chromium não inicializou corretamente; os testes passaram com execução autorizada fora dessa restrição.

O Vite reportou o chunk principal de aproximadamente 541 kB (171 kB gzip), acima do aviso padrão de 500 kB. O bootstrap dos mocks gera um chunk separado de aproximadamente 408 kB (153 kB gzip), carregado sob demanda. Isso é uma pendência de performance para revisão das dependências e divisão de código nas próximas fases; os limites do warning não foram aumentados e nenhuma meta Lighthouse foi considerada atingida.
