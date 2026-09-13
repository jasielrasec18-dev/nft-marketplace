# Arquitetura — NFT Marketplace

## Fluxo de dados

```text
React → hooks/features → TanStack Query → Axios → REST → MSW → MockDatabase
                                                        ↓ commit
React ← cache/invalidação ← Socket.IO client ← WebSocket/MSW binding
```

A UI não importa fixtures nem o banco dos mocks; o ESLint protege essa fronteira. HTTP e WebSocket usam a mesma instância de MockDatabase. Somente o bootstrap importa os mocks, em paralelo aos módulos da interface. A renderização e os requests aguardam o worker. O cliente Socket.IO carrega sob demanda quando a sessão está pronta para conectar.

## Organização

- `contracts`: DTOs e schemas Zod compartilhados.
- `api`: Axios, normalização de erros, timeout e interceptação de sessão expirada.
- `app`: serviços por aplicação, router, QueryClient, socket e ledger de eventos.
- `features`: catálogo, NFT, auth, perfil, carteiras, favoritos, carrinho, checkout e pedidos.
- `components/ui`: primitivas Radix/shadcn; `layout` e `shared`: composição visual.
- `mocks`: handlers, cenários, relógio, persistência e operações transacionais.
- `tests`: integração, E2E, acessibilidade e baselines visuais.
- `scripts`: derivados de imagens e auditoria Lighthouse.

## Banco e contratos

MockDatabase reúne usuários, sessões, NFTs, favoritos, carrinhos, perfis, carteiras, cupons, quotes, pedidos, idempotência e agendamentos de pagamento. Cada transação copia o estado, executa a operação, persiste e publica o novo estado. Falhas da operação/persistência não aplicam o rascunho. Eventos são derivados dos recursos versionados após commit.

Carrinhos armazenam IDs/edições/quantidades e são hidratados com o catálogo atual. Valores ETH são strings decimais validadas, calculadas com big.js; não há aritmética financeira em ponto flutuante.

O relógio central pode ser real ou fixo. Um agendador no mock liquida pagamentos vencidos; REST e controles de relógio também executam a mesma função. A UI não inventa confirmação por timer.

Persistência em localStorage usa schema Zod e migração dos caminhos antigos das artes para WebP. URLs de imagens customizadas são preservadas. A simulação é por instância/aba; não implementa locks entre abas.

## Sessão e isolamento

`session-lifecycle` mantém uma geração monotônica, serializa transições, cancela requests privados e remove queries/mutations privadas ao trocar sessão. Respostas tardias são rejeitadas pelo Axios e pelos hooks que capturaram a geração. Queries privadas incluem userId na chave; públicas permanecem reutilizáveis.

Login/cadastro fazem merge do carrinho visitante no backend. Rotas privadas aguardam a restauração de sessão; o retorno aceita somente destinos internos permitidos. Erro 401 de uma sessão corrente expira o cache e navega ao login. Credenciais inválidas no login permanecem no formulário.

O socket desconecta e remove listeners em transições/HMR. O bridge vive no AppLayout, evitando disputar consultas de sessão do beforeLoad durante o Strict Mode. Ele conecta somente após estado de sessão conhecido, inclusive visitante.

## Perfil e carteiras

Formulários React Hook Form/Zod reutilizam feedback e foco de erros. Dados confirmados de perfil atualizam também o header; o preview do avatar permanece local até o PATCH. Avatar aceita PNG/JPEG/WebP em data URI, com limite de 250 KB.

Senhas passam diretamente ao request, nunca às variáveis persistidas da mutation. Refs temporárias e campos são limpos após sucesso/falha. O mock armazena somente hash com salt; isso é demonstração, não implementação de autenticação para produção.

Carteiras validam endereço, rede e papel. Cada usuário pode ter uma principal e uma secundária. Duplicidade e conflito de papel retornam erros explícitos, sem trocas silenciosas.

## Favoritos

GET inicial por usuário. onMutate cancela consultas concorrentes, guarda snapshot e atualiza o cache otimisticamente. Falha restaura o snapshot somente se a geração ainda for válida. Ao terminar, o recurso é invalidado para reconciliação. Cliques concorrentes ficam bloqueados; visitante é enviado ao login com retorno ao detalhe.

## Quote e checkout

Quote depende de cartId/version, rede, cupom e versões de NFT. Seu prazo é calculado a partir do Date HTTP, tolerando diferença entre relógio do servidor e navegador. Mudanças de carrinho, eventos relevantes ou reconexão invalidam a apresentação da cotação antiga.

Antes de POST /orders, o checkout solicita nova quote. Compara linhas, versões, preços, rede e totais com a revisão apresentada. Também verifica se um evento relevante chegou durante o request. Qualquer mudança interrompe o envio e exige nova confirmação. O servidor refaz as validações de estoque, versões e fingerprint, protegendo a corrida entre revalidação e criação.

A conexão de carteira é uma autorização simulada via POST /wallets/:id/connect. Selecionar outra rede/carteira remove a conexão local anterior. Não há acesso a extensão ou blockchain.

## Idempotência e recuperação

Antes do primeiro POST, a intenção completa é salva em sessionStorage: userId, UUID de idempotência e payload validado. Cliques repetidos são bloqueados. Timeout/erro incerto conservam a intenção; recuperar repete exatamente chave e payload, inclusive após refresh.

O backend escopa a chave por usuário. Mesma chave/payload retorna o pedido existente antes de verificar quote já usada ou estoque reservado. Payload diferente gera conflito. Erros de negócio que comprovam rejeição permitem nova revisão; conflito de idempotência e falha incerta não geram nova chave automaticamente.

GET /orders/:id verifica propriedade. Refresh restaura pelo ID; enquanto pending, polling REST de 2 s complementa eventos e permite recuperação offline. Versões antigas e regressão de terminal para pending são recusadas.

## Pedidos e recibo

A criação reserva estoque e captura snapshot de linhas, coletor, carteira, rede, cupom, taxas e totais. Confirmação remove somente quantidades compradas do carrinho atual, preservando inclusões posteriores. Recusa devolve estoque e mantém carrinho.

A UI renderiza o snapshot do GET, nunca o catálogo atual. Apenas confirmed apresenta recibo e referência SIMULATED. Ao atingir estado terminal, a intenção correspondente é limpa e o carrinho é reconciliado.

## Tempo real

`@mswjs/socket.io-binding` implementa os frames Engine.IO/Socket.IO sobre o WebSocket interceptado pelo MSW. O handler acompanha a normalização de /socket.io/ para / feita pelo MSW 2.15. Heartbeat mantém o transporte; não há servidor Node adicional.

- `nft.updated`: eventId, versão, instante, nftId, preço, estoque e edições.
- `order.updated`: eventId, versão, instante, orderId, userId e status.
- `order.subscribe/unsubscribe`: assinatura limitada a pedidos da sessão capturada na conexão.

O mock valida cookie/sessão e propriedade ao assinar e entregar eventos privados; não confia em userId enviado pelo cliente. O cliente também valida payload com Zod, userId e geração.

O ledger público retém até 256 recursos e 512 eventIds. O privado retém 128 recursos e 256 eventIds por ciclo de sessão. Histórico de replay do mock é limitado a 128 eventos. Duplicatas/versões antigas são descartadas. Eventos de pedidos invalidam GET; não montam recibos incompletos a partir de status.

No reconnect, invalidam-se catálogo, detalhe, carrinho corrente e pedidos privados. A quote é renovada e a rota reassina seu pedido. O GET restaura eventos perdidos. O primeiro connect evita refetch duplicado desnecessário.

## Interface e entrega

Tokens CSS/Tailwind v4 seguem a referência marrom/âmbar e fonte monoespaçada do sistema. Primitivas Radix fornecem foco, teclado e semântica de dialogs/selects. Formulários usam labels, mensagens associadas, estados pendentes, erros e skeletons. Layouts são testados em 390/768/1440 px, com reflow adicional a 320 px.

Rotas são carregadas sob demanda. Artes derivadas WebP em 384/768 px têm dimensões explícitas e srcset; hero/detalhe priorizam imagem principal e cards usam lazy loading. PNGs de origem permanecem no projeto.

Vercel compila a demo com MSW e aplica fallback SPA. Lighthouse executa build otimizado com presets oficiais, contexto novo por rodada, três medições por página/perfil e medianas, preservando HTML/JSON. Resultados e aceite estão em [FINAL-REPORT](docs/FINAL-REPORT.md).
