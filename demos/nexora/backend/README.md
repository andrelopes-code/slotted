# Nexora Operations — simulated backend

Demo-only package (`@slotted/demo-nexora-backend`). It is the data source for the Nexora Operations reference application and is not published. The domain document is `demos/nexora/domain.md` (Part II is normative); section numbers below refer to it.

```
backend/
  domain/   entity contracts (§89, §56–§71), ids and business numbers (§53), money, quantities, time, permissions (§55), pricing and approval policies (§57–§59, §65), error model (§73.10, §81)
  data/     deterministic seed: vocabularies, catalog tree, tenant, master data, transaction engine, curated narrative (§76), edge fixtures (§82)
  api/      in-process simulated API (§73): store, projections (§56.3, §60, §66.6, §72), list queries, read models, commands (§79), approval engine (§67), scenarios (§77), latency profiles (§78)
  index.ts  public entry
```

## Usage

```ts
import { createNexoraBackend } from '@slotted/demo-nexora-backend';

const api = createNexoraBackend({ scale: 'demo', latency: 'normal' });

const session = await api.session.get(); // signed-in persona, permissions, demo clock
const page = await api.orders.list({
  // §73.3–§73.7
  filter: { status: 'confirmed,on_hold', orderDate: { gte: '2026-08-01' } },
  sort: '-orderDate',
  page: 1,
  pageSize: 50,
  q: 'meridian',
});
const detail = await api.orders.get(page.data[0].id);
const held = await api.orders.hold(
  detail.order.id,
  { reason: 'Credit review' },
  { ifMatch: detail.order.metadata.version },
);
```

Every method returns a promise. Reads take a `ListQuery` and return `ListResponse<T>` (`data`, `page.totalItems`, …). Mutations take an input object and `MutationOptions` (`ifMatch` = last observed `metadata.version`, `idempotencyKey`). Errors are `NexoraApiError` instances with `status`, `code`, `retryable`, `correlationId` and optional `fieldErrors` (§73.10). Missing `ifMatch` on an aggregate mutation fails with `428 PRECONDITION_REQUIRED`; a stale one with `409 STALE_VERSION`.

`parseListQuery(new URLSearchParams(location.search))` converts the HTTP query form (`filter[status]=…`, `filter[orderDate][gte]=…`, `sort=-total`) into a `ListQuery`, so list state can live in the URL.

## Surface

| Namespace                                         | Reads                                                                                                                     | Commands                                                                                                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `session`                                         | `get`                                                                                                                     | —                                                                                                                                                                                                                              |
| `demo`                                            | `scenarios`, `fixtures`                                                                                                   | `setPersona`, `reset`, `setScenario`, `setLatency`, `advanceClock`                                                                                                                                                             |
| `customers`                                       | `list`, `get`, `activity`                                                                                                 | `create`, `update`, `archive`, `hold`, `releaseHold`, `contacts.*`, `addresses.create`, `notes.add/delete`                                                                                                                     |
| `catalog`                                         | `products`, `product`, `skus`, `sku`, `priceLists`, `categories`                                                          | —                                                                                                                                                                                                                              |
| `quotes`                                          | `list`, `get`                                                                                                             | `create`, `update`, `submit`, `send`, `markViewed`, `accept`, `reject`, `cancel`, `convert`                                                                                                                                    |
| `orders`                                          | `list`, `get`                                                                                                             | `create`, `update`, `submit`, `hold`, `releaseHold`, `cancel`, `cancelRemaining`, `allocate`, `deallocate`                                                                                                                     |
| `shipments`                                       | `list`, `get`                                                                                                             | `create`, `startPicking`, `pack`, `ready`, `ship`, `markInTransit`, `deliver`, `exception`, `cancel`                                                                                                                           |
| `returns`                                         | `list`, `get`                                                                                                             | `create`, `authorize`, `receive`, `inspect`, `complete`, `reject`                                                                                                                                                              |
| `inventory`                                       | `list`, `sku`, `movements`, `warehouses`, `locations`, `transfers.list/get`, `cycleCounts.list/get`                       | `adjust`, `transfers.*`, `cycleCounts.*`                                                                                                                                                                                       |
| `suppliers`                                       | `list`, `get`                                                                                                             | `create`, `update`                                                                                                                                                                                                             |
| `purchaseOrders`                                  | `list`, `get`, `receipt`                                                                                                  | `create`, `update`, `submit`, `send`, `acknowledge`, `cancel`, `closeShort`, `receive`                                                                                                                                         |
| `finance`                                         | `overview`, `invoices.list/get`, `payments.list/get`, `creditMemos.list/get`, `refunds.list`, `bankTransactions.list/get` | `invoices.createFromOrder/updateDraft/open/send/dispute/resolveDispute/void/writeOff`, `payments.record/allocate/reverse`, `creditMemos.create/open/apply/void`, `refunds.create`, `bankTransactions.match/ignore/suggestions` |
| `support`                                         | `tickets.list/get`, `metrics`, `macros`                                                                                   | `tickets.create/update/assign/reply/internalNote/customerMessage/pendingCustomer/pendingInternal/escalate/resolve/reopen/close`                                                                                                |
| `approvals`                                       | `list`, `get`                                                                                                             | `approve`, `reject`, `requestChanges`                                                                                                                                                                                          |
| `workflows`                                       | `list`, `get`, `runs`                                                                                                     | `create`, `update`, `activate`, `pause`, `archive`                                                                                                                                                                             |
| `search`, `activity`, `audit`                     | global search (§71.2), activity feed (§70.1), audit log (§70.2)                                                           | —                                                                                                                                                                                                                              |
| `notifications`, `tasks`, `savedViews`, `imports` | `list` / `get`                                                                                                            | `markRead`, `markAllRead`, `archive`; `create`, `complete`, `cancel`; `create`, `update`, `delete`; `customers`                                                                                                                |
| `identity`                                        | `users`, `teams`, `roles`, `personas`                                                                                     | —                                                                                                                                                                                                                              |
| `analytics`                                       | `dashboard` (§34.1, §72)                                                                                                  | —                                                                                                                                                                                                                              |

List rows are read models: the entity plus joined display fields (`customerName`, `ownerName`, `lineCount`, projections such as `summary` on customers). Detail calls return the aggregate with its children and related records (`OrderDetail`, `InvoiceDetail`, `TicketDetail`, …). Field names accepted by `filter` and `sort` are the keys of each resource definition (`orderResource`, `customerResource`, … exported from the package).

## Personas and permissions

`demo.setPersona('priya-shah')` switches the signed-in user (§55.6). Authorization is enforced by the backend (§55.3): a persona without `invoices.view` receives `403 FORBIDDEN` from `finance.invoices.list`; warehouse-scoped roles only see their warehouses. `session.get().permissions` lists the effective permission keys for UI gating.

## Scale profiles

| Profile     | Master data                          | Materialized window | Seed time (Node) | Heap    |
| ----------- | ------------------------------------ | ------------------- | ---------------- | ------- |
| `light`     | 1,200 customers, 4,500 SKUs          | 30 days             | ≈3 s             | ≈160 MB |
| `demo`      | 4,800 customers, 18,000 SKUs (§75.2) | 45 days             | ≈11 s            | ≈420 MB |
| `canonical` | §75.2                                | 120 days (§75.4)    | ≈19 s            | ≈700 MB |
| `smoke`     | test-sized                           | 120 days            | ≈1 s             | —       |

The logical history is 24 months for every profile (§75.3). Orders older than the materialized window exist as a historical tier: list totals, per-customer aggregates and monthly series include them, and `orders.get` expands one on demand (read-only, `historical: true`). Run the backend in a Web Worker for `demo` and `canonical`; `createSeed({ onProgress })` reports stage progress for a loading screen.

## Determinism and narrative

The same seed (`nexora-v1`) always produces the same dataset, ids and business numbers (§24, §53.3). The Meridian Controls Group story (§76) resolves to the same records everywhere: `demo.fixtures()` maps keys such as `flagship.order.meridian`, `flagship.invoice.meridian`, `flagship.ticket.meridian`, `edge.order.large`, `edge.invoice.partially_paid`, `edge.conflict.stale_version` (§82) to ids.

Curated business numbers (`SO-2026-01842`, `INV-2026-02891`, `SHP-009841`, `TCK-10492`) are mandated by §76 and reserved; generated sequences skip them.

## Regions and currencies

The tenant operates two regions (`session.get().organization.regions`): `US` (USD, `en-US`, `America/Chicago`) and `BR` (BRL, `pt-BR`, `America/Sao_Paulo`). Every profile except `new_tenant` seeds the Brazil region: warehouse `SAO-01`, teams `SALES-BR` and `WH-SAO`, price lists `Brazil Standard` and `Brazil Distributor` in BRL, about 20% of generated customers and 10% of suppliers with Brazilian names, addresses (`CEP` postal codes, state codes), `+55` phones, `.com.br` domains, `pix`/`boleto` payments and Brazilian carriers.

Customers, suppliers, warehouses and price lists carry `regionCode`. Commercial documents of a customer are issued in `customer.preferredCurrency`; purchase orders in the supplier's first `supportedCurrencies` entry. Every `Money` value states its currency and every quote, order, invoice, payment and purchase order carries `fxRateToUsd` (§53.7; the seed table is `FX_RATES_TO_USD`). Per-customer projections (`summary`) are in the customer currency; consolidated projections (`finance.overview`, `analytics.dashboard`, supplier `annualSpendUsd`, approval thresholds) convert to USD at the document rate. Lists filter by `regionCode`, `preferredCurrency` (customers) and `currency` (quotes, orders, invoices, payments, purchase orders).

The data layer carries no formatting or translation: authored text stays in English, and rendering amounts, dates and locale-specific labels is the client's concern.

## Scenarios and clock

`demo.setScenario(id)` applies §77 overlays (`month_end`, `inventory_crisis`, `collections_pressure`, `support_incident`, `heavy_data`, `new_tenant`, `enterprise_scale`, `restricted_user`, `system_degraded`). Structural scenarios reset the seed first (§74.6). `demo.advanceClock(hours)` moves `demoClock` (§25) and re-evaluates overdue invoices, quote expiry and ticket auto-close. `demo.setLatency('normal' | 'degraded' | 'none')` selects the §78 transport profile.

## Verification

```
pnpm --filter @slotted/demo-nexora-backend test
pnpm --filter @slotted/demo-nexora-backend typecheck
```
