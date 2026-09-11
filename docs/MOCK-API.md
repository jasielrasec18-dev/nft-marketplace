# API simulada — fase 2

Prefixo padrão /api. Payloads JSON; ETH sempre string decimal. Requests da aplicação passam pelo cliente Axios. Os handlers são compartilhados entre setupWorker (browser) e setupServer (testes Node).

## Endpoints

| Método | Caminho | Entrada / resposta |
| --- | --- | --- |
| POST | /auth/register | RegisterInput → Session (201); cria sessão |
| POST | /auth/login | LoginInput → Session; Set-Cookie |
| POST | /auth/logout | 204; revoga sessão e limpa cookie |
| GET | /auth/session | Session ou null; 401 se inválida/expirada |
| GET | /nfts | q, collection, priceMin, priceMax, sort, page → NFTListResponse (items, page, pageSize, total, collections) |
| GET | /nfts/:id | NFT ou 404 |
| GET | /favorites | Favorites do usuário |
| POST | /favorites/:nftId | inclusão idempotente → Favorites |
| DELETE | /favorites/:nftId | 204 |
| GET | /cart | Cart; cria cookie visitante se necessário |
| POST | /cart/items | { nftId, editionId, quantity } → Cart (201) |
| PATCH | /cart/items/:itemId | { quantity } → Cart |
| DELETE | /cart/items/:itemId | 204 |
| POST | /quote | QuoteInput → Quote (201) |
| POST | /orders | CreateOrderInput + Idempotency-Key → Order (201/200) |
| GET | /orders/:id | Order do usuário |
| GET | /profile | Profile |
| PATCH | /profile | campos parciais name, email, bio → Profile |
| PATCH | /profile/password | currentPassword, newPassword, confirmPassword → 204 |
| PATCH | /profile/avatar | { imageDataUrl } → Profile |
| GET | /wallets | Wallet[] do usuário |
| POST | /wallets | WalletInput → Wallet (201) |
| PATCH | /wallets/:id | campos parciais de WalletInput → Wallet |

Favoritos, quote, pedidos, perfil e carteiras exigem sessão. Carrinho aceita visitante ou usuário; não aceita escolher proprietário pelo payload. Paginação tem tamanho fixo 8. Sort: recent, price-asc, price-desc ou name; desempate estável por ID. Faixas invertidas de preço retornam 422.

Carteiras: label, address (0x + 40 caracteres hex), network (ethereum/polygon), role (primary/secondary). Só uma de cada função por usuário; endereço/rede duplicados geram conflito.

## Compra e timeout reproduzíveis

No console do Vite, após iniciar com mocks:

```js
const { createApiClient } = await import('/src/api/client.ts')
const api = createApiClient({ baseURL: '/api', timeoutMs: 10000 })
await api.post('/__mock/reset', {
  scenario: 'order-timeout',
  now: '2026-09-10T12:00:00.000Z',
  latencyMs: 0,
})
await api.post('/auth/login', {
  email: 'collector@example.com',
  password: 'Jungle123!',
})
const { data: cart } = await api.get('/cart')
const { data: quote } = await api.post('/quote', {
  cartId: cart.id,
  cartVersion: cart.version,
  couponCode: 'VALID10',
  network: 'ethereum',
})
const input = {
  quoteId: quote.id,
  quoteVersion: quote.version,
  walletId: 'wallet-user-1',
  collector: { name: 'Alex Collector', email: 'collector@example.com' },
}
const config = { headers: { 'Idempotency-Key': 'demo-attempt-1' } }
try {
  await api.post('/orders', input, config) // timeout após criação
} catch (error) {
  console.log(error.code) // TIMEOUT
}
const { data: order } = await api.post('/orders', input, config) // mesmo pedido
await api.post('/__mock/clock/advance', { milliseconds: 2500 })
const { data: receipt } = await api.get('/orders/' + order.id)
console.log(receipt.status, receipt.snapshot.totalEth) // confirmed, 1.076
```

Não gere outra chave ao repetir a mesma tentativa. Alterar payload com a chave demo-attempt-1 retorna 409 IDEMPOTENCY_CONFLICT.

A resposta inicial atrasada não segura a fila da base. No browser, o atraso após commit é VITE_API_TIMEOUT_MS + 5000 ms. Testes Node podem injetar um atraso menor, mantendo a mesma ordem commit → timeout → retry.

## Controle da simulação

Esses endpoints não recebem injeção de falhas/latência, permitindo sair de cenários quebrados. São registrados somente quando MSW está ativo. Não expõem hashes de senha ou tokens por um endpoint de dump.

| Método | Caminho | Corpo / efeito |
| --- | --- | --- |
| POST | /__mock/reset | { scenario?, now?, latencyMs? }; restaura tudo e limpa cookies |
| PATCH | /__mock/scenario | { scenario, latencyMs? }; preserva dados, reinicia contadores/efeitos |
| GET | /__mock/state | cenário, relógio, latência e contagens, sem dados privados |
| POST | /__mock/clock/advance | { milliseconds }; avança relógio e reconcilia pagamentos |
| PATCH | /__mock/nfts/:id | { priceEth? , editionId?, availableQuantity? } |
| POST | /__mock/orders/:id/settle | { status: confirmed ou declined } |

now é uma data ISO UTC fixa. Sem now, usa relógio real centralizado. latencyMs=0 elimina latência de rede comum para testes; latencyMs=null em /scenario restaura os atrasos configurados. O delay especial de timeout permanece ativo.

Atualização de estoque exige editionId, exceto availableQuantity=0 sem edição, que esgota todas as edições. Cada atualização incrementa a versão do NFT e persiste dentro da transação.

Exemplo para teste futuro de preço: crie a quote, faça PATCH /__mock/nfts/nft-001 com { priceEth: "1.29" }, tente criar pedido com a quote antiga e observe QUOTE_CHANGED. Uma nova quote traz os valores atualizados.

## Cenários

| Cenário | Comportamento |
| --- | --- |
| default | 120 ms, fixtures completas, pagamento confirma após 2500 ms |
| empty | listagem vazia |
| slow-network | 1200 ms por operação |
| variable-latency | 1200/200 ms alternados por tipo de operação; buscas simultâneas podem chegar fora de ordem |
| network-error | falha de transporte com HttpResponse.error |
| server-error | HTTP 500 |
| service-unavailable | HTTP 503 |
| request-timeout | resposta atrasada além do timeout padrão |
| session-expired | sessão dura 1000 ms; ao selecionar, sessões existentes também expiram em 1000 ms |
| unauthorized | endpoints que dependem de sessão retornam 401 |
| register-conflict | cadastro retorna EMAIL_ALREADY_EXISTS |
| invalid-coupon | quote com cupom retorna INVALID_COUPON |
| expired-coupon | quote com cupom retorna EXPIRED_COUPON |
| price-changed | primeiro item do carrinho passa a 1.29 ETH antes do pedido ou segunda quote |
| sold-out | primeiro item esgota antes do pedido ou segunda quote |
| order-timeout | pedido é persistido e só a primeira resposta da tentativa sofre atraso |
| payment-confirmed | pending → confirmed após 2500 ms |
| payment-declined | pending → declined após 2500 ms; carrinho preservado e reserva liberada |

Cenários de preço/estoque têm efeito uma vez por seleção; a alteração continua na base mesmo se a compra for recusada. Trocar cenário não desfaz alterações anteriores — use reset para voltar às fixtures.

Pagamentos são reconciliados na próxima chamada REST, no avanço do relógio ou no settlement explícito. Confirmed/declined são terminais. Não há eventos Socket.IO nesta fase.

## Erros

Formato:

```json
{
  "code": "OUT_OF_STOCK",
  "message": "Estoque insuficiente para esta edição."
}
```

Validação Zod inclui fieldErrors com arrays de mensagens por campo. A UI deve usar code/status, não comparar mensagens humanas.

Códigos principais: VALIDATION_ERROR (422), INVALID_JSON (400), INVALID_CREDENTIALS (401 no login), EMAIL_ALREADY_EXISTS (409), UNAUTHORIZED/SESSION_EXPIRED (401), NFT_NOT_FOUND/CART_ITEM_NOT_FOUND/QUOTE_NOT_FOUND/ORDER_NOT_FOUND/WALLET_NOT_FOUND (404), INVALID_EDITION (422), OUT_OF_STOCK/CART_CHANGED/QUOTE_CHANGED/QUOTE_EXPIRED/QUOTE_ALREADY_USED/IDEMPOTENCY_CONFLICT/ORDER_TERMINAL (409), INVALID_COUPON/EXPIRED_COUPON/NETWORK_MISMATCH (422), IDEMPOTENCY_KEY_REQUIRED (400), WALLET_ROLE_CONFLICT/WALLET_ALREADY_EXISTS (409).

TIMEOUT e NETWORK_ERROR são normalizados pelo Axios quando não há resposta HTTP. MOCK_RESET (409) indica que uma request atrasada pertence à geração anterior do banco. Erros inesperados ou falha de persistência retornam INTERNAL_ERROR (500), sem expor detalhes internos.
