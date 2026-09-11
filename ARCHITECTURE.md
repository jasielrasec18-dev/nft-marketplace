# Arquitetura — fundação e Mock Backend

## Escopo atual

Fases 0 e 1 preservadas; fase 2 adiciona backend simulado, persistência e cenários. Nenhuma tela de negócio foi criada.

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

Design System completo, telas, eventos Socket.IO, regressão visual e Lighthouse ficam para suas fases. A integração de avatar nesta etapa valida formato/tamanho do data URL; a seleção/decodificação de arquivos será feita na feature. Os assets são provisórios. O warning de bundle principal acima de 500 kB permanece registrado para a etapa de performance.

## Resultado de verificação

Fase 2: 42 testes aprovados na suíte completa e 4 testes de reset aprovados na verificação final específica. Typecheck, lint sem warnings, build padrão e build:mock passaram. O teste de navegador comprova Axios/MSW, cookies, localStorage, refresh com pedido pending e confirmação com relógio controlado em 390, 768 e 1440 px. A execução do Chromium exigiu permissão fora do ambiente restrito.

Bundle principal do build mock: aproximadamente 542 kB (171 kB gzip). Mocks: chunk sob demanda de aproximadamente 456 kB (170 kB gzip). O warning de 500 kB foi preservado; Lighthouse não foi executado nesta fase.
