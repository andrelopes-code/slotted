import { addDays, compareDates, diffDays, isBusinessDay, type Customer } from '../../domain';
import type { CatalogSeedResult } from './catalog';
import type { SeedContext } from './context';
import type { CustomerSeedResult } from './customers';
import {
  buildOrderGraph,
  buildPipelineQuote,
  plainNumber,
  summarizeOrder,
  yearlyNumber,
  type OrderEnvironment,
  type OrderGraph,
  type OrderOverride,
  type OrderSkeleton,
  type OrderSummary,
} from './orders';
import { PricingResolver } from './pricing-resolver';
import type { TenantSeedResult } from './tenant';
import { buildOrderSkeletons, firstIndexesByYear } from './timeline';

export interface SalesSeedResult {
  environment: OrderEnvironment;
  skeletons: OrderSkeleton[];
  /**
   * Summaries for every order in the historical tier (index < firstMaterializedIndex, not
   * materialized). Built on first read: 1.1 s of the `light` seed that the first screen does
   * not need. `Transaction` and `applyScenario` read it before they mutate the dataset.
   */
  readonly historySummaries: OrderSummary[];
  /** Indexes of orders materialized into the dataset. */
  materializedIndexes: Set<number>;
  firstOperationalIndex: number;
}

export function createOrderEnvironment(
  context: SeedContext,
  tenant: TenantSeedResult,
  catalog: CatalogSeedResult,
  customers: CustomerSeedResult,
  skeletons: OrderSkeleton[],
  overrides?: Map<number, OrderOverride>,
): OrderEnvironment {
  const { dataset } = context;
  const warehouseActors = new Map<string, string[]>();
  const operatorRole = tenant.roleIdsByKey.get('warehouse_operator');
  const managerRole = tenant.roleIdsByKey.get('warehouse_manager');
  for (const assignment of dataset.roleAssignments.values()) {
    if (assignment.roleId !== operatorRole && assignment.roleId !== managerRole) continue;
    if (assignment.scope.type !== 'warehouse') continue;
    const user = dataset.users.get(assignment.userId);
    if (!user || user.status !== 'active') continue;
    for (const warehouseId of assignment.scope.warehouseIds) {
      const bucket = warehouseActors.get(warehouseId) ?? [];
      bucket.push(user.id);
      warehouseActors.set(warehouseId, bucket);
    }
  }
  const financeRoles = new Set([
    tenant.roleIdsByKey.get('accountant'),
    tenant.roleIdsByKey.get('finance_manager'),
  ]);
  const financeActors = [...dataset.roleAssignments.values()]
    .filter(
      (assignment) =>
        financeRoles.has(assignment.roleId) &&
        dataset.users.get(assignment.userId)?.status === 'active',
    )
    .map((assignment) => assignment.userId);
  const reservedNumbers = new Set<string>();
  if (overrides) {
    for (const override of overrides.values()) {
      if (override.orderNumber) reservedNumbers.add(override.orderNumber);
      if (override.shipmentNumber) reservedNumbers.add(override.shipmentNumber);
      if (override.invoiceNumber) reservedNumbers.add(override.invoiceNumber);
      for (const wave of override.waves ?? []) {
        if (wave.shipmentNumber) reservedNumbers.add(wave.shipmentNumber);
        if (wave.invoiceNumber) reservedNumbers.add(wave.invoiceNumber);
      }
    }
  }
  return {
    context,
    tenant,
    catalog,
    customers,
    pricing: new PricingResolver(dataset, catalog, {
      US: tenant.priceListIdsByName.get('Standard'),
      BR: tenant.priceListIdsByName.get('Brazil Standard'),
    }),
    reservedNumbers,
    firstIndexOfYear: firstIndexesByYear(skeletons),
    warehouseActors,
    financeActors:
      financeActors.length > 0
        ? financeActors
        : [tenant.personaUserIds.get('priya-shah') as string],
    ...(overrides ? { overrides } : {}),
  };
}

export function addGraphToDataset(context: SeedContext, graph: OrderGraph): void {
  const { dataset } = context;
  dataset.salesOrders.set(graph.order.id, graph.order);
  for (const line of graph.lines) dataset.salesOrderLines.set(line.id, line);
  if (graph.quote) dataset.quotes.set(graph.quote.id, graph.quote);
  for (const line of graph.quoteLines) dataset.quoteLines.set(line.id, line);
  if (graph.approval) dataset.approvalRequests.set(graph.approval.id, graph.approval);
  for (const reservation of graph.reservations)
    dataset.reservations.set(reservation.id, reservation);
  for (const shipment of graph.shipments) dataset.shipments.set(shipment.id, shipment);
  for (const line of graph.shipmentLines) dataset.shipmentLines.set(line.id, line);
  for (const movement of graph.movements) dataset.stockMovements.set(movement.id, movement);
  for (const invoice of graph.invoices) dataset.invoices.set(invoice.id, invoice);
  for (const line of graph.invoiceLines) dataset.invoiceLines.set(line.id, line);
  for (const payment of graph.payments) dataset.payments.set(payment.id, payment);
  for (const allocation of graph.allocations)
    dataset.paymentAllocations.set(allocation.id, allocation);
  for (const ret of graph.returns) dataset.returns.set(ret.id, ret);
  for (const line of graph.returnLines) dataset.returnLines.set(line.id, line);
  for (const memo of graph.creditMemos) dataset.creditMemos.set(memo.id, memo);
  for (const line of graph.creditMemoLines) dataset.creditMemoLines.set(line.id, line);
  for (const application of graph.creditMemoApplications)
    dataset.creditMemoApplications.set(application.id, application);
}

/** Assigns index-derived business numbers to an expanded historical graph. */
export function numberHistoricalGraph(env: OrderEnvironment, graph: OrderGraph): void {
  const index = graph.order.metadata.id
    ? Number(graph.order.id.slice(4)) - 1
    : Number(graph.order.id.slice(4)) - 1;
  for (const [position, shipment] of graph.shipments.entries()) {
    if (!shipment.shipmentNumber)
      shipment.shipmentNumber = plainNumber(env, 'shipment', index + 1 + position * 1_000_000);
  }
  for (const [position, invoice] of graph.invoices.entries()) {
    if (!invoice.invoiceNumber) {
      const year = Number(invoice.issueDate.slice(0, 4));
      invoice.invoiceNumber = yearlyNumber(
        env,
        'invoice',
        year,
        index - (env.firstIndexOfYear.get(year) ?? 0) + 1 + position * 100_000,
      );
    }
  }
  for (const [position, payment] of graph.payments.entries()) {
    if (!payment.paymentNumber)
      payment.paymentNumber = plainNumber(env, 'payment', index + 1 + position * 1_000_000);
  }
  for (const ret of graph.returns)
    if (!ret.returnNumber) ret.returnNumber = plainNumber(env, 'return', index + 1);
  for (const memo of graph.creditMemos)
    if (!memo.creditMemoNumber) memo.creditMemoNumber = plainNumber(env, 'creditMemo', index + 1);
}

export function seedSales(
  context: SeedContext,
  tenant: TenantSeedResult,
  catalog: CatalogSeedResult,
  customers: CustomerSeedResult,
  curate?: (skeletons: OrderSkeleton[]) => Map<number, OrderOverride>,
): SalesSeedResult {
  const { dataset, today, operationalStart } = context;
  const skeletons = buildOrderSkeletons(context, tenant, customers);
  const overrides = curate?.(skeletons);
  const environment = createOrderEnvironment(
    context,
    tenant,
    catalog,
    customers,
    skeletons,
    overrides,
  );

  let firstOperationalIndex = skeletons.length;
  for (const skeleton of skeletons) {
    if (compareDates(skeleton.orderDate, operationalStart) >= 0) {
      firstOperationalIndex = skeleton.index;
      break;
    }
  }

  const materializedIndexes = new Set<number>();
  const historical: OrderSkeleton[] = [];
  const openWindowStart = diffDays(today, operationalStart) + 150;

  for (const skeleton of skeletons) {
    const age = diffDays(today, skeleton.orderDate);
    let materialize = skeleton.index >= firstOperationalIndex;
    if (!materialize && age <= openWindowStart) {
      const customer = dataset.customers.get(skeleton.customerId) as Customer;
      const tierRandom = context.random(`order/${skeleton.index}/tier`);
      if (customer.health !== 'healthy' && tierRandom.chance(0.25)) materialize = true;
    }
    if (overrides?.has(skeleton.index)) materialize = true;
    if (materialize) {
      const graph = buildOrderGraph(environment, skeleton);
      addGraphToDataset(context, graph);
      materializedIndexes.add(skeleton.index);
    } else {
      historical.push(skeleton);
    }
  }

  assignOperationalNumbers(environment, firstOperationalIndex, materializedIndexes);
  seedPipelineQuotes(context, environment, skeletons.length);
  let historySummaries: OrderSummary[] | undefined;
  return {
    environment,
    skeletons,
    get historySummaries() {
      return (historySummaries ??= historical.map((skeleton) =>
        summarizeOrder(environment, skeleton),
      ));
    },
    materializedIndexes,
    firstOperationalIndex,
  };
}

/**
 * The quotes that did not become orders, from the operational window on
 * (section 75.3's 52,000 quotes are 48,000 converted ones and 4,000 more).
 * Each business day draws from its own namespace, so no other record's
 * sequence moves.
 */
function seedPipelineQuotes(context: SeedContext, env: OrderEnvironment, firstIndex: number): void {
  const { dataset, scale, operationalStart, today } = context;
  const perBusinessDay = (scale.quotesPerYear / 365) * (7 / 5) * (4_000 / 52_000);
  const customers = [...dataset.customers.values()].filter(
    (customer) => customer.status === 'active' && env.customers.contactsByCustomer.has(customer.id),
  );
  if (customers.length === 0) return;
  let index = firstIndex;
  for (let date = operationalStart; compareDates(date, today) <= 0; date = addDays(date, 1)) {
    if (!isBusinessDay(date)) continue;
    const random = context.random(`quote-pipeline/${date}`);
    const count = Math.max(
      0,
      Math.round(perBusinessDay + random.normal(0, Math.sqrt(Math.max(perBusinessDay, 1)))),
    );
    for (let position = 0; position < count; position += 1) {
      const { quote, lines } = buildPipelineQuote(env, index, date, random.pick(customers), random);
      index += 1;
      dataset.quotes.set(quote.id, quote);
      for (const line of lines) dataset.quoteLines.set(line.id, line);
    }
  }
}

/**
 * Materialized documents receive sequential numbers in creation order,
 * continuing after the index-derived numbers used by the historical tier.
 */
function assignOperationalNumbers(
  env: OrderEnvironment,
  firstOperationalIndex: number,
  materialized: Set<number>,
): void {
  const { dataset } = env.context;
  const historyCount = firstOperationalIndex;
  const byTime = <T extends { metadata: { createdAt: string } }>(values: Iterable<T>): T[] =>
    [...values].sort((a, b) => a.metadata.createdAt.localeCompare(b.metadata.createdAt));

  let shipmentSequence = historyCount;
  for (const shipment of byTime(dataset.shipments.values())) {
    if (shipment.shipmentNumber) continue;
    shipmentSequence += 1;
    shipment.shipmentNumber = plainNumber(env, 'shipment', shipmentSequence);
  }

  const invoiceSequenceByYear = new Map<number, number>();
  for (const [year, firstIndex] of env.firstIndexOfYear) {
    const nextYearFirst =
      [...env.firstIndexOfYear.entries()].find(([candidate]) => candidate === year + 1)?.[1] ??
      Number.POSITIVE_INFINITY;
    const historyInYear = Math.max(0, Math.min(historyCount, nextYearFirst) - firstIndex);
    invoiceSequenceByYear.set(year, historyInYear);
  }
  for (const invoice of [...dataset.invoices.values()].sort((a, b) =>
    (a.openedAt ?? a.metadata.createdAt).localeCompare(b.openedAt ?? b.metadata.createdAt),
  )) {
    if (invoice.invoiceNumber) continue;
    const year = Number(invoice.issueDate.slice(0, 4));
    const next = (invoiceSequenceByYear.get(year) ?? 0) + 1;
    invoiceSequenceByYear.set(year, next);
    invoice.invoiceNumber = yearlyNumber(env, 'invoice', year, next);
  }

  let paymentSequence = historyCount;
  for (const payment of byTime(dataset.payments.values())) {
    if (payment.paymentNumber) continue;
    paymentSequence += 1;
    payment.paymentNumber = plainNumber(env, 'payment', paymentSequence);
  }

  let returnSequence = Math.round(historyCount * 0.04);
  for (const ret of byTime(dataset.returns.values())) {
    if (ret.returnNumber) continue;
    returnSequence += 1;
    ret.returnNumber = plainNumber(env, 'return', returnSequence);
  }
  let creditSequence = Math.round(historyCount * 0.035);
  for (const memo of byTime(dataset.creditMemos.values())) {
    if (memo.creditMemoNumber) continue;
    creditSequence += 1;
    memo.creditMemoNumber = plainNumber(env, 'creditMemo', creditSequence);
  }
  void materialized;
}
