# Requirement audit — início da fase final

Workspace local: main, HEAD ecf5793 (Carrinho). Fases 0–7 presentes em commits; Fase 8 no working tree, validação pendente. Fonte normativa: https://github.com/junglegaming/frontend-challenge . Figma e protótipo não abriram; quatro referências locais de pagamento/confirmação foram inspecionadas.

| Requirement | Status | Evidence | Action |
| --- | --- | --- | --- |
| Home/Catalog | DONE | src/features/catalog; tests/catalog.spec.ts | Preservar |
| Search | DONE | catalog-search; REST q | Regressão |
| Filters | DONE | filter-form; API combinável | Regressão |
| Sort | DONE | catalog-toolbar; REST sort | Regressão |
| Pagination | DONE | pagination; API page | Regressão |
| URL state | DONE | catalog-state; TanStack Router | Regressão |
| NFT Detail | DONE | nft-detail-page; tests/nft-detail | Integrar favoritos/realtime |
| Favorites | MISSING | favorites.handlers existe; UI desabilitada | GET/add/remove otimista e rollback |
| Cart | DONE | features/cart; tests/cart | Integrar realtime |
| Guest cart | DONE | cookie guest; DB persistida | Preservar |
| Cart merge | DONE | db/cart; testes HTTP | Preservar |
| Coupon | DONE | POST quote; formulário carrinho | Revalidar no checkout |
| Quote | PARTIAL | features/cart/api/cart | Revalidação explícita no checkout |
| Login | DONE | features/auth | Regressão |
| Register | DONE | features/auth | Regressão |
| Session | DONE | session-lifecycle | Integrar cleanup realtime |
| Logout | DONE | use-logout | Regressão |
| Profile | PARTIAL | working tree Fase 8 | Concluir testes |
| Password | PARTIAL | working tree Fase 8 | Concluir testes |
| Avatar | PARTIAL | working tree Fase 8 | Concluir testes |
| Wallets | PARTIAL | working tree Fase 8 | Concluir testes |
| Checkout | MISSING | somente checkout-handoff-page | Criar formulário/revisão/conexão simulada |
| Orders | PARTIAL | contracts/order; db/orders; handlers | Criar rota privada e recovery |
| Idempotency | PARTIAL | db/orders testado | Intenção estável no cliente |
| Payment states | PARTIAL | backend pending/confirmed/declined | UI dependente de REST/evento |
| Receipt | MISSING | snapshot disponível | Renderizar somente confirmed |
| Socket.IO | MISSING | app/socket desconectado | MSW binding e transporte real |
| Reconnection | MISSING | sem listeners de aplicação | Reconcile REST |
| User isolation | PARTIAL | lifecycle e keys privados | Estender a pedidos/eventos |
| MSW | DONE | mocks/browser e handlers | Estender websocket usando mesma DB |
| Playwright | PARTIAL | 272 anteriores + 75 account recém-criados | Corrigir seletores account e cobrir gaps |
| Visual regression | PARTIAL | capturas sem baselines | Baselines versionadas principais telas |
| Accessibility | PARTIAL | Design System e teclado existentes | Auditoria geral e fluxo sem mouse |
| Lighthouse | MISSING | sem script/resultados | 12 execuções reais; medianas |
| Documentation | PARTIAL | README/ARCH até Fase 7 | Consolidar documentação real |
| Deploy readiness | MISSING | sem fallback/URL validada | Build demo, fallback SPA e publicação verificável |

Esta é a auditoria inicial, não a matriz de aceite final. Os resultados finais devem ser registrados separadamente com evidências reais.
