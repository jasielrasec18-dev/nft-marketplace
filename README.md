# NFT Marketplace — Jungle Gaming

Marketplace de demonstração do [Frontend Challenge](https://github.com/junglegaming/frontend-challenge), com React 19, TypeScript, Vite, TanStack Router/Query, Axios, MSW e Socket.IO. Catálogo, autenticação, perfil, carteiras, favoritos, carrinho, checkout e pedidos consomem os contratos da API simulada.

## Executar

Node.js **22.19+** e npm. No PowerShell, use `npm.cmd`/`npx.cmd` quando scripts PowerShell estiverem bloqueados.

```sh
npm ci
npm run dev:mock
```

Não é necessário backend, extensão de carteira, blockchain ou gateway. O MSW intercepta HTTP e WebSocket no navegador. O pagamento é explicitamente simulado.

| Conta de demonstração | Senha |
| --- | --- |
| collector@example.com | Jungle123! |
| second@example.com | Jungle123! |

Cada conta possui perfil, carteira Ethereum, favorito e carrinho próprios. Há 32 NFTs, quatro coleções e duas edições por NFT. Cupons: `VALID10` (10%), `EXPIRED10` (expirado); códigos desconhecidos são inválidos.

## Fluxos

- Busca, filtros, ordenação e paginação persistem na URL, inclusive ao voltar do detalhe.
- O visitante pode montar um carrinho. Login/cadastro fazem merge no servidor, preservando conflitos de estoque para revisão.
- Perfil, avatar local e senha são editáveis. Carteiras aceitam Ethereum/Polygon, com uma principal e uma secundária por conta.
- Favoritos no detalhe usam atualização otimista, persistência e rollback em falhas.
- O checkout exige carteira compatível e conexão simulada autorizada. Revalida preço, disponibilidade e totais antes do pedido; mudanças exigem nova confirmação.
- Cada intenção de compra tem chave de idempotência e payload estáveis. Timeout e refresh oferecem recuperação da mesma tentativa.
- Pedidos possuem estados pending, confirmed e declined. O recibo usa o snapshot imutável; confirmação remove somente quantidades compradas.
- Eventos Socket.IO atualizam catálogo/detalhe, invalidam cotações e sincronizam pedidos privados. Reconexão reconcilia os dados por REST.

## Build e deploy na Vercel

```sh
npm run build:mock
npm run preview
```

`vercel.json` define Vite, `npm run build:mock`, saída `dist`, fallback SPA para `index.html` e cache desabilitado para `mockServiceWorker.js`. Ao importar o repositório na Vercel, mantenha essas configurações. Não defina `VITE_MOCK_ENABLED=false` no ambiente da demo.

Valide após publicar: abrir diretamente `/nfts/nft-001`, `/cart`, `/checkout`, `/account/profile` e `/orders/<id>`; recarregar; fazer login e uma compra simulada. Rotas privadas devem retornar ao login e recuperar o destino.

Esta entrega prepara os arquivos para deploy. A atualização da publicação depende de enviar as alterações ao repositório conectado ou executar o deploy no projeto Vercel. Nenhum commit ou deploy é feito automaticamente.

## Ambiente

`dev:mock` e `build:mock` carregam `.env.mock`. O modo normal usa mocks desabilitados. Todas as variáveis `VITE_*` são públicas; não coloque segredos nelas.

| Variável | Padrão normal | Uso |
| --- | --- | --- |
| VITE_API_BASE_URL | /api | Prefixo REST |
| VITE_API_TIMEOUT_MS | 10000 | Timeout Axios |
| VITE_MOCK_ENABLED | false | Inicializa MSW antes da aplicação |
| VITE_MOCK_SCENARIO | default | Cenário de uma base nova |
| VITE_SOCKET_URL | http://localhost:3001 | Endereço Socket.IO |

No modo mock, Socket.IO usa `https://socket.jungle.test`, interceptado localmente; não existe serviço externo nesse endereço. A aplicação é importada depois do MSW para o cliente capturar o WebSocket interceptado.

Use `.env.example` apenas como referência para personalização. Valores em `.env.local` podem sobrescrever o modo mock. O cenário persistido tem precedência sobre a env.

## Cenários e reset

`default`, `empty`, `slow-network`, `variable-latency`, `network-error`, `server-error`, `service-unavailable`, `request-timeout`, `session-expired`, `unauthorized`, `register-conflict`, `invalid-coupon`, `expired-coupon`, `price-changed`, `sold-out`, `order-timeout`, `payment-confirmed`, `payment-declined`.

No console da demo (desenvolvimento ou preview):

```js
await fetch('/api/__mock/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'default', latencyMs: 0 }),
})
location.reload()
```

A base fica em `localStorage['jungle.mock-database.v1']`; intenções de compra ficam em `sessionStorage`, por usuário e aba. O reset reinicia recursos, sessões, contadores e pagamentos. Para uma limpeza completa, remova também as chaves `jungle.purchase-intent.*` do sessionStorage.

Os controles HTTP permitem alterar preço/estoque, avançar o relógio, liquidar pedidos e simular desconexão/reconexão. São exclusivos do modo mock. Veja [MOCK-API](docs/MOCK-API.md).

## Validação

```sh
npx playwright install chromium
npm run check
npm test -- --workers=2
npm run lighthouse
```

| Comando | Finalidade |
| --- | --- |
| npm run check | Tipos, lint e build normal |
| npm run build:mock | Build da demo |
| npm test | Suíte completa |
| npm run test:mocks | Integração HTTP/MockDatabase |
| npm run test:foundation | Contratos, dinheiro e ciclo de sessão |
| npm run test:e2e | Navegador em 1440, 768 e 390 px |
| npm run test:visual | Comparar baselines de Home, detalhe, carrinho e checkout |
| npm run test:a11y | Auditoria axe WCAG A/AA e reflow |
| npm run test:report | Abrir relatório Playwright |
| npm run lighthouse | Build otimizado + 12 medições reais |
| node scripts/optimize-artwork.mjs | Regenerar derivados WebP dos PNGs originais |
| npm run msw:init | Atualizar worker após atualização do MSW |

Baselines em `tests/visual.spec.ts-snapshots`, geradas no Chromium/Windows. Atualize com `npm run test:visual -- --update-snapshots` somente após inspecionar mudanças intencionais. Fontes do sistema podem variar entre plataformas.

Lighthouse mede Home e detalhe em desktop/mobile, três vezes cada, com configurações oficiais e contexto novo por execução. HTML/JSON e medianas ficam em [reports/lighthouse](reports/lighthouse). O comando falha se as medianas ficarem abaixo de Performance 90, Accessibility 95, Best Practices 95 ou SEO 90. Não execute junto com testes pesados.

Os resultados consolidados e limitações constam em [Relatório final](docs/FINAL-REPORT.md). A estrutura e as decisões estão em [ARCHITECTURE](ARCHITECTURE.md).

## Referências e limites da demonstração

O Figma não estava acessível no ambiente de implementação; a interface foi baseada nos screenshots locais em `src/assets/images-nft`, sem usá-los como interface. Tipografia e medidas são aproximações. As artes são assets locais de demonstração, servidos em WebP responsivo; os PNGs originais foram preservados.

O mock é uma simulação por aba, com persistência no navegador, sem sincronização transacional entre abas/dispositivos. Contas, cookies, hashes e dados não representam segurança de produção. Não use dados reais. Newsletter permanece desabilitada por não haver contrato de inscrição no desafio. Não há transação financeira nem envio a carteiras reais.
