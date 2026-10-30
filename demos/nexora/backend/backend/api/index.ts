import { NexoraApiError, PERSONAS, notFound, type SavedView } from '../domain';
import { createSeed, type SeedOptions, type SeedResult } from '../data/seed';
import { ApiRuntime, type LatencyProfile, type RuntimeOptions } from './runtime';
import { Store } from './store';
import type { ListQuery } from './query';
import * as customers from './resources/customers';
import * as catalog from './resources/catalog';
import * as sales from './resources/sales';
import * as operations from './resources/operations';
import * as procurement from './resources/procurement';
import * as finance from './resources/finance';
import * as support from './resources/support';
import * as platform from './resources/platform';
import * as analytics from './resources/analytics';
import type { ReportQuery } from './resources/reports';

/** The reports load when first read: a client that never opens one never downloads them. */
const reports = () => import('./resources/reports');
import { createCommands, type Commands } from './commands';
import { applyScenario, SCENARIOS, scenarioScale, type ScenarioId } from './scenarios';

export interface BackendOptions extends SeedOptions, RuntimeOptions {
  /** Persona key (section 55.6) signed in initially; defaults to Sofia Ramirez. */
  persona?: string;
  scenario?: ScenarioId;
}

function buildSurface(
  api: NexoraApi,
  runtime: ApiRuntime,
  models: sales.SalesReadModels,
  commands: Commands,
) {
  const request = runtime.request.bind(runtime);
  return {
    session: {
      get: () => request('GET /session', 'read', () => platform.sessionInfo(runtime)),
    },
    customers: {
      list: (query: ListQuery = {}) =>
        request('GET /customers', 'read', () => customers.listCustomers(runtime, query)),
      get: (id: string) =>
        request('GET /customers/:id', 'read', () => customers.getCustomer(runtime, id)),
      activity: (id: string, query: Omit<platform.ActivityFeedQuery, 'customerId'> = {}) =>
        request('GET /customers/:id/activity', 'read', () =>
          platform.listActivity(runtime, { ...query, customerId: id }),
        ),
      ...commands.customers,
    },
    catalog: {
      products: (query: ListQuery = {}) =>
        request('GET /products', 'read', () => catalog.listProducts(runtime, query)),
      product: (id: string) =>
        request('GET /products/:id', 'read', () => catalog.getProduct(runtime, id)),
      skus: (query: ListQuery = {}) =>
        request('GET /skus', 'read', () => catalog.listSkus(runtime, query)),
      sku: (id: string) => request('GET /skus/:id', 'read', () => catalog.getSku(runtime, id)),
      priceLists: () => request('GET /price-lists', 'read', () => catalog.listPriceLists(runtime)),
      categories: () => request('GET /categories', 'read', () => catalog.listCategories(runtime)),
    },
    quotes: {
      list: (query: ListQuery = {}) =>
        request('GET /quotes', 'read', () => sales.listQuotes(runtime, query)),
      get: (id: string) => request('GET /quotes/:id', 'read', () => sales.getQuote(runtime, id)),
      ...commands.quotes,
    },
    orders: {
      list: (query: ListQuery = {}) =>
        request('GET /orders', 'read', () => sales.listOrders(runtime, models, query)),
      get: (id: string) =>
        request('GET /orders/:id', 'read', () => sales.getOrder(runtime, models, id)),
      ...commands.orders,
    },
    shipments: {
      list: (query: ListQuery = {}) =>
        request('GET /shipments', 'read', () => operations.listShipments(runtime, query)),
      get: (id: string) =>
        request('GET /shipments/:id', 'read', () => operations.getShipment(runtime, id)),
      ...commands.shipments,
    },
    returns: {
      list: (query: ListQuery = {}) =>
        request('GET /returns', 'read', () => operations.listReturns(runtime, query)),
      get: (id: string) =>
        request('GET /returns/:id', 'read', () => operations.getReturn(runtime, id)),
      ...commands.returns,
    },
    inventory: {
      list: (query: ListQuery = {}) =>
        request('GET /inventory', 'read', () => operations.listInventory(runtime, query)),
      sku: (skuId: string) =>
        request('GET /inventory/:skuId', 'read', () =>
          operations.getInventoryForSku(runtime, skuId),
        ),
      movements: (query: ListQuery = {}) =>
        request('GET /stock-movements', 'read', () =>
          operations.listStockMovements(runtime, query),
        ),
      warehouses: () =>
        request('GET /warehouses', 'read', () => operations.listWarehouses(runtime)),
      locations: (warehouseId: string) =>
        request('GET /warehouses/:id/locations', 'read', () =>
          operations.listLocations(runtime, warehouseId),
        ),
      adjust: commands.inventory.adjust,
      transfers: {
        list: (query: ListQuery = {}) =>
          request('GET /transfers', 'read', () => operations.listTransfers(runtime, query)),
        get: (id: string) =>
          request('GET /transfers/:id', 'read', () => operations.getTransfer(runtime, id)),
        ...commands.inventory.transfers,
      },
      cycleCounts: {
        list: (query: ListQuery = {}) =>
          request('GET /cycle-counts', 'read', () => operations.listCycleCounts(runtime, query)),
        get: (id: string) =>
          request('GET /cycle-counts/:id', 'read', () => operations.getCycleCount(runtime, id)),
        ...commands.inventory.cycleCounts,
      },
    },
    suppliers: {
      list: (query: ListQuery = {}) =>
        request('GET /suppliers', 'read', () => procurement.listSuppliers(runtime, query)),
      get: (id: string) =>
        request('GET /suppliers/:id', 'read', () => procurement.getSupplier(runtime, id)),
      ...commands.suppliers,
    },
    purchaseOrders: {
      list: (query: ListQuery = {}) =>
        request('GET /purchase-orders', 'read', () =>
          procurement.listPurchaseOrders(runtime, query),
        ),
      get: (id: string) =>
        request('GET /purchase-orders/:id', 'read', () =>
          procurement.getPurchaseOrder(runtime, id),
        ),
      receipt: (id: string) =>
        request('GET /goods-receipts/:id', 'read', () => procurement.getGoodsReceipt(runtime, id)),
      ...commands.purchaseOrders,
    },
    finance: {
      overview: () =>
        request('GET /finance/overview', 'analytics', () => finance.financeOverview(runtime)),
      invoices: {
        list: (query: ListQuery = {}) =>
          request('GET /invoices', 'read', () => finance.listInvoices(runtime, query)),
        get: (id: string) =>
          request('GET /invoices/:id', 'read', () => finance.getInvoice(runtime, id)),
        ...commands.invoices,
      },
      payments: {
        list: (query: ListQuery = {}) =>
          request('GET /payments', 'read', () => finance.listPayments(runtime, query)),
        get: (id: string) =>
          request('GET /payments/:id', 'read', () => finance.getPayment(runtime, id)),
        ...commands.payments,
      },
      creditMemos: {
        list: (query: ListQuery = {}) =>
          request('GET /credit-memos', 'read', () => finance.listCreditMemos(runtime, query)),
        get: (id: string) =>
          request('GET /credit-memos/:id', 'read', () => finance.getCreditMemo(runtime, id)),
        ...commands.creditMemos,
      },
      refunds: {
        list: () => request('GET /refunds', 'read', () => finance.listRefunds(runtime)),
        ...commands.refunds,
      },
      bankTransactions: {
        list: (query: ListQuery = {}) =>
          request('GET /bank-transactions', 'read', () =>
            finance.listBankTransactions(runtime, query),
          ),
        get: (id: string) =>
          request('GET /bank-transactions/:id', 'read', () =>
            finance.getBankTransaction(runtime, id),
          ),
        ...commands.bankTransactions,
      },
    },
    support: {
      tickets: {
        list: (query: ListQuery = {}) =>
          request('GET /support/tickets', 'read', () => support.listTickets(runtime, query)),
        get: (id: string) =>
          request('GET /support/tickets/:id', 'read', () => support.getTicket(runtime, id)),
        ...commands.tickets,
      },
      metrics: () =>
        request('GET /support/metrics', 'analytics', () => support.supportMetrics(runtime)),
      agents: () =>
        request('GET /support/agents', 'read', () => support.listSupportAgents(runtime)),
      macros: () =>
        request('GET /support/macros', 'read', () => [
          ...runtime.store.dataset.supportMacros.values(),
        ]),
    },
    approvals: {
      list: (query: ListQuery = {}) =>
        request('GET /approvals', 'read', () => platform.listApprovals(runtime, query)),
      get: (id: string) =>
        request('GET /approvals/:id', 'read', () => platform.getApproval(runtime, id)),
      ...commands.approvals,
    },
    workflows: {
      list: (query: ListQuery = {}) =>
        request('GET /workflows', 'read', () => platform.listWorkflows(runtime, query)),
      get: (id: string) =>
        request('GET /workflows/:id', 'read', () => platform.getWorkflow(runtime, id)),
      runs: (id: string, query: ListQuery = {}) =>
        request('GET /workflows/:id/runs', 'read', () =>
          platform.listWorkflowRuns(runtime, id, query),
        ),
      catalog: () =>
        request('GET /workflows/catalog', 'read', () => platform.workflowCatalog(runtime)),
      create: commands.workflows.create,
      update: commands.workflows.update,
      activate: commands.workflows.activate,
      pause: commands.workflows.pause,
      archive: commands.workflows.archive,
    },
    search: (q: string) =>
      request('GET /search', 'search', () => platform.globalSearch(runtime, q)),
    activity: (query: platform.ActivityFeedQuery = {}) =>
      request('GET /activity', 'read', () => platform.listActivity(runtime, query)),
    audit: (query: ListQuery = {}) =>
      request('GET /audit', 'read', () => platform.listAudit(runtime, query)),
    notifications: {
      list: (query: ListQuery & { includeArchived?: boolean } = {}) =>
        request('GET /notifications', 'read', () => platform.listNotifications(runtime, query)),
      ...commands.notifications,
    },
    tasks: {
      list: (query: ListQuery & { mine?: boolean } = {}) =>
        request('GET /tasks', 'read', () => platform.listTasks(runtime, query)),
      ...commands.tasks,
    },
    savedViews: {
      list: (resource?: SavedView['resource']) =>
        request('GET /saved-views', 'read', () => platform.listSavedViews(runtime, resource)),
      ...commands.savedViews,
    },
    imports: {
      get: (id: string) =>
        request('GET /imports/:id', 'read', () => platform.getImportJob(runtime, id)),
      customers: commands.imports.customers,
    },
    identity: {
      users: (query: ListQuery = {}) =>
        request('GET /users', 'read', () => platform.listUsers(runtime, query)),
      teams: () => request('GET /teams', 'read', () => platform.listTeams(runtime)),
      roles: () => request('GET /roles', 'read', () => platform.listRoles(runtime)),
      personas: () => PERSONAS,
    },
    analytics: {
      dashboard: () =>
        request('GET /analytics/dashboard', 'analytics', () =>
          analytics.executiveDashboard(runtime),
        ),
      // Section 16's report types: a period, its comparison and the segments each accepts.
      executive: (query: ReportQuery = {}) =>
        request('GET /analytics/executive', 'analytics', async () =>
          (await reports()).executiveReport(runtime, models, query),
        ),
      sales: (query: ReportQuery = {}) =>
        request('GET /analytics/sales', 'analytics', async () =>
          (await reports()).salesReport(runtime, models, query),
        ),
      inventory: (query: ReportQuery = {}) =>
        request('GET /analytics/inventory', 'analytics', async () =>
          (await reports()).inventoryReport(runtime, models, query),
        ),
      procurement: (query: ReportQuery = {}) =>
        request('GET /analytics/procurement', 'analytics', async () =>
          (await reports()).procurementReport(runtime, query),
        ),
      finance: (query: ReportQuery = {}) =>
        request('GET /analytics/finance', 'analytics', async () =>
          (await reports()).financeReport(runtime, query),
        ),
      support: (query: ReportQuery = {}) =>
        request('GET /analytics/support', 'analytics', async () =>
          (await reports()).supportReport(runtime, query),
        ),
    },
    demo: {
      scenarios: () => SCENARIOS,
      fixtures: (): Record<string, string> => Object.fromEntries(runtime.store.dataset.fixtures),
      setPersona: (personaKeyOrUserId: string) =>
        request('POST /demo/persona', 'write', () => {
          const userId =
            runtime.store.seed.personaUserIds.get(personaKeyOrUserId) ?? personaKeyOrUserId;
          const user = runtime.store.dataset.users.get(userId);
          if (!user) throw notFound('Persona', personaKeyOrUserId);
          if (user.status !== 'active')
            throw new NexoraApiError(
              'FORBIDDEN',
              `${user.displayName} is ${user.status} and cannot sign in`,
            );
          runtime.store.metadata.activePersonaId = user.id;
          runtime.clearTransientState();
          return platform.sessionInfo(runtime);
        }),
      reset: (scenario?: ScenarioId) => api.reset(scenario),
      setScenario: (scenario: ScenarioId) => api.setScenario(scenario),
      setLatency: (profile: LatencyProfile) => {
        runtime.latency.profile = profile;
      },
      advanceClock: (hours: number) =>
        request('POST /demo/clock/advance', 'write', () => {
          if (!Number.isFinite(hours) || hours <= 0)
            throw new NexoraApiError('VALIDATION_FAILED', 'hours must be a positive number');
          const next = new Date(Date.parse(runtime.store.metadata.demoClock) + hours * 3_600_000)
            .toISOString()
            .replace(/\.\d{3}Z$/, 'Z');
          runtime.store.metadata.demoClock = next;
          const effects = commands.onClockAdvanced();
          return { ...platform.sessionInfo(runtime), effects };
        }),
    },
  };
}

export type ApiSurface = ReturnType<typeof buildSurface>;

/**
 * Typed, in-process simulated backend (section 73). Every method mirrors an
 * endpoint of the canonical surface and returns a promise so a transport
 * adapter (MSW or fetch) can be substituted without changing the client.
 */
export class NexoraApi {
  runtime!: ApiRuntime;
  commands!: Commands;
  session!: ApiSurface['session'];
  customers!: ApiSurface['customers'];
  catalog!: ApiSurface['catalog'];
  quotes!: ApiSurface['quotes'];
  orders!: ApiSurface['orders'];
  shipments!: ApiSurface['shipments'];
  returns!: ApiSurface['returns'];
  inventory!: ApiSurface['inventory'];
  suppliers!: ApiSurface['suppliers'];
  purchaseOrders!: ApiSurface['purchaseOrders'];
  finance!: ApiSurface['finance'];
  support!: ApiSurface['support'];
  approvals!: ApiSurface['approvals'];
  workflows!: ApiSurface['workflows'];
  search!: ApiSurface['search'];
  activity!: ApiSurface['activity'];
  audit!: ApiSurface['audit'];
  notifications!: ApiSurface['notifications'];
  tasks!: ApiSurface['tasks'];
  savedViews!: ApiSurface['savedViews'];
  imports!: ApiSurface['imports'];
  identity!: ApiSurface['identity'];
  analytics!: ApiSurface['analytics'];
  demo!: ApiSurface['demo'];
  private seedResult: SeedResult;
  private readonly options: BackendOptions;

  constructor(seed: SeedResult, options: BackendOptions = {}) {
    this.options = options;
    this.seedResult = seed;
    this.mount(seed, options.scenario ?? 'healthy', options.persona);
  }

  get store(): Store {
    return this.runtime.store;
  }

  get seed(): SeedResult {
    return this.seedResult;
  }

  private mount(seed: SeedResult, scenario: ScenarioId, persona: string | undefined): void {
    const personaKey =
      persona ??
      SCENARIOS.find((entry) => entry.id === scenario)?.persona ??
      this.options.persona ??
      'sofia-ramirez';
    const activePersonaId =
      seed.personaUserIds.get(personaKey) ?? seed.personaUserIds.get('sofia-ramirez');
    if (!activePersonaId) throw new Error(`Unknown persona ${personaKey}`);
    const store = new Store(seed, { activePersonaId, scenarioId: scenario });
    this.seedResult = seed;
    this.runtime = new ApiRuntime(store, this.options);
    const models = new sales.SalesReadModels(this.runtime);
    this.commands = createCommands(this.runtime, models);
    const events = scenario !== 'healthy' ? applyScenario(this.runtime, scenario) : [];
    if (scenario !== 'healthy') store.metadata.scenarioAppliedOn = store.today;
    // Section 69.5: scheduled workflows are evaluated on initialization.
    this.commands.onInitialized(events);
    Object.assign(this, buildSurface(this, this.runtime, models, this.commands));
  }

  /** Section 74.5 — rebuilds the canonical seed and re-applies the scenario. */
  async reset(scenario?: ScenarioId): Promise<platform.SessionInfo> {
    const target = scenario ?? (this.store.metadata.scenarioId as ScenarioId);
    const scale = scenarioScale(target) ?? this.options.scale;
    const seed = createSeed({ ...this.options, ...(scale ? { scale } : {}) });
    this.mount(
      seed,
      target === 'system_degraded' ? 'healthy' : target,
      scenario ? undefined : this.options.persona,
    );
    if (target === 'system_degraded') this.runtime.latency.profile = 'degraded';
    return platform.sessionInfo(this.runtime);
  }

  /** Section 74.6 — structural scenarios reset first; `system_degraded` only changes transport. */
  async setScenario(scenario: ScenarioId): Promise<platform.SessionInfo> {
    if (scenario === 'system_degraded') {
      this.runtime.latency.profile = 'degraded';
      this.store.metadata.scenarioId = scenario;
      return platform.sessionInfo(this.runtime);
    }
    return this.reset(scenario);
  }
}

/** Builds the seed and wraps it in the API. */
export function createNexoraBackend(options: BackendOptions = {}): NexoraApi {
  const scale = scenarioScale(options.scenario) ?? options.scale;
  const seed = createSeed({ ...options, ...(scale ? { scale } : {}) });
  return new NexoraApi(seed, options);
}

export type { ListQuery, ListResponse, EntityResponse, FilterValue, FilterClause } from './query';
export { parseListQuery } from './query';
export type { LatencyProfile, MutationOptions } from './runtime';
export type { ScenarioId, ScenarioDefinition } from './scenarios';
export { SCENARIOS } from './scenarios';
export * from './resources/customers';
export * from './resources/catalog';
export * from './resources/sales';
export * from './resources/operations';
export * from './resources/procurement';
export * from './resources/finance';
export * from './resources/support';
export * from './resources/platform';
export * from './resources/analytics';
export type * from './resources/reports';
export type { InventoryPosition } from './projections';
export type { Commands } from './commands';
export type { CreateCustomerInput, UpdateCustomerInput } from './commands/crm';
export type { QuoteInput, OrderInput } from './commands/sales';
export type { LineInput } from './commands/pricing';
export type { CreateShipmentInput } from './commands/fulfillment';
export type { PurchaseOrderInput, PurchaseOrderLineInput } from './commands/procurement';
export type { WorkflowInput } from './commands/platform';
