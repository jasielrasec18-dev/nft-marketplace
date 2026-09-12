# Arquitetura — NFT Marketplace

## Escopo atual

Fases 0 e 1 preservadas; fase 2 adiciona backend simulado, persistência e cenários; fase 3 adiciona o Design System. A Fase 4 acrescenta Home/Catálogo com leitura HTTP; a Fase 5 substitui o placeholder por NFT Detail e inclusão básica no carrinho. A Fase 6 acrescenta login, cadastro e ciclo de sessão com isolamento de cache. A Fase 7 implementa carrinho visitante/autenticado, cupom e cotação.

```text
UI → hooks/features → TanStack Query → Axios → REST → MSW → MockDatabase
```

Mocks são carregados dinamicamente apenas quando habilitados. As features não importam fixtures nem MockDatabase; essa fronteira também é protegida pelo ESLint. O QueryClient não é importado pelos mocks.

## Estrutura

- `contracts/`: DTOs compartilhados e validação de entradas; criado `requests.ts` para os payloads faltantes e `mock-control.ts` para controles tipados.
- `mocks/fixtures/`: dois usuários, 32 NFTs e recursos iniciais determinísticos.
- `mocks/db/`: tipos internos, schema persistido, transações e operações de carrinho/catálogo/sessão/cotação/pedido.
- `mocks/handlers/`: adaptação HTTP por recurso; middleware comum de latência, falhas e erros.
- `mocks/scenarios/config.ts`: configuração base e pequenas variações; não duplica handlers.
- `mocks/utils/`: relógio, IDs, hash de senha e respostas.
- `tests/`: testes existentes mais integração HTTP e persistência no navegador.

Não foram adicionadas dependências. As alterações mínimas da fundação foram: configuração injetável no cliente Axios para testes Node; createdAt no contrato NFT para ordenação estável; validação de todos os nomes de cenário na env. Os caminhos REST agora seguem o pedido da fase 2: /auth/session, POST /favorites/:nftId e /quote.

## MockDatabase e persistência

A base central tem usuários, sessões, NFTs, favoritos, carrinhos, perfis, carteiras, cupons, cotações, pedidos, registros de idempotência e agendamentos de pagamento. Carrinhos persistem somente referências de NFT/edição/quantidade; as respostas hidratam o NFT atual. Isso evita preços e estoques divergentes entre listagem, detalhe, carrinho e cotação.

Transações entram numa fila por instância, copiam a base, executam a operação, persistem e só então publicam o novo estado. Uma exceção ou falha de armazenamento descarta a cópia. Concorrência de cadastro, reserva de estoque e chave de idempotência é serializada, sem um repository/service/use-case por endpoint.

`createPersistence` concentra acesso ao storage. O browser usa localStorage; testes Node injetam memória. Um schema Zod verifica toda a estrutura carregada, incluindo valores ETH e estados de pedido. Versões incompatíveis ou JSON corrompido voltam às fixtures; erros de gravação não retornam sucesso.

`store.reset(input)` é a operação interna de reset; HTTP expõe POST /api/__mock/reset. Gera fixtures novas, limpa cenários/contadores/relógio/recursos, invalida sessões e impede que requests atrasadas da geração anterior alterem a base restaurada. O endpoint também remove cookies de sessão e visitante.

O banco é local à instância: a fila não coordena abas ou navegadores diferentes. Persistência após refresh é suportada e testada; concorrência entre abas não é apresentada como backend compartilhado.

## Sessão e isolamento

Cookies jungle_session e jungle_guest representam identidades distintas. Seus valores são UUIDs opacos, impedindo colisões após reset e adivinhação de IDs sequenciais. A aleatoriedade limita-se aos tokens de identidade; fixtures, preços, ordenação, cenários e IDs de recursos de negócio usam dados/contadores reproduzíveis.

A sessão possui token, userId e expiresAt, persistidos na base. GET /auth/session retorna null sem cookie; tokens inválidos ou expirados retornam 401. Login substitui a sessão do mesmo cliente; logout a revoga. Senha alterada invalida as outras sessões da conta.

Somente o usuário obtido da sessão determina a propriedade dos recursos. Corpo da requisição não escolhe userId/owner. IDs de outro usuário retornam 404 em carrinho, cotação, carteira e pedido. Respostas nunca incluem hash/salt. SHA-256 com salt serve apenas como representação simulada; não é um esquema de autenticação de produção.

MSW entrega cookies resolvidos ao handler. Um WeakMap associa esses metadados ao Request durante a operação, pois o browser não permite reescrever livremente o header Cookie. Os testes Node usam jars separados com cookies explícitos, evitando que o cookie store interno do MSW faça dois clientes parecerem uma sessão única. Cookies da simulação são acessíveis ao JavaScript; não são HttpOnly.

## Carrinho e ETH

Visitantes também usam os endpoints de carrinho. O login/cadastro mescla o carrinho visitante uma vez e esvazia a origem. A mesclagem preserva intenção de compra, inclusive quantidades que ficaram indisponíveis; a cotação exige correção dessas quantidades em vez de descartá-las silenciosamente.

Handlers validam quantidade positiva inteira, NFT, edição e estoque. Alterações de catálogo usam updateNftPrice/updateNftAvailability dentro de uma transação, incrementam versão e persistem; nenhuma operação escreve no cache da UI.

ETH usa strings decimais marcadas por Zod, com até 18 casas. Soma e multiplicação reutilizam as utilities existentes. Desconto percentual usa construtor isolado de big.js, arredondado para baixo até um wei. Não existe Number/parseFloat como fonte financeira.

Quote valida carrinho/versão, preço, estoque, cupom e rede. Taxas simuladas: 0.005 ETH para Ethereum e 0.001 ETH para Polygon. VALID10 desconta 10% do subtotal; taxas não recebem desconto. Valores financeiros são retornados pela API, sem regras duplicadas na interface. Quote expira em cinco minutos.

## Pedidos, reserva e idempotência

POST /orders exige Idempotency-Key e consulta o registro por usuário antes de revalidar a cotação. O fingerprint é uma serialização de campos em ordem explícita. Mesma chave e payload retornam o pedido existente (200), mesmo após timeout/refresh; payload diferente retorna 409. O primeiro envio retorna 201. Cotação já utilizada não cria outra compra com uma chave nova.

Antes da criação, o backend revalida cotação, itens, versões, cupom e carteira/rede. Uma assinatura de campos explícitos compara cotações independentemente da ordem das propriedades JSON. Mudanças exigem nova cotação; não são aceitas silenciosamente.

A transação cria pedido pending e reserva estoque. O snapshot copia itens, edição, quantidade, preços, subtotais, desconto, taxa, total, coletor, endereço e rede. Catálogo atualizado posteriormente não altera o recibo.

Agendamentos de pagamento persistem com dueAt e outcome. A próxima chamada REST reconcilia agendamentos vencidos; avançar o relógio ou usar o endpoint de settlement também realiza a transição. Isso permite refresh enquanto pending sem timers perdidos. A fase realtime conectará as operações ao protocolo Socket.IO.

Confirmed e declined são terminais. Confirmação remove somente as quantidades compradas do carrinho e atribui uma referência SIMULATED; recusa preserva itens e libera a reserva. Repetir o mesmo estado não repete efeitos. A fila impede venda simultânea da última unidade para dois pedidos.

Em order-timeout, a resposta é atrasada **fora da transação, depois do commit**. Assim o retry pode encontrar o pedido imediatamente, mesmo enquanto a resposta inicial ainda está pendente.

## Cenários e relógio

A env seleciona o cenário inicial; a escolha persistida sobrevive ao refresh. O controle HTTP pode trocar cenário sem apagar os dados ou resetar tudo.

Latência fica no middleware: default 120 ms, slow-network 1200 ms, variable-latency alterna 1200/200 ms por operação. Contadores persistidos tornam as sequências reproduzíveis. Testes podem sobrescrever a latência e fixar o relógio. Date.now existe apenas na utility de relógio; timestamps de fixtures são estáveis.

Falha de conexão usa HttpResponse.error. HTTP 500, HTTP 503 e timeout são cenários distintos. Os controles ficam fora da injeção de falhas para permitir recuperação. Price-changed/sold-out aplicam uma alteração persistida antes da tentativa de pedido ou da segunda cotação. O erro da compra não desfaz essa alteração do cenário.

Detalhes de todos os cenários e controles: [docs/MOCK-API.md](docs/MOCK-API.md).

## Router, Query e Axios

As políticas existentes permanecem: staleTime 30 s, gcTime 5 min, refetch quando dados obsoletos recuperam foco/conexão e até dois retries em consultas para rede/timeout/5xx. Não há retry automático de mutations. Cancelamentos Axios não viram erros de UI.

Chaves públicas incluem filtros ou NFT ID. Chaves privadas usam ['private', userId]; visitante usa ['guest', guestId, 'cart']. HTTP 401 limpa consultas privadas/sessão, mutations e listeners do socket. A UI de autenticação e callbacks de mutations ainda deverão proteger a identidade da sessão antes de aplicar efeitos tardios.

Rotas privadas, busca visual, optimistic updates e sincronização do QueryClient serão implementadas junto às features; não há demonstrações de sucesso falsas nesta fase.

## Testes e limites

A suíte usa Playwright existente. Testes Node fazem Axios → setupServer MSW → MockDatabase, com base em memória isolada. Testes Chromium fazem Axios → service worker → localStorage, verificando sessão/pedido após refresh e confirmação pelo relógio nos três viewports.

Cobertura inclui login/cadastro, isolamento, filtros/paginação, carrinho, cupons/ETH, estoque concorrente, idempotência/conflito, timeout após commit, snapshot, pagamento recusado, expiração, cenários, resposta fora de ordem, reset com mutation pendente e erro de persistência.

Endpoints /__mock são ferramentas da simulação, não APIs administrativas de produção. Só existem com MSW habilitado e não conectam a dados externos.

O Design System foi implementado na Fase 3, descrita abaixo. Telas, eventos Socket.IO, regressão visual final e Lighthouse ficam para suas fases. A integração de avatar nesta etapa valida formato/tamanho do data URL; a seleção/decodificação de arquivos será feita na feature. Os assets são provisórios. O warning de bundle principal acima de 500 kB permanece registrado para a etapa de performance.

## Resultado de verificação

Fase 2: 42 testes aprovados na suíte completa e 4 testes de reset aprovados na verificação final específica. Typecheck, lint sem warnings, build padrão e build:mock passaram. O teste de navegador comprova Axios/MSW, cookies, localStorage, refresh com pedido pending e confirmação com relógio controlado em 390, 768 e 1440 px. A execução do Chromium exigiu permissão fora do ambiente restrito.

Bundle principal do build mock: aproximadamente 542 kB (171 kB gzip). Mocks: chunk sob demanda de aproximadamente 456 kB (170 kB gzip). O warning de 500 kB foi preservado; Lighthouse não foi executado nesta fase.

## DESIGN SYSTEM

A Fase 3 adiciona apresentação reutilizável, sem chamadas HTTP, estado de sessão, mutations ou imports de mocks. A Home continua temporária; catálogo e fluxos de negócio pertencem às próximas fases.

### Referências e aproximações

O Figma foi consultado, mas ficou inacessível pelo acesso disponível. Os **23 screenshots locais (17 desktop e 6 mobile)** em `src/assets/images-nft/` foram abertos e analisados. Nenhum foi importado ou recortado para compor a UI.

| Tela | Desktop (arquivos .png) | Mobile (arquivo .png) |
| --- | --- | --- |
| Início | desktop-inicio-1, desktop-inicio-2, desktop-inicio-3, desktop-inicio-4 | mobile-inicio-nft-1 |
| Detalhes | desktop-detalhes-nft-1, desktop-detalhes-nft-2 | mobile-detalhesdanft-nft-1 |
| Login | desktop-login-nft-1, desktop-login-nft-2 | mobile-login-nft-1 |
| Cadastro | desktop-cadastro-nft-1, desktop-cadastro-nft-2 | mobile-cadastro-nft-1 |
| Carrinho | desktop-carrinho-nft-1, desktop-carrinho-nft-2 | mobile-carrinho-nft-1 |
| Pagamento | desktop-pagamento-nft-1, desktop-pagamento-nft-2 | mobile-pagamentos-nft-1 |
| Carteiras | desktop-carteiras-nft-1 | Sem referência mobile |
| Confirmação | desktop-confirmarpedido-nft-1 | Sem referência mobile |
| Perfil | desktop-perfildocolecionador-nft-1 | Sem referência mobile |

Padrões extraídos: fundo marrom quase preto, painéis marrons, texto creme, âmbar em ações/preços, bordas finas, tipografia monoespaçada, mídia quadrada, raios maiores no mobile, controles empilhados e navegação compacta. Cabeçalho e rodapé reaproveitam a identidade KURIO, sem links para features inexistentes, newsletter fictícia ou promessas de segurança/transação.

Não há arquivos de fonte nem imagens individuais de NFTs/logo entre os assets fornecidos. A marca é texto; os ícones são Lucide; a ausência de imagem tem representação explícita. Os assets do template continuam preservados para o backend anterior, mas não aparecem na nova UI. Fontes, medidas e cores foram aproximadas a partir dos screenshots, não extraídas do Figma.

### Tokens e tipografia

`src/styles/globals.css` mantém Tailwind v4, `@import`, `@theme inline` e CSS variables. `components.json` mantém shadcn new-york, aliases, Lucide e CSS variables. Não há configuração Tailwind v3, theme switcher ou nova biblioteca visual.

Tokens principais: background #160e0a, card/popover #281911, primary #d58c48, foreground #f5eee5, muted-foreground #bfa984. Input #95734f e ring #f4b86f são mais claros que as linhas decorativas para garantir contraste. Success/warning/destructive têm texto e ícone associados; nenhum estado depende apenas de cor. Raios partem de 6px, com mídia mobile de 16px; espaçamento usa a escala Tailwind de 4px. Camadas: overlay 40, modal 50, popover 60 e skip link 70, declaradas uma vez.

Fonte: `ui-monospace, Cascadia Code, SFMono-Regular, Consolas, Liberation Mono, monospace`, sem download. É uma aproximação substituível pelo token `--font-marketplace`. Classes de display (32–56px), page (26–40px), section (18–22px), card (14px), body (15px), small (14px), label (13px), caption/metadata (12px) e price (14px) preservam hierarquia. Não existem wrappers abstratos H1/Text.

### Camadas e composição

- `ui/`: Button com CVA/Slot; Input, Label, FormField; Select, Checkbox, RadioGroup, Dialog, Sheet, Tabs e Separator baseados em Radix; Badge e Skeleton. Instalados somente os sete pacotes Radix usados. DropdownMenu/Tooltip/toast aguardam um uso concreto.
- `layout/`: PageContainer concentra largura máxima de 76rem e gutters de 16/24/32px. AppLayout preserva skip link, main focável, Outlet e footer. Header possui navegação desktop e Sheet mobile; Footer utiliza as colunas editoriais da referência.
- `shared/`: NFTCard presentational, ETHPrice e QuantitySelector controlado. O link do card é composto por `renderLink` para aceitar o Router, com favorito como irmão, nunca filho do link. Preço recebe string e usa `lib/money.ts`, preservando até 18 casas sem conversão para Number. Imagem recebe src/alt/srcSet/sizes, dimensões, proporção quadrada, object-fit, lazy loading e decoding async.
- `feedback/`: EmptyState, ErrorState e InlineAlert contextuais. RouteError preserva reset; 404 preserva retorno à Home.
- Skeleton, NFTCardSkeleton, NFTGridSkeleton, NFTDetailSkeleton e CartSummarySkeleton reservam espaço antes dos dados. Shimmer usa somente transform/opacidade visual; reduced motion desativa a animação mantendo o anúncio de carregamento.

FormField gera IDs estáveis via useId e entrega id/aria-describedby/aria-invalid ao controle por render prop. A feature futura passa register/ref do RHF e required ao Input/Select; validação permanece fora do Design System. Erros e descrições são visíveis e associados. Botões pendentes usam disabled + aria-busy + texto; não há estratégia de toast ou formulário de negócio antecipado.

### Acessibilidade e validação

Controles mantêm alvos de 44px e focus-visible. Radix gerencia focus trap, Escape e retorno do foco de Dialog/Sheet, além do teclado de Select/Checkbox/Radio/Tabs. Os alvos e as bordas dos campos foram ampliados em relação aos screenshots por acessibilidade.

`/design-system` é uma rota lazy criada somente com `import.meta.env.DEV`; a demonstração não entra no JavaScript de produção. Contém estado local de exemplos claramente identificados, sem chamadas, dados do backend ou persistência. Pode ser removida junto à entrada condicional do Router e aos testes específicos.

Playwright foi estendido nos projetos existentes de 390/768/1440px. Os testes verificam controles, labels/erros, limites, independência favorito/link, Tab/Shift+Tab/Enter/Space/Escape, seleção, foco confinado/restaurado, ausência de overflow, contraste de tokens e reduced motion. Screenshots para inspeção ficam em test-results; não são baselines de regressão final. A comparação visual dos primitives foi feita com as referências locais; a fidelidade das páginas completas será validada nas respectivas fases.

### Verificação final da Fase 3

`npm run check` passou (TypeScript, ESLint sem warnings e build). `npm test`: **60 testes aprovados**, incluindo os 42 anteriores e 18 verificações do Design System nos três viewports. As capturas foram inspecionadas; não houve overflow horizontal. O showcase foi confirmado ausente do JavaScript de produção. O bundle principal ficou em aproximadamente 585 kB (185 kB gzip); o aviso de 500 kB permanece registrado para a fase de performance, sem aumento do limite de warning. Nenhuma feature da Fase 4 foi iniciada.

## HOME / CATÁLOGO — Fase 4

### Fonte de verdade e consultas

O schema `catalogSearchSchema` existente continua sendo a entrada do Router. `q`, `collection`, `priceMin`, `priceMax`, `sort` e `page` controlam interface, requisição e `nftKeys.list(search)`. Parâmetros inválidos usam os defaults do contrato; a URL pode manter a escrita original até a próxima interação, enquanto UI/API usam o valor validado.

A Home compõe seções e passa alterações tipadas ao Router. Busca tem um draft local e envio explícito; cada busca aplicada cria uma entrada no histórico. Filtros desktop/mobile usam o mesmo FilterForm; o draft do Sheet é descartado ao fechar sem aplicar. A chave do formulário acompanha a busca validada para sincronizar back/forward/refresh. Nenhum filtro é persistido em localStorage.

A faixa usa strings decimais validadas e compareEth; o formulário rejeita negativos, formatos inválidos e mínimo maior que máximo. Uma URL com intervalo invertido continua sendo rejeitada com 422 pela API e oferece correção/limpeza na UI. Nenhuma conversão financeira para float foi introduzida.

`features/catalog/api/get-nfts.ts` recebe o Axios da infraestrutura por injeção; `useNfts` acessa ServicesContext e chama useQuery com todos os parâmetros e AbortSignal → Axios signal. A política global de staleTime, gcTime e retry permanece intacta. Consultas antigas deixam de dirigir a tela ao trocar a chave e são canceladas quando não têm observadores.

O catálogo não filtra nem pagina localmente. A resposta mantém pageSize=8, page e total; totalPages é apenas a divisão dessa metadata para os controles. Página fora do intervalo exibe estado específico com retorno à primeira. Paginação reposiciona/foca o catálogo sem animação; mudanças de filtro preservam a rolagem. Navegação para detalhe usa Link e leva a busca tipada para um retorno compartilhável; o histórico do navegador também restaura o estado anterior.

### Carregamento e descoberta

A consulta padrão alimenta Hero, destaque e imagens dos blocos editoriais. No acesso padrão ela compartilha chave/cache com o catálogo e é deduplicada pelo Query. Quando o catálogo está filtrado, a descoberta mantém uma consulta independente para não trocar o Hero a cada busca. Falha ou loading dessa consulta nunca bloqueia a composição textual da Home.

Primeiro carregamento de uma chave sem cache usa NFTGridSkeleton. Refetch da mesma chave conserva a grade, anuncia “Atualizando…” e desabilita somente o controle de atualização. Falha em background mostra aviso com retry e conserva os dados disponíveis. Mudanças de filtro sem cache mostram skeleton, evitando apresentar resultados da combinação anterior como se fossem atuais.

As seções editoriais têm conteúdo estático e imagens recebidas por props da resposta HTTP. Não há leitura direta de fixtures, mutations de favorito, auth, carrinho, checkout ou realtime. Links de futuro acesso a conta/carrinho/newsletter estão desabilitados e identificados como “em breve”; âncoras de catálogo/Diário são funcionais.

### Extensões mínimas do mock e assets

O catálogo não tinha fonte de coleções para a sidebar. NFTListResponse estende Paginated<NFT> com `collections: { id, count }[]`, derivada da base inteira, independente da busca/página, para que filtros não desapareçam ao combinar critérios. O cenário vazio retorna contagens zero. Endpoint, paginação e filtros existentes foram preservados; nenhum endpoint de negócio foi refeito.

As fixtures passam a fornecer quatro SVGs locais de demonstração. A carga de bases anteriores substitui somente URLs reconhecidas do antigo hero.png no catálogo/gallery, sem reset, alteração de preços, contas, sessões ou snapshots de pedidos/cotações. Os testes cobrem preservação dos dados e metadata global. A UI desconhece essa migração.

Figma foi tentado novamente, sem acesso. desktop-inicio-1/2/3/4 e mobile-inicio-nft-1 foram abertos e analisados em conjunto: Hero, sidebar, grade, destaque, painéis, editorial e footer. SVGs são originais e provisórios; não reproduzem a arte oficial. A fidelidade final das imagens depende dos assets oficiais, sem impedir validação estrutural/funcional.

### Validação

A suíte existente foi ampliada nos três projetos Chromium (390, 768 e 1440px), sem novas bibliotecas. Casos cobrem parâmetros HTTP combinados, precisão de preços, sort efetivo, paginação, URL inválida, histórico, refresh, retorno do detalhe, cenários default/empty/slow-network/variable-latency/network-error/server-error, refetch com sucesso/falha e teclado/draft/foco no Sheet. Capturas para inspeção não constituem baselines finais.

O servidor Vite pré-transforma Home e showcase via server.warmup.clientFiles para reduzir o carregamento em cascata de imports lazy na primeira navegação de desenvolvimento. Isso não altera o bundle de produção, políticas de cache HTTP ou timeouts do Playwright.

### Verificação final da Fase 4

`npm run check` aprovado: TypeScript, ESLint sem warnings e build. `npm test`: **101 testes aprovados** na execução completa — 60 anteriores, 39 verificações de catálogo (13 cenários × 3 viewports) e 2 de backend para metadata/migração de assets. Home, Hero e grade foram inspecionados em 390/768/1440px; não houve overflow horizontal nos testes. Os quatro casos afetados inicialmente pela inicialização do servidor passaram na execução final após warmup, sem ampliar timeouts.

O build mantém Home (~94 kB / 32 kB gzip) e placeholder de detalhe em chunks separados; o showcase permanece fora do JavaScript de produção. O bundle principal (~593 kB / 188 kB gzip) continua emitindo o aviso já registrado de 500 kB, reservado para a etapa de performance. Relatório: `playwright-report/index.html`; capturas: `test-results/`. Nenhum commit automático e nenhuma implementação de NFT Detail completo naquela fase.

## NFT Detail — Fase 5

### Rota, consultas e cache

`/nfts/$nftId` continua lazy, com params tipados e busca validada pelo schema existente. `NFTDetailPage` compõe a experiência; `useNft` usa `nftKeys.detail(id)` e `getNft(api, id, signal)`. O ID é codificado no path. O Axios vem de ServicesContext, com normalização de erros, cancelamento e política global de Query preservados.

Não há initialData/placeholderData oriundo das listagens: a resposta específica do detalhe é a autoridade também no primeiro acesso. Consultas já realizadas compartilham o cache por ID, com staleTime de 30 segundos e refetch explícito/foco/reconexão conforme a foundation. Trocar ID cancela consultas sem observadores e separa respostas por chave.

404 usa estado de recurso inexistente e retorno ao catálogo; falhas transitórias oferecem retry. Sem dados, usa NFTDetailSkeleton; com dados, mantém o conteúdo durante refetch e anuncia falha em background. Um 404 posterior tem precedência sobre conteúdo obsoleto.

Relacionados reutilizam `useNfts` e `nftKeys.list` com todos os defaults e a coleção atual. A API filtra/ordena/pagina; a apresentação exclui o NFT atual e limita a cinco cards. Como exclusão e limite são apenas de apresentação, não entram na chave da requisição compartilhada. A consulta tem loading, erro/retry e vazio próprios, sem bloquear o detalhe. Links relacionados preservam o contexto do catálogo; “Ver coleção” inicia uma consulta limpa da coleção.

### Estado de apresentação e aquisição

Galeria deduplica URLs recebidas da API; seleção usa botões com aria-pressed. Uma única imagem não gera miniaturas artificiais. Imagem principal tem dimensões 480×480, proporção estável, prioridade alta e fallback explícito; relacionadas reutilizam NFTCard com lazy loading.

Edição e quantidade são estado local de intenção, reiniciado ao mudar o NFT. A primeira edição disponível é selecionada inicialmente. Opções sem estoque ficam desabilitadas e textuais. Trocar edição reinicia quantidade em 1; o valor efetivo é limitado ao estoque atual em cada render, inclusive após refetch. Se a edição escolhida esgotar, a ação fica indisponível até uma escolha válida. O preço é único por NFT no contrato e não muda artificialmente por edição.

`features/cart` contém somente API e hook reutilizáveis de inclusão. O POST recebe nftId/editionId/quantity, e o servidor resolve owner por cookie e valida estoque acumulado no carrinho. Não há carrinho em estado local nem reserva de estoque ao adicionar. Durante a mutation os controles ficam bloqueados; sucesso e falha usam InlineAlert. Não há retry automático de mutation, conforme a política existente. OUT_OF_STOCK invalida a query do NFT.

A resposta invalida a chave de carrinho do owner retornado, sem popular cache privado com uma resposta tardia. Na Fase 5, não foi criada consulta/página de carrinho nem UI de sessão. A Fase 6 implementa a proteção das transições de identidade e dos efeitos pendentes, descrita abaixo. Favoritos permanecem explicitamente desabilitados; optimistic update/rollback e reconciliação dessa feature ficam para sua etapa específica.

### Limites e validação

Sem alterações em contratos, fixtures, handlers ou banco nesta fase. Os cenários price-changed/sold-out mantêm seus gatilhos de cotação/pedido; testes e demonstração usam os controles REST existentes para preparar preço/estoque persistidos antes de consultar o detalhe. Não há sockets ou eventos locais.

A composição usa as três referências de detalhes complementares; não exibe propriedades ausentes na API. Tablets usam a quebra existente em 768px; desktop mantém cinco cards relacionados e mobile dois. Skeleton, Tabs, RadioGroup, QuantitySelector, ETHPrice, feedback, layout e NFTCard são reutilizados. O warmup de desenvolvimento inclui a nova rota, preservando lazy loading em produção.

`tests/nft-detail.spec.ts` acrescenta 13 cenários executados em 390/768/1440px: URL direta/refresh, API real, imagem/overflow, 404, skeleton, rede/500/retry, edições/min/max, sold-out, preço de um wei/refetch/falha em background, relacionados/contexto da URL, inclusão visitante/persistência, conflito de estoque, erro de mutation e teclado. O teste de ida/volta do catálogo foi atualizado para o título real, preservando o propósito original. Capturas são para inspeção, sem baselines definitivas.

### Verificação final da Fase 5

`npm run check` passou: TypeScript, ESLint sem warnings e build. `npm test`: **140 testes aprovados** na execução completa (7 minutos), incluindo os 101 anteriores e 39 verificações de detalhe (13 cenários × 3 viewports). Acesso direto/refresh, 404, estados MSW, edições, limites, precisão ETH, inclusão visitante, conflito/erro, relacionados, URL e teclado foram validados. Capturas de 390/768/1440px foram inspecionadas; os testes não detectaram overflow horizontal nem erros de console no fluxo nominal.

O detalhe continua em chunk lazy próprio (~18,23 kB / 5,99 kB gzip), com componentes compartilhados extraídos pelo bundler. O bundle principal (~593 kB / 188 kB gzip) mantém o warning pré-existente de 500 kB; não foi aumentado o limite. Nenhuma dependência nova, alteração de backend, baseline visual final ou execução de Lighthouse.

Relatório local: `playwright-report/index.html`. Capturas: `test-results/nft-detail-direct-detail-*/detail.png` e `detail-content.png`. Nenhum commit automático. Na entrega da Fase 5, a próxima etapa era Auth; sua implementação está descrita abaixo.

## Auth / Session — Fase 6

- **Fonte da sessão:** `sessionKeys.all` e `sessionOptions` concentram GET /auth/session. Header, páginas de Auth e composição de NFT Detail compartilham a consulta; não existe Context duplicando usuário nem storage de sessão na UI. Cache/retries seguem a foundation; durante mutations de autenticação, consultas de sessão aguardam a transição.
- **Transições:** `sessionLifecycle`, criado junto aos serviços, guarda somente uma versão de transição e coordenação de requests, não dados do usuário. Login/cadastro cancelam leituras antigas, aplicam a resposta do servidor e removem dados privados anteriores. Logout só confirma a limpeza após 204; falha preserva a sessão conhecida. Reconciliação com outra identidade também limpa o cache privado.
- **Respostas antigas:** Axios registra a versão no início do request e descarta respostas privadas de versões anteriores. 401 antigo não encerra uma sessão nova. O add-to-cart verifica a versão antes de publicar resultado; o painel de aquisição é reiniciado ao mudar a identidade. Queries privadas continuam usando userId; o grupo visitante permanece separado.
- **Limpeza:** `clearPrivateQueries` centraliza cancelamento/remoção de queries privadas, descarte de mutations anteriores e limpeza dos listeners existentes. Mutations de autenticação em andamento são preservadas durante seu próprio commit. `clearSessionCache` também cancela a consulta de sessão e define null. Catálogo permanece em cache; login/cadastro apenas invalidam o cache visitante após o merge já executado pelo backend.
- **401 e navegação:** o interceptor distingue login/register de requests com sessão. INVALID_CREDENTIALS não dispara redirect global. Expiração atual limpa sessão e chama o callback registrado pelo Router, que usa navigate com reason=expired e retorno validado. Login/register não se redirecionam em loop. Network/5xx permanecem erros de consulta, distintos de null/401.
- **Guard e retorno:** `requireSession(services, href)` recebe os serviços do contexto, aguarda transições e consulta o QueryClient antes de decidir. Ausência de sessão gera redirect; indisponibilidade propaga erro recuperável. `safeReturnTo` aceita Home, detalhe e destinos privados previstos (checkout, perfil/carteiras e pedidos), preservando search/hash. Rejeita origem externa, barras invertidas, controles, caminhos desconhecidos e login/register. Os destinos privados ainda não têm páginas nesta fase.
- **Formulários:** RHF usa schemas existentes; cadastro acrescenta somente confirmação local. Payloads são enviados via Axios. Credenciais ficam em referência transitória consumida pela mutation, que não recebe variáveis com senha. Referência/campos são limpos após a tentativa; erros normalizados não carregam config Axios. Conflitos de e-mail e fieldErrors são associados aos inputs, com foco após reabilitar o formulário.
- **Apresentação:** rotas lazy usam Dialog existente, fundo composto de Hero/NFTCard e dados públicos da API. Foi acrescentado closeDisabled ao Dialog e composto PasswordInput com os primitives existentes. Foco, Escape, labels, autocomplete, campos obrigatórios, controle de senha e rolagem em viewport baixo foram validados. Social/recuperação não têm sucesso fictício.
- **Escopo:** nenhum contrato, handler, fixture ou banco foi refeito. O merge visitante permanece autoritativo no backend. Não há perfil, checkout, carteiras, pedidos, favoritos completos ou realtime novos. Testes do guard usam a infraestrutura HTTP existente, sem novas rotas de produto apenas para testes.

### Verificação final da Fase 6

`npm run check` aprovado: TypeScript, ESLint sem warnings e build de produção. `npm test`: **198 testes aprovados** na execução completa (10,1 minutos), sem retries — 140 anteriores e 58 novos (54 verificações de Auth em navegador, três de foundation e uma integração HTTP do guard).

Foram validados login/cadastro reais por HTTP, confirmação local de senha, conflito 409, credenciais inválidas, rede/500/retry, bloqueio de duplo envio, restauração após refresh, logout confirmado/falho, A → B → A, expiração/401, rejeição de respostas antigas, redirects internos e preservação do carrinho visitante. A regressão inclui Home, filtros, paginação, detalhe, backend e Design System. O setup do teste de detalhe agora aguarda a consulta inicial de sessão antes do reset do mock, evitando um conflito de reset pendente; as verificações de console foram mantidas.

Login e cadastro foram inspecionados em 390/768/1440px. Os testes verificaram foco, teclado, autocomplete, erros associados aos campos, toggle de senha, ausência de overflow horizontal e CTA acessível com viewport de 500px de altura. As capturas foram comparadas às referências locais; não constituem baseline visual definitiva, e o teclado virtual físico não foi testado.

Auth permanece em chunk lazy (~41,42 kB / 14,80 kB gzip); o principal ficou em ~337,78 kB / 107,56 kB gzip. O build atual não emite warning de chunk acima de 500 kB; isso não substitui a avaliação final de performance. Nenhuma dependência, contrato, handler ou fixture foi alterado nesta fase. Sem Lighthouse ou realtime.

Relatório: `playwright-report/index.html`. Capturas: `test-results/auth-direct-Login-and-Regi-*/login.png` e `register.png`. Login social e recuperação de senha continuam indisponíveis por não terem endpoints. Na entrega da Fase 6, a próxima etapa era Carrinho; sua implementação está descrita abaixo. Nenhum commit automático; sugestão: `feat(auth): implement authentication and session flows`.

## Carrinho — Fase 7

- **Consulta e identidade:** `useCart` compartilha GET /cart entre Header e página, após a sessão ser conhecida. Usuário usa a chave privada existente com userId; visitante usa `['guest', 'current', generation, 'cart']` até a API resolver seu cookie opaco. A geração da sessão separa consultas antes/depois de autenticar ou sair. A resposta deve corresponder à identidade esperada; epochs da Fase 6 continuam descartando respostas antigas. As telas de autenticação e o showcase mostram somente o link do carrinho, sem buscar seu contador.
- **Persistência:** toda leitura/escrita, inclusive visitante, continua passando por Axios → REST → MSW → MockDatabase. A UI não mantém um armazenamento paralelo, totais persistidos ou eventos locais simulando realtime. O backend mantém identidade/edição/quantidade; GET hidrata as informações atuais do NFT.
- **Escritas:** inclusão reaproveita a mutation da Fase 5. Quantidade/remoção usam mutation sem retry automático, escopo por cartId e controles pendentes. Consultas concorrentes são canceladas; uma resposta confirmada atualiza somente a chave daquele carrinho. DELETE é seguido de GET para obter a nova versão autoritativa. Conflitos de estoque renovam carrinho e detalhe afetado, sem refetch global. Não há optimistic update.
- **Merge:** login/register mantêm a transação original, somando edições iguais e limpando o visitante uma única vez. O único ajuste transfere couponCode quando o usuário não possui outro e limpa o código visitante junto aos itens. Não há replay de POST por item na UI. Excesso de quantidade permanece visível e deve ser corrigido; nada é descartado silenciosamente. Logout não transforma carrinho privado em visitante.
- **Cotação:** `useCartQuote` usa mutation porque POST /quote cria snapshot e persiste cupom, sem retry automático. O fingerprint contém owner/geração, cartId/version, couponCode, rede e versões/quantidades dos NFTs. Um resultado só pode aparecer se corresponder ao fingerprint atual; writes/refetch bloqueiam continuidade. Solicitações são sequenciais e uma mudança durante a consulta agenda a próxima, evitando que uma cotação antiga restaure valores anteriores. A mutation usa o grupo de chaves privadas de quote existente para usuários; visitante fica no grupo guest e gcTime é zero.
- **Validade e preço:** expiresAt é comparado ao cabeçalho HTTP Date do servidor para obter a duração restante, evitando dependência do relógio absoluto do navegador. Um timeout simples renova a cotação; uma resposta sem validade utilizável vira erro. Novas linhas da quote fornecem preço/subtotal atuais mesmo quando o cenário alterou preço entre GET e POST. Falhas de estoque/versão renovam GET /cart; o gatilho dos cenários foi estendido ao dono visitante, preservando a segunda quote como gatilho.
- **Extensão mínima de backend:** POST /quote resolve o carrinho pelo cookie e rejeita cartId de outro dono. Para visitante, reutiliza calculateQuote, persiste somente couponCode e devolve prévia com ID próprio, sem gravar uma StoredQuote que pudesse autorizar pedidos. POST /orders continua exigindo sessão e uma quote pertencente ao usuário; a prévia visitante continua inválida após login. Nenhum DTO ou schema de banco precisou mudar.
- **Cupom:** RHF/Zod valida a entrada local; INVALID_COUPON e EXPIRED_COUPON vêm da API e ficam associados ao campo. O código digitado é uma intenção local, enquanto somente a cotação bem-sucedida persiste o código normalizado. Remoção também passa por quote. Refresh restaura o último código confirmado.
- **Apresentação e fronteira:** CartPage compõe itens, resumo/cupom, recomendações e feedback. QuantitySelector/ETHPrice/FormField/EmptyState/ErrorState/skeletons são reutilizados. Subtotais de linha sem quote usam apenas multiplicação decimal exata; o resumo financeiro nunca é calculado na UI. /checkout é somente uma continuidade protegida com requireSession e retorno ao carrinho; não implementa coletor, rede, carteira, pedido ou pagamento.

- **Compatibilidade das imagens:** o catálogo aponta diretamente para os PNGs existentes em public/artwork. A persistência converte apenas URLs conhecidas dos antigos SVGs para PNGs durante load, além da migração de template já existente. URLs personalizadas e snapshots de pedidos permanecem intactos; o teste de migração verifica também contas, sessões e preços.
