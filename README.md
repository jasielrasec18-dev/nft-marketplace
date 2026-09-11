# NFT Marketplace — Jungle Gaming

Implementação do [Frontend Challenge da Jungle Gaming](https://github.com/junglegaming/frontend-challenge), com React e TypeScript. **Estado atual: fases 0, 1 e 2 — fundação e backend simulado.** A interface continua com Home mínima e 404; as telas de negócio serão implementadas nas próximas fases.

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

Há 32 NFTs, quatro coleções, duas edições por NFT e variedade de preços/estoques. A imagem local do template é provisória. Cupons: `VALID10` (10%), `EXPIRED10` (expirado); qualquer código desconhecido é inválido.

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
  features/      # diretórios reservados para as próximas fases
  components/    # UI, layout e feedback existentes
  routes/        # Home mínima e 404
  mocks/         # fixtures, database, handlers, cenários e persistência
  lib/           # ETH preciso e cn
tests/           # fundação, backend HTTP e smoke/persistência em navegador
```

A UI consumirá `TanStack Query → Axios → REST → MSW`. Fixtures não são importadas por componentes, hooks, páginas ou serviços de aplicação.

Tecnologias configuradas: React, TypeScript, Vite, TanStack Router/Query, Axios, Tailwind v4, shadcn/ui, MSW, Playwright, Zod e big.js. React Hook Form/resolvers, Lucide e socket.io-client estão preparados para as próximas features.

Decisões detalhadas: [ARCHITECTURE.md](ARCHITECTURE.md). README original do template: [docs/VITE-TEMPLATE.md](docs/VITE-TEMPLATE.md).

## Limites e próxima fase

A fase 2 não implementa as telas, integração do cache com mutations, eventos Socket.IO, regressão visual ou Lighthouse. Os pagamentos evoluem pelo relógio simulado e são reconciliados na próxima chamada REST ou pelo controle de relógio. Não há emissão de eventos falsos para a interface.

A simulação é local a uma instância da aplicação; não é um servidor compartilhado entre navegadores/abas. Os tokens e dados locais não constituem autenticação de produção. Os assets e tokens visuais permanecem provisórios. O aviso de bundle principal acima de 500 kB continua como pendência da fase de performance.

Para testar o build: `npm run build:mock` e `npm run preview`. O deploy final precisará servir `dist/` por HTTPS e tratar URLs de páginas como SPA. Publicação e Lighthouse pertencem às fases posteriores.

**Próxima etapa: FASE 3 — Design System.**

## Validação da fase 2

TypeScript e ESLint passaram; builds padrão e com mocks concluídos. A suíte completa teve 42 testes aprovados: 23 de backend, 7 de fundação e 12 de navegador. Após o último reforço da proteção de reset, os 4 testes relacionados foram repetidos e passaram. O relatório HTML da suíte completa está em playwright-report/index.html (gerado localmente, não versionado).
