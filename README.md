# NFT Marketplace — Jungle Gaming

Base do Frontend Challenge, implementada com React e TypeScript. **Estado atual: fases 0 e 1 (setup e fundação).** Há uma página inicial mínima e uma página 404; os fluxos do marketplace ainda não foram implementados.

O [README oficial do desafio](https://github.com/junglegaming/frontend-challenge) define os requisitos. O [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1&p=f) é a referência visual. O README original do template foi preservado em [docs/VITE-TEMPLATE.md](docs/VITE-TEMPLATE.md).

## Execução

Requisitos: Node.js 22.12+ (validado com Node 24) e npm. No PowerShell, use `npm.cmd`/`npx.cmd` se a política local bloquear os scripts `.ps1`.

```sh
npm ci
npm run dev
```

Não é necessário criar um arquivo de ambiente para iniciar. Para configurar, copie `.env.example` para `.env.local`. Variáveis `VITE_*` são públicas e não devem conter segredos.

| Variável | Padrão | Uso |
| --- | --- | --- |
| VITE_API_BASE_URL | /api | Prefixo REST no mesmo host |
| VITE_API_TIMEOUT_MS | 10000 | Timeout HTTP em milissegundos |
| VITE_MOCK_ENABLED | false | Ativa o worker MSW antes do React |
| VITE_MOCK_SCENARIO | default | Único nome aceito nesta fase; sem fixtures ainda |
| VITE_SOCKET_URL | http://localhost:3001 | URL reservada; cliente não conecta automaticamente |

`npm run dev:mock` e `npm run build:mock` carregam `.env.mock`. Evite sobrescrever `VITE_MOCK_ENABLED` em `.env.local` ao testar esses modos.

## Comandos

| Comando | Finalidade |
| --- | --- |
| npm run dev | Desenvolvimento |
| npm run dev:mock | Desenvolvimento com MSW |
| npm run typecheck | TypeScript da aplicação, ferramentas e testes |
| npm run lint | ESLint sem warnings |
| npm run build | Build em dist |
| npm run build:mock | Build com bootstrap do MSW habilitado |
| npm run preview | Servir o último build |
| npm run check | Tipos, lint e build |
| npm run msw:init | Atualizar o worker depois de atualizar MSW |
| npm test | Testes de fundação e smoke tests |
| npm run test:foundation | Precisão ETH, URL, erros e cache |
| npm run test:e2e | Navegação em Chromium: 390, 768 e 1440 px |
| npm run test:report | Abrir relatório HTML do Playwright |

Antes do primeiro teste no navegador:

```sh
npx playwright install chromium
npm test
```

O Playwright inicia seu próprio servidor com mocks na porta 4173. Relatórios ficam em `playwright-report/`; traces e screenshots de falhas, em `test-results/`. Os diretórios gerados não são versionados.

## Tecnologias

Configuradas: React, TypeScript estrito, Vite, Tailwind CSS v4, shadcn/ui (Button local adaptado), TanStack Router, TanStack Query, Axios, MSW, socket.io-client, Zod, big.js e Playwright.

React Hook Form, resolvers Zod e Lucide React estão instalados para as próximas features. O Socket.IO tem fábrica tipada e `autoConnect: false`; não há simulação de eventos nesta fase. Lighthouse será configurado e executado na fase de qualidade, com telas reais; não há pontuações de auditoria nesta entrega parcial.

## Estrutura

```text
src/
  app/           # env, router, providers, query, services e cliente Socket.IO
  api/           # Axios e normalização de erros
  contracts/     # sessão, NFT, favorito, carrinho, cotação, pedido, perfil, carteira, eventos
  features/      # diretórios reservados para os domínios
  routes/        # Home mínima e 404
  components/    # layout, feedback, shared e ui
  mocks/         # bootstrap MSW; handlers ainda vazios
  hooks/         # reservado
  lib/           # money e cn
  styles/        # Tailwind e tokens provisórios
  assets/        # assets existentes preservados
tests/           # fundação e smoke
```

Consulte [ARCHITECTURE.md](ARCHITECTURE.md) para contratos e decisões.

## Limites desta fase e próximo passo

Não há usuários, credenciais, fixtures, reset de cenários, backend simulado de negócio, autenticação, catálogo, compra ou persistência ainda. Não são necessários serviços privados. Requisições não tratadas sob `/api` falham explicitamente quando MSW está habilitado.

Próxima etapa: **fase 2 — MockDatabase, fixtures e handlers REST MSW**, com persistência e reset determinístico. Depois virão o design system e os fluxos, seguindo a ordem do pedido.

Os tokens foram derivados provisoriamente da descrição fornecida; os valores e assets exatos do Figma ainda precisam ser extraídos. Não há alegação de fidelidade visual, regressão visual completa, auditoria Lighthouse ou deploy nesta fase. O deploy final deverá servir `dist/`, habilitar mocks e redirecionar URLs de páginas para `index.html`.
