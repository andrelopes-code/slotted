import { SCHEMA_VERSION, businessDateOf, idSequence, formatId, type IdEntity } from '../domain';
import type { CollectionName, Dataset } from '../data/dataset';
import type { SeedResult } from '../data/seed';
import {
  buildOrderGraph,
  orderId,
  orderIndexFromId,
  type OrderGraph,
  type OrderSkeleton,
  type OrderSummary,
} from '../data/seed/orders';
import { numberHistoricalGraph } from '../data/seed/sales';

type Entity = { id: string };

/**
 * Lazily rebuilt secondary index. Reads rebuild it when a write on the
 * indexed collection invalidated it; writes are rare compared with reads.
 */
class LazyIndex<T extends Entity> {
  private index: Map<string, T[]> | undefined;

  constructor(
    private readonly source: () => Iterable<T>,
    private readonly key: (value: T) => string | undefined,
  ) {}

  get(parent: string): T[] {
    if (!this.index) this.rebuild();
    return this.index?.get(parent) ?? [];
  }

  invalidate(): void {
    this.index = undefined;
  }

  /** Adds a new entity to its bucket without rebuilding. */
  add(value: T): void {
    if (!this.index) return;
    const parent = this.key(value);
    if (parent === undefined) return;
    const bucket = this.index.get(parent);
    if (bucket) {
      if (!bucket.includes(value)) bucket.push(value);
    } else this.index.set(parent, [value]);
  }

  remove(value: T): void {
    if (!this.index) return;
    const parent = this.key(value);
    if (parent === undefined) return;
    const bucket = this.index.get(parent);
    if (!bucket) return;
    const position = bucket.indexOf(value);
    if (position >= 0) bucket.splice(position, 1);
  }

  private rebuild(): void {
    const index = new Map<string, T[]>();
    for (const value of this.source()) {
      const parent = this.key(value);
      if (parent === undefined) continue;
      const bucket = index.get(parent);
      if (bucket) bucket.push(value);
      else index.set(parent, [value]);
    }
    this.index = index;
  }
}

export type StoreListener = (
  collection: CollectionName,
  entity: Entity | undefined,
  kind: 'put' | 'delete' | 'invalidate',
) => void;

/** Entity type stored in a dataset collection. */
export type EntityOf<K extends CollectionName> =
  Dataset[K] extends Map<string, infer V> ? (V extends Entity ? V : never) : never;

export interface DemoDatabaseMetadata {
  schemaVersion: number;
  seedVersion: string;
  scenarioId: string;
  /** Business date a structural scenario was applied on: a fact a report marks on its charts. */
  scenarioAppliedOn?: string;
  demoClock: string;
  activePersonaId: string;
  initializedAt: string;
  /** Section 69.5: the instant scheduled workflows were last evaluated up to. */
  schedulesEvaluatedAt: string;
}

export interface HistoricalTier {
  skeletons: OrderSkeleton[];
  readonly summaries: OrderSummary[];
  /** Order index → summary for the historical (non-materialized) tier. */
  readonly summaryByIndex: Map<number, OrderSummary>;
  materializedIndexes: Set<number>;
  firstOperationalIndex: number;
}

/**
 * In-memory store over the seeded dataset: lazy indexes, id/number sequence
 * continuation, on-demand expansion of historical orders and the audit log.
 */
export class Store {
  readonly dataset: Dataset;
  readonly seed: SeedResult;
  readonly history: HistoricalTier;
  readonly metadata: DemoDatabaseMetadata;
  private readonly indexes = new Map<string, LazyIndex<Entity>>();
  private readonly indexesByCollection = new Map<CollectionName, LazyIndex<Entity>[]>();
  private readonly expandedHistory = new Map<number, OrderGraph>();
  private readonly idSequences = new Map<IdEntity, number>();
  private readonly listeners = new Set<StoreListener>();

  constructor(
    seed: SeedResult,
    options: { scenarioId?: string; activePersonaId: string; demoClock?: string },
  ) {
    this.seed = seed;
    this.dataset = seed.dataset;
    const sales = seed.sales;
    let summaryByIndex: Map<number, OrderSummary> | undefined;
    this.history = {
      skeletons: sales.skeletons,
      get summaries() {
        return sales.historySummaries;
      },
      get summaryByIndex() {
        return (summaryByIndex ??= new Map(
          sales.historySummaries.map((summary) => [summary.index, summary]),
        ));
      },
      materializedIndexes: seed.sales.materializedIndexes,
      firstOperationalIndex: seed.sales.firstOperationalIndex,
    };
    this.metadata = {
      schemaVersion: SCHEMA_VERSION,
      seedVersion: seed.seedVersion,
      scenarioId: options.scenarioId ?? 'healthy',
      demoClock: options.demoClock ?? seed.context.now,
      activePersonaId: options.activePersonaId,
      initializedAt: seed.context.now,
      schedulesEvaluatedAt: seed.context.now,
    };
    this.seedIdSequences();
  }

  /** Current demo instant (section 25). */
  get now(): string {
    return this.metadata.demoClock;
  }

  /** Current business date in the organization timezone. */
  get today(): string {
    return businessDateOf(this.metadata.demoClock);
  }

  // ---------------------------------------------------------------------------
  // Collections

  collection<K extends CollectionName>(name: K): Dataset[K] {
    return this.dataset[name];
  }

  get<K extends CollectionName>(name: K, id: string): EntityOf<K> | undefined {
    return (this.dataset[name] as Map<string, unknown>).get(id) as EntityOf<K> | undefined;
  }

  /**
   * Inserts or replaces an entity. Built indexes receive the entity
   * incrementally; listeners (projection caches) are told which entity changed.
   */
  put<K extends CollectionName>(name: K, entity: EntityOf<K>): void {
    const map = this.dataset[name] as Map<string, Entity>;
    const id = (entity as Entity).id;
    const previous = map.get(id);
    if (previous && previous !== entity)
      for (const index of this.indexesByCollection.get(name) ?? []) index.remove(previous);
    map.set(id, entity as Entity);
    for (const index of this.indexesByCollection.get(name) ?? []) index.add(entity as Entity);
    for (const listener of this.listeners) listener(name, entity as Entity, 'put');
  }

  delete(name: CollectionName, id: string): void {
    const map = this.dataset[name] as Map<string, Entity>;
    const existing = map.get(id);
    if (!existing) return;
    map.delete(id);
    for (const index of this.indexesByCollection.get(name) ?? []) index.remove(existing);
    for (const listener of this.listeners) listener(name, existing, 'delete');
  }

  /**
   * Signals an in-place mutation. Index membership is keyed by immutable
   * parent ids, so indexes stay valid; caches derived from field values are
   * notified. Pass the entity so key-based caches can refresh one entry.
   */
  invalidate(name: CollectionName, entity?: Entity): void {
    for (const listener of this.listeners) listener(name, entity, 'invalidate');
  }

  /** Forces a rebuild of every index on a collection (bulk scenario edits). */
  reindex(name: CollectionName): void {
    for (const index of this.indexesByCollection.get(name) ?? []) index.invalidate();
    for (const listener of this.listeners) listener(name, undefined, 'invalidate');
  }

  /** Kept for callers that group writes; invalidation is immediate. */
  batch<T>(work: () => T): T {
    return work();
  }

  /** Subscribes to entity-level change notifications. */
  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Registers (once) and returns a child index keyed by a parent id. */
  index<K extends CollectionName>(
    name: string,
    collection: K,
    key: (value: EntityOf<K>) => string | undefined,
  ): LazyIndex<EntityOf<K>> {
    let index = this.indexes.get(name);
    if (!index) {
      const map = this.dataset[collection] as Map<string, Entity>;
      index = new LazyIndex<Entity>(
        () => map.values(),
        key as (value: Entity) => string | undefined,
      );
      this.indexes.set(name, index);
      const bucket = this.indexesByCollection.get(collection) ?? [];
      bucket.push(index);
      this.indexesByCollection.set(collection, bucket);
    }
    return index as unknown as LazyIndex<EntityOf<K>>;
  }

  // ---------------------------------------------------------------------------
  // Sequences (section 53.3: runtime records continue after the seed maximum)

  private seedIdSequences(): void {
    const scan = (entity: IdEntity, collection: CollectionName): void => {
      let max = 0;
      for (const id of (this.dataset[collection] as Map<string, unknown>).keys()) {
        const sequence = idSequence(id);
        if (Number.isFinite(sequence) && sequence > max) max = sequence;
      }
      this.idSequences.set(entity, max);
    };
    scan('customer', 'customers');
    scan('contact', 'contacts');
    scan('address', 'addresses');
    scan('customerNote', 'customerNotes');
    scan('quote', 'quotes');
    scan('salesOrder', 'salesOrders');
    scan('shipment', 'shipments');
    scan('return', 'returns');
    scan('purchaseOrder', 'purchaseOrders');
    scan('goodsReceipt', 'goodsReceipts');
    scan('invoice', 'invoices');
    scan('payment', 'payments');
    scan('creditMemo', 'creditMemos');
    scan('refund', 'refunds');
    scan('transfer', 'transfers');
    scan('cycleCount', 'cycleCounts');
    scan('ticket', 'tickets');
    scan('workflow', 'workflows');
    scan('workflowRun', 'workflowRuns');
    scan('notification', 'notifications');
    scan('task', 'tasks');
    scan('savedView', 'savedViews');
    scan('importJob', 'importJobs');
    scan('supplier', 'suppliers');
    scan('approvalRequest', 'approvalRequests');
    scan('bankTransaction', 'bankTransactions');
    scan('contractPrice', 'contractPrices');
    // Child collections use a dedicated high range so they never collide with
    // the block-allocated ids of seeded graphs.
    for (const entity of [
      'salesOrderLine',
      'quoteLine',
      'shipmentLine',
      'invoiceLine',
      'paymentAllocation',
      'inventoryReservation',
      'stockMovement',
      'returnLine',
      'creditMemoLine',
      'creditMemoApplication',
      'purchaseOrderLine',
      'goodsReceiptLine',
      'transferLine',
      'cycleCountLine',
      'conversationMessage',
      'slaEvent',
      'approvalStep',
      'auditEvent',
      'activityEvent',
    ] as IdEntity[]) {
      this.idSequences.set(entity, 500_000_000);
    }
    // Sales orders also continue after the last skeleton index.
    this.idSequences.set(
      'salesOrder',
      Math.max(this.idSequences.get('salesOrder') ?? 0, this.history.skeletons.length),
    );
  }

  nextId(entity: IdEntity): string {
    const next = (this.idSequences.get(entity) ?? 0) + 1;
    this.idSequences.set(entity, next);
    return formatId(entity, next);
  }

  /** Next business number for a family, continuing after the highest seeded number. */
  nextBusinessNumber(
    family:
      | 'customer'
      | 'quote'
      | 'salesOrder'
      | 'shipment'
      | 'return'
      | 'purchaseOrder'
      | 'goodsReceipt'
      | 'invoice'
      | 'payment'
      | 'creditMemo'
      | 'refund'
      | 'transfer'
      | 'cycleCount'
      | 'ticket'
      | 'supplier',
  ): string {
    const year = Number(this.today.slice(0, 4));
    const prefixes: Record<string, string> = {
      customer: 'CUS',
      quote: 'Q',
      salesOrder: 'SO',
      shipment: 'SHP',
      return: 'RMA',
      purchaseOrder: 'PO',
      goodsReceipt: 'GR',
      invoice: 'INV',
      payment: 'PAY',
      creditMemo: 'CM',
      refund: 'RF',
      transfer: 'TR',
      cycleCount: 'CC',
      ticket: 'TCK',
      supplier: 'SUP',
    };
    const yearly =
      family === 'quote' ||
      family === 'salesOrder' ||
      family === 'purchaseOrder' ||
      family === 'invoice';
    const digits =
      family === 'salesOrder' ||
      family === 'purchaseOrder' ||
      family === 'invoice' ||
      family === 'ticket'
        ? 5
        : 6;
    const prefix = yearly ? `${prefixes[family]}-${year}-` : `${prefixes[family]}-`;
    const key = `number:${family}:${yearly ? year : ''}`;
    let max = this.numberSequences.get(key);
    if (max === undefined) {
      max = 0;
      const read = (values: Iterable<object>, field: string): void => {
        for (const value of values) {
          const number = (value as Record<string, unknown>)[field];
          if (typeof number !== 'string' || !number.startsWith(prefix)) continue;
          const sequence = Number(number.slice(prefix.length));
          if (Number.isFinite(sequence) && sequence > max!) max = sequence;
        }
      };
      switch (family) {
        case 'customer':
          read(this.dataset.customers.values(), 'accountNumber');
          break;
        case 'quote':
          read(this.dataset.quotes.values(), 'quoteNumber');
          break;
        case 'salesOrder':
          read(this.dataset.salesOrders.values(), 'orderNumber');
          break;
        case 'shipment':
          read(this.dataset.shipments.values(), 'shipmentNumber');
          break;
        case 'return':
          read(this.dataset.returns.values(), 'returnNumber');
          break;
        case 'purchaseOrder':
          read(this.dataset.purchaseOrders.values(), 'purchaseOrderNumber');
          break;
        case 'goodsReceipt':
          read(this.dataset.goodsReceipts.values(), 'receiptNumber');
          break;
        case 'invoice':
          read(this.dataset.invoices.values(), 'invoiceNumber');
          break;
        case 'payment':
          read(this.dataset.payments.values(), 'paymentNumber');
          break;
        case 'creditMemo':
          read(this.dataset.creditMemos.values(), 'creditMemoNumber');
          break;
        case 'refund':
          read(this.dataset.refunds.values(), 'refundNumber');
          break;
        case 'transfer':
          read(this.dataset.transfers.values(), 'transferNumber');
          break;
        case 'cycleCount':
          read(this.dataset.cycleCounts.values(), 'cycleCountNumber');
          break;
        case 'ticket':
          read(this.dataset.tickets.values(), 'ticketNumber');
          break;
        case 'supplier':
          read(this.dataset.suppliers.values(), 'supplierNumber');
          break;
      }
      // Historical (non-materialized) orders occupy the index-derived range.
      if (family === 'salesOrder' || family === 'quote' || family === 'invoice') {
        const firstOfYear = this.seed.sales.environment.firstIndexOfYear.get(year);
        if (firstOfYear !== undefined)
          max = Math.max(max, this.history.skeletons.length - firstOfYear);
      }
      if (family === 'shipment' || family === 'payment')
        max = Math.max(max, this.history.skeletons.length);
    }
    const next = max + 1;
    this.numberSequences.set(key, next);
    return `${prefix}${String(next).padStart(digits, '0')}`;
  }

  private readonly numberSequences = new Map<string, number>();

  // ---------------------------------------------------------------------------
  // Historical tier (section 75.4)

  isHistoricalOrderId(id: string): boolean {
    const index = orderIndexFromId(id);
    return (
      Number.isInteger(index) &&
      index >= 0 &&
      index < this.history.skeletons.length &&
      !this.history.materializedIndexes.has(index)
    );
  }

  /** Expands a historical order on demand; the graph is cached and read-only. */
  expandHistoricalOrder(index: number): OrderGraph | undefined {
    const cached = this.expandedHistory.get(index);
    if (cached) return cached;
    const skeleton = this.history.skeletons[index];
    if (!skeleton || this.history.materializedIndexes.has(index)) return undefined;
    const graph = buildOrderGraph(this.seed.sales.environment, skeleton);
    numberHistoricalGraph(this.seed.sales.environment, graph);
    if (this.expandedHistory.size > 5_000) this.expandedHistory.clear();
    this.expandedHistory.set(index, graph);
    return graph;
  }

  expandHistoricalOrderById(id: string): OrderGraph | undefined {
    return this.expandHistoricalOrder(orderIndexFromId(id));
  }

  historicalOrderId(index: number): string {
    return orderId(index);
  }
}
