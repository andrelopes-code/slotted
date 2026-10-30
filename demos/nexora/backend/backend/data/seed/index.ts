import { CANONICAL_SEED_INSTANT, SEED_VERSION } from '../../domain';
import type { Dataset } from '../dataset';
import { SCALE_PROFILES, type ScaleProfile } from '../scale';
import { seedCatalog, type CatalogSeedResult } from './catalog';
import { createSeedContext, type SeedContext } from './context';
import { seedCrossCutting } from './cross-cutting';
import {
  curateMasterData,
  curateOrders,
  curatedPurchaseOrders,
  curatedTickets,
  RESERVED_NUMBERS,
  tuneMeridianReceivables,
  MERIDIAN,
} from './curated';
import { seedCustomers, type CustomerSeedResult } from './customers';
import { seedFinance } from './finance';
import { seedInventory } from './inventory';
import { orderId, type OrderEnvironment, type OrderSkeleton, type OrderSummary } from './orders';
import { seedProcurement } from './procurement';
import { seedSales } from './sales';
import { seedSupport } from './support';
import { seedSuppliers, type SupplierSeedResult } from './suppliers';
import { seedTenant, type TenantSeedResult } from './tenant';

export interface SeedOptions {
  /** Root seed; the same seed always yields the same dataset. */
  seed?: string;
  scale?: ScaleProfile['id'] | ScaleProfile;
  /** Demo instant the dataset is built against (section 53.6). */
  now?: string;
  /** Skips the section 76 narrative and edge fixtures (unit tests of the raw generator). */
  curated?: boolean;
  onProgress?: (stage: string, elapsedMs: number) => void;
}

export interface SeedResult {
  dataset: Dataset;
  context: SeedContext;
  tenant: TenantSeedResult;
  catalog: CatalogSeedResult;
  suppliers: SupplierSeedResult;
  customers: CustomerSeedResult;
  sales: {
    environment: OrderEnvironment;
    skeletons: OrderSkeleton[];
    historySummaries: OrderSummary[];
    materializedIndexes: Set<number>;
    firstOperationalIndex: number;
  };
  personaUserIds: Map<string, string>;
  seedVersion: string;
  timings: Record<string, number>;
}

export function resolveScale(scale: SeedOptions['scale']): ScaleProfile {
  if (!scale) return SCALE_PROFILES.canonical;
  return typeof scale === 'string' ? SCALE_PROFILES[scale] : scale;
}

/** Builds the complete deterministic dataset (sections 22–26 and 75–77). */
export function createSeed(options: SeedOptions = {}): SeedResult {
  const started = performance.now();
  const timings: Record<string, number> = {};
  let last = started;
  const mark = (stage: string): void => {
    const now = performance.now();
    timings[stage] = Math.round(now - last);
    last = now;
    options.onProgress?.(stage, Math.round(now - started));
  };

  const scale = resolveScale(options.scale);
  const curated = options.curated ?? true;
  const context = createSeedContext(
    options.seed ?? SEED_VERSION,
    scale,
    options.now ?? CANONICAL_SEED_INSTANT,
  );
  const tenant = seedTenant(context);
  mark('tenant');
  const catalog = seedCatalog(context, tenant);
  mark('catalog');
  const suppliers = seedSuppliers(context);
  mark('suppliers');
  const customers = seedCustomers(context, tenant, catalog);
  mark('customers');
  if (curated) curateMasterData(context, tenant, catalog, customers);

  const fixtureIndexes = new Map<string, number>();
  const sales = seedSales(context, tenant, catalog, customers, (skeletons) => {
    if (!curated) return new Map();
    const curation = curateOrders(context, tenant, catalog, customers, skeletons);
    for (const [key, index] of curation.fixtureIndexes) fixtureIndexes.set(key, index);
    return curation.overrides;
  });
  mark('sales');
  pruneSettledReservations(context);
  for (const [key, index] of fixtureIndexes) context.dataset.fixtures.set(key, orderId(index));
  if (curated) tuneMeridianReceivables(context, tenant, customers);

  const procurement = seedProcurement(context, tenant, {
    reservedNumbers: RESERVED_NUMBERS,
    ...(curated ? { extra: curatedPurchaseOrders(context, tenant, catalog) } : {}),
  });
  mark('procurement');

  const mx240 = catalog.flagshipSkuIds.get('Servo Motor MX-240') as string;
  const chi = tenant.warehouseIdsByCode.get('CHI-01');
  const forcedShortages = new Map<string, number>();
  if (curated && chi) forcedShortages.set(`${mx240}:${chi}`, 0);
  seedInventory(context, tenant, catalog, procurement, { forcedShortages });
  if (curated && chi) context.dataset.fixtures.set('edge.sku.zero_available_inbound', mx240);
  mark('inventory');

  const meridianOrderId = context.dataset.fixtures.get('flagship.order.meridian');
  const meridianShipment = [...context.dataset.shipments.values()].find(
    (shipment) => shipment.shipmentNumber === MERIDIAN.shipmentNumber,
  );
  seedSupport(context, tenant, customers, {
    reservedNumbers: RESERVED_NUMBERS,
    ...(curated && meridianOrderId
      ? {
          extraTickets: curatedTickets(
            context,
            customers,
            meridianOrderId,
            meridianShipment?.id,
            mx240,
          ),
        }
      : {}),
  });
  mark('support');
  seedFinance(context, tenant);
  mark('finance');
  seedCrossCutting(context, tenant);
  mark('cross-cutting');
  registerFixtures(context, tenant);
  mark('fixtures');
  timings['total'] = Math.round(performance.now() - started);

  return {
    dataset: context.dataset,
    context,
    tenant,
    catalog,
    suppliers,
    customers,
    sales,
    personaUserIds: tenant.personaUserIds,
    seedVersion: options.seed ?? SEED_VERSION,
    timings,
  };
}

/**
 * Consumed or released reservations of closed and cancelled orders carry no
 * projection weight (section 60.4 only sums active reservations) and are
 * dropped to keep the materialized tier compact.
 */
function pruneSettledReservations(context: SeedContext): void {
  const { dataset } = context;
  for (const [id, reservation] of dataset.reservations) {
    if (reservation.status === 'active') continue;
    const order = dataset.salesOrders.get(reservation.orderId);
    if (!order || order.status === 'closed' || order.status === 'cancelled')
      dataset.reservations.delete(id);
  }
}

/** Section 82 fixture keys that are discovered from generated data rather than forced. */
function registerFixtures(context: SeedContext, tenant: TenantSeedResult): void {
  const { dataset } = context;
  const set = (key: string, id: string | undefined): void => {
    if (id && !dataset.fixtures.has(key)) dataset.fixtures.set(key, id);
  };
  const meridianShipment = [...dataset.shipments.values()].find(
    (shipment) => shipment.shipmentNumber === MERIDIAN.shipmentNumber,
  );
  set('flagship.shipment.meridian', meridianShipment?.id);
  const meridianInvoiceId = [...dataset.invoices.values()].find(
    (invoice) => invoice.invoiceNumber === MERIDIAN.invoiceNumber,
  )?.id;
  set('flagship.invoice.meridian', meridianInvoiceId);
  set('edge.invoice.overdue', meridianInvoiceId);
  set(
    'flagship.ticket.meridian',
    [...dataset.tickets.values()].find((ticket) => ticket.ticketNumber === MERIDIAN.ticketNumber)
      ?.id,
  );
  set(
    'flagship.sku.mx240',
    [...dataset.skus.values()].find((sku) => sku.name.startsWith('Servo Motor MX-240'))?.id,
  );
  set('edge.user.warehouse_scope', tenant.personaUserIds.get('jordan-wells'));
  set(
    'edge.ticket.urgent_near_breach',
    [...dataset.tickets.values()].find(
      (ticket) =>
        ticket.priority === 'urgent' &&
        ticket.status === 'open' &&
        ticket.firstResponseSla === 'at_risk',
    )?.id ??
      [...dataset.tickets.values()].find(
        (ticket) => ticket.priority === 'urgent' && ticket.status !== 'closed',
      )?.id,
  );
  set(
    'edge.ticket.breached_high',
    [...dataset.tickets.values()].find(
      (ticket) =>
        ticket.priority === 'high' &&
        ticket.firstResponseSla === 'breached' &&
        ticket.status !== 'closed',
    )?.id,
  );
  set(
    'edge.ticket.long_conversation',
    [...dataset.tickets.values()].sort((a, b) => b.messageCount - a.messageCount)[0]?.id,
  );
  set(
    'edge.bank.high_confidence',
    [...dataset.bankTransactions.values()].find((transaction) => transaction.status === 'suggested')
      ?.id,
  );
  set(
    'edge.bank.ambiguous',
    [...dataset.bankTransactions.values()].find(
      (transaction) => transaction.status === 'needs_review',
    )?.id,
  );
  // SKU split across three warehouses.
  const warehousesBySku = new Map<string, Set<string>>();
  for (const movement of dataset.stockMovements.values()) {
    if (movement.sourceEntityType !== 'opening_balance') continue;
    const bucket = warehousesBySku.get(movement.skuId) ?? new Set<string>();
    bucket.add(movement.warehouseId);
    warehousesBySku.set(movement.skuId, bucket);
  }
  const flagshipSkus = new Set(
    [...dataset.skus.values()]
      .filter((sku) => sku.name.startsWith('Servo Motor MX-240'))
      .map((sku) => sku.id),
  );
  for (const [skuId, warehouses] of warehousesBySku) {
    if (warehouses.size >= 3 && !flagshipSkus.has(skuId)) {
      set('edge.sku.three_warehouses', skuId);
      break;
    }
  }
  set(
    'edge.quote.prospect_accepted',
    [...dataset.quotes.values()].find((quote) => quote.status === 'accepted')?.id,
  );
}
