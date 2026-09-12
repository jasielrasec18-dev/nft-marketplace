# NFT Marketplace — Jungle Gaming

Implementação do [Frontend Challenge da Jungle Gaming](https://github.com/junglegaming/frontend-challenge), com React e TypeScript. **Estado atual: fases 0 a 7 concluídas — fundação, backend simulado, Design System, Home/Catálogo, NFT Detail, Auth/Session e Carrinho.** Home, detalhe, autenticação e carrinho consomem a API simulada. Quantidades, cupons e resumo financeiro passam pelo backend, com merge do visitante após login.

O enunciado oficial define os comportamentos; o [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1&p=f) define a referência visual.

## Executar

Node.js 22.12+ e npm. No PowerShell, use `npm.cmd` e `npx.cmd` se os scripts `.ps1` estiverem bloqueados.

```sh
npm ci
npm run dev:mock
```

Não depende de backend externo, blockchain ou gateway. Os handlers MSW interceptam HTTP no navegador. Chamadas feitas por curl/Postman ou pelo `request` Node do Playwright não passam pelo service worker; os testes de integração Node inicializam os mesmos handlers com `setupServer`.

## Credenciais fictícias

| Usuário | Senha |
| --- | --- |
| collector@example.com | Jungle123! |
| second@example.com | Jungle123! |

Cada conta começa com um favorito, um item no carrinho, perfil e carteira Ethereum próprios. Senhas são persistidas somente como hash SHA-256 com salt de demonstração. Essas credenciais e todo o armazenamento são exclusivamente simulados.

Há 32 NFTs, quatro coleções, duas edições por NFT e variedade de preços/estoques. As quatro ilustrações vetoriais locais são assets de demonstração, não imagens oficiais do Figma. Cupons: `VALID10` (10%), `EXPIRED10` (expirado); qualquer código desconhecido é inválido.

## Ambiente

Copie `.env.example` para `.env.local` apenas se precisar personalizar.

| Variável | Padrão | Uso |
| --- | --- | --- |
| VITE_API_BASE_URL | /api | Prefixo REST |
| VITE_API_TIMEOUT_MS | 10000 | Timeout Axios |
| VITE_MOCK_ENABLED | false | Ativa MSW antes do React |
| VITE_MOCK_SCENARIO | default | Cenário inicial de uma base nova |
| VITE_SOCKET_URL | http://localhost:3001 | Reservado para a fase realtime |

`dev:mock` e `build:mock` carregam `.env.mock`. Não sobrescreva `VITE_MOCK_ENABLED` em `.env.local` se quiser usar esses modos. Variáveis `VITE_*` são públicas.

A escolha de cenário persistida tem precedência sobre o cenário inicial da env. Para mudar uma base existente, use o endpoint de cenário ou reset descrito abaixo.

## Cenários e reset

Disponíveis:

`default`, `empty`, `slow-network`, `variable-latency`, `network-error`, `server-error`, `service-unavailable`, `request-timeout`, `session-expired`, `unauthorized`, `register-conflict`, `invalid-coupon`, `expired-coupon`, `price-changed`, `sold-out`, `order-timeout`, `payment-confirmed`, `payment-declined`.

No console do navegador, com `npm run dev:mock` aberto:

```js
const { createApiClient } = await import('/src/api/client.ts')
const api = createApiClient({ baseURL: '/api', timeoutMs: 10000 })

// Reinicia todos os recursos e remove cookies de sessão/visitante.
await api.post('/__mock/reset', {
  scenario: 'default',
  now: '2026-09-10T12:00:00.000Z',
  latencyMs: 0,
})

// Autentica via HTTP.
await api.post('/auth/login', {
  email: 'collector@example.com',
  password: 'Jungle123!',
})

// Troca o cenário preservando os recursos existentes.
await api.patch('/__mock/scenario', { scenario: 'session-expired' })
await api.post('/__mock/clock/advance', { milliseconds: 1001 })
await api.get('/profile') // 401 SESSION_EXPIRED

// Volta à simulação normal, com relógio real e latência de 120 ms.
await api.post('/__mock/reset', { scenario: 'default' })
```

O import acima é uma conveniência do Vite em desenvolvimento. Os endpoints de controle também funcionam no build de demonstração com MSW habilitado. Não há UI administrativa. Veja [docs/MOCK-API.md](docs/MOCK-API.md) para endpoints, payloads e exemplos de compra/timeout.

Persistência centralizada em `localStorage['jungle.mock-database.v1']`. Dados inválidos ou de schema incompatível são substituídos pelas fixtures. O reset restaura a base inteira, contadores, relógio, cenário, sessões e idempotência. Não use dados reais.

## Comandos

| Comando | Finalidade |
| --- | --- |
| npm run dev | Desenvolvimento sem mocks por padrão |
| npm run dev:mock | Desenvolvimento com MSW |
| npm run typecheck | Tipos da aplicação, ferramentas e testes |
| npm run lint | ESLint sem warnings; impede importação dos mocks pela UI |
| npm run build | Build padrão |
| npm run build:mock | Build de demonstração com mocks |
| npm run preview | Servir o último build |
| npm run check | TypeScript, lint e build |
| npm run msw:init | Atualizar o worker após atualizar MSW |
| npm test | Suíte completa |
| npm run test:mocks | Integração Axios → MSW → MockDatabase |
| npm run test:foundation | Utilitários, contratos e cache |
| npm run test:e2e | Smoke e persistência HTTP no Chromium, em 390/768/1440 px |
| npm run test:report | Abrir relatório HTML |

Antes dos testes de navegador:

```sh
npx playwright install chromium
npm test
```

Playwright inicia um servidor com mocks na porta 4173. Cada teste tem armazenamento isolado; os casos sensíveis usam relógio fixo e latência controlada. Relatórios ficam em `playwright-report/`; traces de falhas e screenshots, em `test-results/`. Ambos são ignorados pelo Git.

## Arquitetura

```text
src/
  app/           # router, providers, query, env e serviços
  api/           # Axios centralizado e erros
  contracts/     # DTOs e schemas compartilhados
  features/      # catálogo, detalhe, Auth e carrinho/cotação
  components/    # UI, layout e feedback existentes
  routes/        # Home, NFT Detail, Auth, Cart, continuidade protegida, showcase dev e 404
  mocks/         # fixtures, database, handlers, cenários e persistência
  lib/           # ETH preciso e cn
tests/           # fundação, backend HTTP e smoke/persistência em navegador
```

A Home consome `TanStack Query → Axios → REST → MSW`. Fixtures não são importadas por componentes, hooks, páginas ou serviços de aplicação.

Tecnologias configuradas: React, TypeScript, Vite, TanStack Router/Query, Axios, Tailwind v4, shadcn/ui, MSW, Playwright, Zod e big.js. React Hook Form/resolvers atendem os formulários de Auth; Lucide fornece os ícones. socket.io-client permanece preparado para a fase de realtime.

Decisões detalhadas: [ARCHITECTURE.md](ARCHITECTURE.md). README original do template: [docs/VITE-TEMPLATE.md](docs/VITE-TEMPLATE.md).

## Limites e próxima fase

A fase 2 não implementa as telas, integração do cache com mutations, eventos Socket.IO, regressão visual ou Lighthouse. Os pagamentos evoluem pelo relógio simulado e são reconciliados na próxima chamada REST ou pelo controle de relógio. Não há emissão de eventos falsos para a interface.

A simulação é local a uma instância da aplicação; não é um servidor compartilhado entre navegadores/abas. Os tokens e dados locais não constituem autenticação de produção. Os assets individuais das obras ainda são provisórios no backend; os tokens da UI foram refinados na Fase 3. Os avisos de bundle das fases anteriores estão registrados no histórico; a validação da Fase 6 descreve o build atual. A avaliação final de performance permanece para a fase correspondente.

Para testar o build: `npm run build:mock` e `npm run preview`. O deploy final precisará servir `dist/` por HTTPS e tratar URLs de páginas como SPA. Publicação e Lighthouse pertencem às fases posteriores.

**Próxima etapa: FASE 8 — Conta / Perfil / Carteiras. Não iniciada.**

## Validação da fase 2

TypeScript e ESLint passaram; builds padrão e com mocks concluídos. A suíte completa teve 42 testes aprovados: 23 de backend, 7 de fundação e 12 de navegador. Após o último reforço da proteção de reset, os 4 testes relacionados foram repetidos e passaram. O relatório HTML da suíte completa está em playwright-report/index.html (gerado localmente, não versionado).

## Design System — Fase 3

Execute `npm run dev:mock` e abra `http://localhost:5173/design-system` (ou a porta indicada pelo Vite). A demonstração é lazy e existe somente em desenvolvimento; `/` apresenta a Home/Catálogo. Os exemplos não fazem chamadas HTTP, autenticação, favoritos persistidos ou compras.

A base inclui Button, Input, Label/FormField, Select, Checkbox, RadioGroup, Dialog, Sheet, Tabs, Separator, Badge, feedback contextual, NFTCard, ETHPrice e QuantitySelector. Há skeletons de card, grade, detalhe e resumo, com shimmer que respeita reduced motion. PageContainer, Header/Footer e AppLayout compartilham a identidade KURIO.

Foram analisados os 23 screenshots em `src/assets/images-nft/` como fallback do Figma inacessível. Eles não são assets de renderização. Não foram encontradas fontes ou imagens individuais das obras: a fonte monoespaçada usa fallback local, a marca é tipográfica e os cards mostram ausência explícita de imagem. Os ícones são Lucide. Cores/medidas aproximadas e ajustes de acessibilidade estão documentados em [ARCHITECTURE.md](ARCHITECTURE.md#design-system).

Os testes específicos estão em `tests/design-system.spec.ts`, incluídos em `npm test` e `npm run test:e2e`. Verificam teclado, foco, contraste, estados desabilitados, descrições/erros, ausência de overflow e reduced motion em 390/768/1440px. Capturas de inspeção ficam em `test-results/`; não há baselines das páginas finais.

A Fase 4, descrita abaixo, implementou Home/Catálogo e sua integração HTTP. O detalhe foi concluído na Fase 5. Autenticação visual, carrinho completo, checkout, perfil/carteiras, realtime, Lighthouse e regressão visual final permanecem nas fases correspondentes.

### Verificação final da Fase 3

`npm run check` passou (TypeScript, ESLint sem warnings e build). `npm test`: **60 testes aprovados**, incluindo os 42 anteriores e 18 verificações do Design System nos três viewports. As capturas foram inspecionadas; não houve overflow horizontal. O showcase foi confirmado ausente do JavaScript de produção. O bundle principal ficou em aproximadamente 585 kB (185 kB gzip); o aviso de 500 kB permanece registrado para a fase de performance, sem aumento do limite de warning. Nenhuma feature da Fase 4 foi iniciada.

## Home / Catálogo — Fase 4

Acesse `/` com `npm run dev:mock`. Hero, catálogo, destaque lateral, painéis de descoberta, Diário da Cunhagem e rodapé compõem a Home. No mobile/tablet, os filtros abrem em um Sheet e a grade tem duas colunas; no desktop, sidebar e três colunas.

Exemplo compartilhável:

```text
/?q=ape&collection=golden&priceMin=0.5&priceMax=3&sort=price-asc&page=1
```

Busca é aplicada por Enter/botão; filtros por **Aplicar filtros**. Toda alteração de busca, coleção, faixa ou ordenação reinicia a página. Voltar/avançar e refresh restauram os controles. A paginação usa os oito itens por página retornados pela API. Na entrega da Fase 4, a rota `/nfts/$nftId` oferecia um placeholder com retorno ao catálogo; a Fase 5 o substituiu pela experiência completa descrita abaixo, preservando os filtros.

A interface distingue skeleton inicial, vazio, erro com retry, página fora do intervalo e refetch em background. **Atualizar** renova a consulta mantendo os cards; falhas de atualização preservam os resultados anteriores. Os cenários MSW e os controles documentados acima continuam disponíveis.

Os cinco screenshots da Home guiaram a composição; o Figma continuou inacessível. As imagens em `public/artwork/` são SVGs originais de demonstração, com procedência em [public/artwork/README.md](public/artwork/README.md). Não são recortes nem exports oficiais. A API fornece suas URLs; a UI não importa fixtures. Coleções vêm da metadata REST, e não de uma lista local. Não há filtro de rede ou “Em alta”, pois o contrato não os suporta.

A Home e a rota de detalhe mantêm lazy loading. Os testes em `tests/catalog.spec.ts` integram a suíte existente, incluindo HTTP, busca/filtros/preços, sort, paginação, histórico/refresh, erros/retry, latência, refetch e Sheet. As expectativas antigas do título da Home foram atualizadas para o título definitivo, preservando o propósito dos testes anteriores.

### Verificação final da Fase 4

`npm run check` aprovado: TypeScript, ESLint sem warnings e build. `npm test`: **101 testes aprovados** na execução completa — 60 anteriores, 39 verificações de catálogo (13 cenários × 3 viewports) e 2 de backend para metadata/migração de assets. Home, Hero e grade foram inspecionados em 390/768/1440px; não houve overflow horizontal nos testes. Os quatro casos afetados inicialmente pela inicialização do servidor passaram na execução final após warmup, sem ampliar timeouts.

O build mantém Home (~94 kB / 32 kB gzip) e placeholder de detalhe em chunks separados; o showcase permanece fora do JavaScript de produção. O bundle principal (~593 kB / 188 kB gzip) continua emitindo o aviso já registrado de 500 kB, reservado para a etapa de performance. Relatório: `playwright-report/index.html`; capturas: `test-results/`. Nenhum commit automático e nenhuma implementação de NFT Detail completo naquela fase.

## NFT Detail — Fase 5

Acesse diretamente `/nfts/nft-001` ou abra um card da Home. A rota lazy consulta `GET /api/nfts/:id` e funciona após refresh sem depender da Home. O retorno ao catálogo mantém busca, filtros, ordenação e página pela URL.

A tela reutiliza galeria com imagem quadrada, ETHPrice, controles de edição/quantidade, Tabs e NFTCard. Exibe somente campos reais da API. Imagens repetidas da galeria são deduplicadas; miniaturas aparecem apenas quando há mais de uma URL. Os assets atuais oferecem uma imagem por NFT. Avaliações, criador, rede e atributos não existentes no contrato não são inventados.

Edições sem estoque são identificadas como esgotadas e desabilitadas. A quantidade começa em 1, respeita o estoque da edição e volta a 1 ao trocar edição. Refetch limita a quantidade ao novo estoque; edição esgotada bloqueia a inclusão. Preços preservam strings decimais, inclusive um wei.

**Adicionar ao carrinho** executa `POST /api/cart/items`. O backend identifica visitante/usuário por cookie; nenhuma identidade é criada pela UI. Há estado pendente, confirmação HTTP e erro acessível; conflito de estoque renova o detalhe. A inclusão não reserva estoque. A página/revisão do carrinho pertence à fase correspondente. Favoritos permanecem desabilitados e identificados como futuros, pois sua implementação completa pertence a uma etapa posterior; não há favorito fictício nem optimistic update antecipado.

Estados disponíveis: skeleton inicial, 404 específico, erro de rede/servidor com retry, refetch mantendo conteúdo, falha em background, edição indisponível e NFT esgotado. Relacionados usam a consulta REST de catálogo filtrada pela coleção, excluem a obra atual e exibem até cinco cards com navegação real.

Para conferir alterações REST no detalhe aberto, use os controles existentes e clique em **Atualizar NFT**:

```js
await api.patch('/__mock/scenario', { scenario: 'sold-out', latencyMs: 0 })
await api.patch('/__mock/nfts/nft-001', { availableQuantity: 0 })
// Atualizar NFT mostra estoque esgotado.

await api.patch('/__mock/scenario', { scenario: 'price-changed', latencyMs: 0 })
await api.patch('/__mock/nfts/nft-001', { priceEth: '0.000000000000000001' })
// Atualizar NFT mostra o preço exato.
// Use /__mock/reset para restaurar as fixtures.
```

O cliente `api` é o mesmo exemplo da seção de cenários. Os cenários originais de preço/estoque disparam no fluxo de cotação/pedido; os PATCH acima preparam o estado persistido para inspeção direta, sem mudar essa regra ou implementar realtime.

As referências `desktop-detalhes-nft-1/2` e `mobile-detalhesdanft-nft-1` guiaram a composição. Figma/protótipo continuaram inacessíveis. Desktop mantém imagem/painel em colunas; mobile empilha mídia, informações e CTA arredondado; tablet usa duas colunas com controles que quebram linha. Os SVGs continuam sendo demonstrações, não a arte oficial.

### Verificação final da Fase 5

`npm run check` passou: TypeScript, ESLint sem warnings e build. `npm test`: **140 testes aprovados** na execução completa (7 minutos), incluindo os 101 anteriores e 39 verificações de detalhe (13 cenários × 3 viewports). Acesso direto/refresh, 404, estados MSW, edições, limites, precisão ETH, inclusão visitante, conflito/erro, relacionados, URL e teclado foram validados. Capturas de 390/768/1440px foram inspecionadas; os testes não detectaram overflow horizontal nem erros de console no fluxo nominal.

O detalhe continua em chunk lazy próprio (~18,23 kB / 5,99 kB gzip), com componentes compartilhados extraídos pelo bundler. O bundle principal (~593 kB / 188 kB gzip) mantém o warning pré-existente de 500 kB; não foi aumentado o limite. Nenhuma dependência nova, alteração de backend, baseline visual final ou execução de Lighthouse.

Relatório local: `playwright-report/index.html`. Capturas: `test-results/nft-detail-direct-detail-*/detail.png` e `detail-content.png`. Nenhum commit automático. Na entrega da Fase 5, a próxima etapa era Auth; sua implementação está descrita abaixo.

## Auth / Session — Fase 6

`/login` e `/register` são rotas lazy com Dialog acessível. O desktop usa Hero/cards reais como fundo; mobile prioriza o formulário, com altura flexível e rolagem. Os seis screenshots de login/cadastro foram analisados; Figma permaneceu inacessível. Login social e recuperação de senha não existem no backend e aparecem como indisponíveis.

Login e cadastro usam React Hook Form, Zod e os endpoints existentes. Cadastro envia somente nome, e-mail e senha; confirmação de senha fica na validação da UI. Ambos recebem sessão real do mock e concluem a navegação. Senhas são limpas após a tentativa, não são gravadas pela UI em storage e não são passadas como variáveis da mutation no cache. O backend continua persistindo apenas sua representação de demonstração com hash/salt.

A sessão é consultada por `GET /auth/session`, compartilhada no TanStack Query e restaurada após refresh. O Header mostra carregamento neutro, acesso de visitante ou nome/logout; no mobile, as ações ficam no menu. Falha de rede/servidor mantém estado de erro/indeterminado com **Verificar sessão**, sem fingir logout.

Exemplo de retorno:

```text
/login?redirect=%2Fnfts%2Fnft-002%3Fq%3Dpanther%26collection%3Djungle%26sort%3Dname%26page%3D1
```

Login ↔ cadastro preserva o destino. Retornos externos, caminhos desconhecidos e ciclos para login/cadastro são rejeitados. Usuários já autenticados seguem para o destino validado; sem destino, usam a Home. Search params e hash são preservados, com a normalização já existente do Router.

Logout usa `POST /auth/logout` e só limpa a sessão após confirmação. Se falhar, a sessão permanece visível e o usuário pode tentar novamente. Um 401 de sessão expirada limpa dados privados e abre Login com o contexto anterior; credenciais inválidas ficam no formulário. A expiração é decidida pelo servidor nas consultas/operações HTTP, sem timer baseado no relógio local.

Dados privados são removidos nas transições; consultas públicas são preservadas. O carrinho visitante é mesclado pelo backend existente no login/cadastro, e apenas sua representação em cache é invalidada. A página de carrinho e favoritos completos permanecem nas próximas fases. O guard `requireSession` está pronto para os `beforeLoad` das rotas privadas futuras, com teste de integração HTTP; não foram criadas páginas privadas fictícias.

### Verificação final da Fase 6

`npm run check` aprovado: TypeScript, ESLint sem warnings e build de produção. `npm test`: **198 testes aprovados** na execução completa (10,1 minutos), sem retries — 140 anteriores e 58 novos (54 verificações de Auth em navegador, três de foundation e uma integração HTTP do guard).

Foram validados login/cadastro reais por HTTP, confirmação local de senha, conflito 409, credenciais inválidas, rede/500/retry, bloqueio de duplo envio, restauração após refresh, logout confirmado/falho, A → B → A, expiração/401, rejeição de respostas antigas, redirects internos e preservação do carrinho visitante. A regressão inclui Home, filtros, paginação, detalhe, backend e Design System. O setup do teste de detalhe agora aguarda a consulta inicial de sessão antes do reset do mock, evitando um conflito de reset pendente; as verificações de console foram mantidas.

Login e cadastro foram inspecionados em 390/768/1440px. Os testes verificaram foco, teclado, autocomplete, erros associados aos campos, toggle de senha, ausência de overflow horizontal e CTA acessível com viewport de 500px de altura. As capturas foram comparadas às referências locais; não constituem baseline visual definitiva, e o teclado virtual físico não foi testado.

Auth permanece em chunk lazy (~41,42 kB / 14,80 kB gzip); o principal ficou em ~337,78 kB / 107,56 kB gzip. O build atual não emite warning de chunk acima de 500 kB; isso não substitui a avaliação final de performance. Nenhuma dependência, contrato, handler ou fixture foi alterado nesta fase. Sem Lighthouse ou realtime.

Relatório: `playwright-report/index.html`. Capturas: `test-results/auth-direct-Login-and-Regi-*/login.png` e `register.png`. Login social e recuperação de senha continuam indisponíveis por não terem endpoints. Na entrega da Fase 6, a próxima etapa era Carrinho; sua implementação está descrita abaixo. Nenhum commit automático; sugestão: `feat(auth): implement authentication and session flows`.

## Carrinho — Fase 7

A rota lazy `/cart` atende visitante e usuário autenticado, inclusive por acesso direto e refresh. NFT Detail inclui itens pela API e oferece **Ver carrinho**. O Header e a página compartilham a mesma consulta; o contador soma unidades, não linhas.

Guest cart continua usando o mecanismo já existente: cookie opaco + REST + MockDatabase persistida localmente. Não há uma segunda cópia em localStorage na UI. Quantidade e remoção aguardam PATCH/DELETE; falhas mantêm os últimos dados confirmados. Refetch mantém as linhas e bloqueia o resumo quando não consegue confirmar o estado atual.

O login/cadastro mantém o merge atômico do backend: soma a quantidade de edições iguais, limpa o visitante somente após confirmação e não repete a soma ao autenticar novamente. Quantidades acima do estoque são preservadas para revisão, com aviso e ajuste explícito. O cupom do visitante é transferido quando o usuário ainda não tem outro. Logout retorna ao carrinho visitante separado, sem copiar itens privados.

**Aplicar** envia o cupom em `POST /quote`; **Remover cupom** pede nova cotação sem código. `VALID10` aplica 10%; `EXPIRED10` e códigos desconhecidos geram erros distintos, associados ao campo. Apenas cupons confirmados são persistidos no carrinho pelo backend e restaurados após refresh.

Subtotal, desconto, taxa e total vêm da quote. A rede é Ethereum nesta fase; não foi criado seletor de rede/carteira. ETH mantém strings decimais e big.js. A cotação é renovada após mudanças e ao vencer; falhas impedem a continuidade. A API passou a permitir uma cotação de prévia para o próprio visitante, sem autorizar pedidos. Usuários continuam recebendo a cotação persistida existente.

Use **Atualizar carrinho** para consultar preço/estoque atuais. Os cenários `price-changed` e `sold-out` mantêm o gatilho da segunda cotação após selecionar o cenário; o PATCH de cenário reinicia seus contadores. Alternativamente, use os controles REST de NFT documentados acima e atualize. Não há realtime nesta fase.

**Conectar e finalizar** abre Login com `redirect=/checkout`. Após o merge, uma rota protegida de continuidade informa que a finalização ainda está indisponível e oferece retorno ao carrinho. Ela não cria pedido, seleciona carteira nem realiza pagamento. O checkout completo permanece fora desta entrega.

As três referências locais de carrinho guiaram a lista/resumo no desktop, empilhamento mobile e continuação no rodapé. Figma permaneceu inacessível. Componentes existentes foram reutilizados; recomendações vêm da API de catálogo. Na retomada final, os PNGs já presentes em public/artwork foram preservados e passaram a ser servidos diretamente: os wrappers SVG com imagens externas produziam miniaturas vazias. A restauração do mock atualiza somente URLs conhecidas das artes antigas, preservando contas, preços, carrinhos e snapshots de pedidos.

### Verificação final da Fase 7

**Fase 7 concluída.** `npm run check` passou após as últimas alterações: TypeScript, ESLint sem warnings e build de produção. O carrinho permanece em chunk lazy de 12,86 kB / 4,55 kB gzip; o principal ficou em 334,51 kB / 107,01 kB gzip, sem aviso de chunk acima de 500 kB. Nenhuma dependência nova ou mudança de DTO/schema de banco.

A suíte contém **272 testes**: 198 anteriores e 74 novos (24 cenários de carrinho × 3 viewports e duas integrações de backend). A execução completa com três workers terminou com **266 aprovados e seis timeouts** (18,2 minutos). Os casos afetados foram repetidos nas três larguras, junto a todo o backend: a primeira repetição teve 45 aprovações e um timeout adicional no carregamento lento desktop; a rodada final, com arquivos estáveis e um worker, teve **46/46 aprovados** (2,4 minutos), sem retries automáticos ou aumento de timeouts. Todos os 272 cenários obtiveram aprovação ao longo das validações; isso não equivale a uma execução completa única sem falhas. A estabilidade da suíte com três workers neste ambiente permanece uma limitação registrada.

Comando da rodada final:

```sh
npm test -- --workers=1 --grep 'mock-backend|price and stock refetch|authenticated users skip|quote failure leaves|slow cart, quote|cart layout and keyboard|background refresh retains cards'
```

Foram verificados guest/auth, acesso direto/refresh, quantidade/remoção por HTTP, contador compartilhado, isolamento A/B, merge idempotente com conflito de estoque, cupom válido/inválido/expirado, remoção/persistência, valores exatos até 1 wei, preço/estoque atualizados, expiração da quote com relógios diferentes, resposta atrasada, erros/retry e continuidade protegida. A migração das imagens preserva contas, sessões, preços e snapshots de pedidos.

Capturas de 390/768/1440px foram inspecionadas; teclado, foco, campos associados a erros, skeletons, estados pendentes e ausência de overflow horizontal foram testados. As referências locais guiaram a composição; Figma permaneceu inacessível. Não foi estabelecida baseline visual definitiva, executado Lighthouse ou testado teclado virtual físico.

Relatório final: `playwright-report/index.html`. Execução completa preservada: `reports/playwright-report-full/index.html`; repetição intermediária: `reports/playwright-report-targeted-first/index.html`. Capturas atuais: `test-results/cart-cart-layout-*/cart.png`, `cart-item.png` e `cart-summary.png`; capturas da suíte completa também estão em `reports/test-results-full/`.

Checkout permanece somente como continuidade protegida; pagamento, pedidos na UI, carteira, realtime e avaliação final de performance ficam fora desta entrega. **Próxima fase: Fase 8 — Conta / Perfil / Carteiras, não iniciada.** Nenhum commit automático. Sugestão: `feat(cart): implement persistent cart and quote flow`.
