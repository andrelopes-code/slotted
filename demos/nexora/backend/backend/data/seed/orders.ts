import {
  FX_RATES_TO_USD,
  ORGANIZATION_ID,
  fromUsd,
  money,
  type CurrencyCode,
  addBusinessDays,
  addDays,
  addMs,
  businessDateOf,
  businessDateToInstant,
  compareDates,
  diffDays,
  documentTotals,
  dueDateFor,
  evaluateOrderApproval,
  evaluateQuoteApproval,
  formatBusinessNumber,
  formatId,
  instantMs,
  isBusinessDay,
  milliToQuantity,
  priceLine,
  quantity,
  quantityToMilli,
  roundHalfUp,
  weekdayOf,
  type ApprovalRequest,
  type ApprovalStep,
  type CreditMemo,
  type CreditMemoApplication,
  type CreditMemoLine,
  type Customer,
  type EntityMetadata,
  type InventoryReservation,
  type Invoice,
  type InvoiceLine,
  type Money,
  type OrderRiskFlag,
  type Payment,
  type PaymentAllocation,
  type PaymentMethod,
  type PricedLine,
  type Quote,
  type QuoteLine,
  type Return,
  type ReturnLine,
  type SalesOrder,
  type SalesOrderLine,
  type Shipment,
  type ShipmentLine,
  type Sku,
  type StockMovement,
} from '../../domain';
import {
  allocationStatusOf,
  fulfillmentStatusOf,
  invoiceStatusOf,
  paymentStatusOf,
} from '../../domain/derived';
import type { Random } from '../random';
import type { SeedContext } from './context';
import type { CatalogSeedResult } from './catalog';
import { pickDemandSku } from './catalog';
import type { CustomerSeedResult } from './customers';
import type { TenantSeedResult } from './tenant';
import { PricingResolver, snapshotAddress } from './pricing-resolver';
import { CARRIERS, ORDER_TAGS } from '../vocabulary';
import { BR_CARRIERS } from '../vocabulary-br';
import { CANCELLATION_REASONS, ORDER_NOTES, SHIPMENT_EXCEPTIONS_LONG } from '../corpora';

export type OrderKind = 'normal' | 'draft' | 'cancelled' | 'on_hold' | 'pending_approval';

export interface OrderSkeleton {
  index: number;
  customerId: string;
  orderDate: string;
  warehouseId: string;
  kind: OrderKind;
}

export interface OrderSummary {
  index: number;
  customerId: string;
  orderDate: string;
  kind: OrderKind;
  currency: CurrencyCode;
  fxRateToUsd: string;
  totalMinor: number;
  subtotalMinor: number;
  freightMinor: number;
  costMinor: number;
  lineCount: number;
}

export interface OrderGraph {
  order: SalesOrder;
  lines: SalesOrderLine[];
  quote?: Quote;
  quoteLines: QuoteLine[];
  approval?: ApprovalRequest;
  reservations: InventoryReservation[];
  shipments: Shipment[];
  shipmentLines: ShipmentLine[];
  movements: StockMovement[];
  invoices: Invoice[];
  invoiceLines: InvoiceLine[];
  payments: Payment[];
  allocations: PaymentAllocation[];
  returns: Return[];
  returnLines: ReturnLine[];
  creditMemos: CreditMemo[];
  creditMemoLines: CreditMemoLine[];
  creditMemoApplications: CreditMemoApplication[];
}

export interface OrderEnvironment {
  context: SeedContext;
  tenant: TenantSeedResult;
  catalog: CatalogSeedResult;
  customers: CustomerSeedResult;
  pricing: PricingResolver;
  /** Reserved curated business numbers by family, e.g. `SO-2026-01842`. */
  reservedNumbers: Set<string>;
  /** Index of the first order of each calendar year. */
  firstIndexOfYear: Map<number, number>;
  /** Users eligible to act as warehouse actors per warehouse id. */
  warehouseActors: Map<string, string[]>;
  financeActors: string[];
  /** Optional per-order overrides used by curated records and edge cases. */
  overrides?: Map<number, OrderOverride>;
}

export interface OrderLineSpec {
  skuId: string;
  quantity: string;
  unitPriceMinor: number;
  discountBps?: number;
  taxRateBps?: number;
}

export interface OrderWaveSpec {
  /** Ship date as days before the demo clock; negative values are future dates. */
  daysAgo: number;
  /** Quantities (decimal strings) by 0-based line index. */
  quantities: Record<number, string>;
  status?: Shipment['status'];
  shipmentNumber?: string;
  exception?: boolean;
  /** Invoice behaviour for this wave. */
  invoiceNumber?: string;
  invoiceOverdueDays?: number;
  noPayment?: boolean;
  partialPayment?: boolean;
}

export interface OrderOverride {
  orderNumber?: string;
  lineCount?: number;
  targetTotalMinor?: number;
  targetMedianDollars?: number;
  skuIds?: string[];
  /** Explicit lines; replaces generated lines entirely. */
  lineSpecs?: OrderLineSpec[];
  /** Explicit shipment waves; replaces generated fulfilment timing. */
  waves?: OrderWaveSpec[];
  /** Backordered quantity (decimal string) by 0-based line index, never fulfilled. */
  backorder?: Record<number, string>;
  daysToConfirm?: number;
  kind?: OrderKind;
  /** Force shortage on the given line indexes (0-based) with backordered quantity. */
  shortage?: { lineIndex: number; backordered: number }[];
  shipmentCount?: number;
  shipmentNumber?: string;
  shipmentStatus?: Shipment['status'];
  invoiceNumber?: string;
  invoiceOverdueDays?: number;
  invoiceOutstandingMinor?: number;
  customerPoNumber?: string;
  requestedDeliveryDate?: string;
  freightMinor?: number;
  discountBps?: number;
  marginTargetBps?: number;
  noPayment?: boolean;
  partialPayment?: boolean;
  paymentDelayDays?: { mean: number; spread: number };
  returnRequested?: boolean;
  exception?: boolean;
  tags?: string[];
}

const LINE_BLOCK = 200;
const DOC_BLOCK = 4;

export function orderId(index: number): string {
  return formatId('salesOrder', index + 1);
}

export function orderIndexFromId(id: string): number {
  return Number(id.slice(id.lastIndexOf('_') + 1)) - 1;
}

function lineId(index: number, lineNumber: number): string {
  return formatId('salesOrderLine', index * LINE_BLOCK + lineNumber);
}

/** Numbering that skips curated reserved numbers (section 53.3 uniqueness). */
export function yearlyNumber(
  env: OrderEnvironment,
  family: 'salesOrder' | 'quote' | 'invoice' | 'purchaseOrder',
  year: number,
  sequence: number,
): string {
  let candidate = sequence;
  for (let guard = 0; guard < 8; guard += 1) {
    const number = formatBusinessNumber(family, candidate, year);
    if (!env.reservedNumbers.has(number)) return number;
    candidate += 1;
  }
  return formatBusinessNumber(family, candidate, year);
}

export function plainNumber(
  env: OrderEnvironment,
  family:
    | 'shipment'
    | 'payment'
    | 'return'
    | 'creditMemo'
    | 'goodsReceipt'
    | 'refund'
    | 'transfer'
    | 'cycleCount'
    | 'ticket',
  sequence: number,
): string {
  let candidate = sequence;
  for (let guard = 0; guard < 8; guard += 1) {
    const number = formatBusinessNumber(family, candidate);
    if (!env.reservedNumbers.has(number)) return number;
    candidate += 1;
  }
  return formatBusinessNumber(family, candidate);
}

function metadataAt(
  createdAt: string,
  createdBy: string,
  updatedAt = createdAt,
  updatedBy = createdBy,
  version = 1,
): EntityMetadata {
  return {
    id: '',
    organizationId: ORGANIZATION_ID,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    version,
  };
}

function instantOn(date: string, random: Random, startHour = 8, endHour = 17): string {
  return addMs(
    businessDateToInstant(date, random.int(startHour, endHour), random.int(0, 59)),
    random.int(0, 59_000),
  );
}

function nextBusinessDayOnOrAfter(date: string): string {
  let current = date;
  while (!isBusinessDay(current)) current = addDays(current, 1);
  return current;
}

/** Order value target (section 75.5) correlated with segment (section 75.6). */
export function targetOrderTotalMinor(
  random: Random,
  customer: Customer,
  medianOverride?: number,
): number {
  const median =
    medianOverride ??
    (customer.segment === 'strategic'
      ? 4_400
      : customer.segment === 'enterprise'
        ? 3_300
        : customer.segment === 'mid_market'
          ? 2_200
          : 1_400);
  const dollars = Math.max(45, random.logNormal(median, medianOverride ? 0.9 : 1.6));
  return roundHalfUp(dollars * 100);
}

export function lineCountFor(random: Random, override?: number): number {
  if (override) return override;
  const roll = random.next();
  if (roll < 0.22) return 1;
  if (roll < 0.42) return 2;
  if (roll < 0.58) return 3;
  if (roll < 0.7) return 4;
  if (roll < 0.8) return 5;
  if (roll < 0.9) return random.int(6, 9);
  if (roll < 0.99) return random.int(10, 28);
  return random.int(29, 60);
}

function quantityFor(
  random: Random,
  sku: Sku,
  lineTargetMinor: number,
  unitPriceMinor: number,
): string {
  const raw = lineTargetMinor / Math.max(1, unitPriceMinor);
  let value: number;
  switch (sku.unitOfMeasure) {
    case 'FT':
    case 'M':
      value = Math.max(10, Math.round(raw / 10) * 10);
      break;
    case 'KG':
      value = Math.max(
        1,
        Math.round(raw * (sku.quantityPrecision > 0 ? 2 : 1)) / (sku.quantityPrecision > 0 ? 2 : 1),
      );
      break;
    case 'PK':
      value = Math.max(1, Math.round(raw));
      break;
    default:
      value = Math.max(1, Math.round(raw));
  }
  if (random.chance(0.15)) value = Math.max(1, Math.round(value * random.float(0.6, 1.8)));
  return quantity(value, sku.quantityPrecision);
}

interface BuiltLine {
  sku: Sku;
  priced: PricedLine;
  quantityMilli: number;
  priceSource: 'contract' | 'customer_list' | 'standard';
}

function buildLines(
  env: OrderEnvironment,
  random: Random,
  customer: Customer,
  orderDate: string,
  shippingRegion: string,
  override: OrderOverride | undefined,
): BuiltLine[] {
  const { dataset } = env.context;
  if (override?.lineSpecs) {
    return override.lineSpecs.flatMap((spec) => {
      const sku = dataset.skus.get(spec.skuId);
      if (!sku) return [];
      const priced = priceLine({
        quantity: spec.quantity,
        listUnitPrice: money(spec.unitPriceMinor, customer.preferredCurrency),
        discountBps: spec.discountBps ?? 0,
        taxRateBps: spec.taxRateBps ?? env.pricing.taxRateBps(customer, shippingRegion, sku),
        unitCost: sku.standardCost,
      });
      return [
        {
          sku,
          priced,
          quantityMilli: quantityToMilli(spec.quantity),
          priceSource: 'contract' as const,
        },
      ];
    });
  }
  const lineCount = lineCountFor(random, override?.lineCount);
  const fx = Number(FX_RATES_TO_USD[customer.preferredCurrency]);
  const targetTotal =
    override?.targetTotalMinor ??
    roundHalfUp(targetOrderTotalMinor(random, customer, override?.targetMedianDollars) / fx);
  const weights: number[] = [];
  let weightSum = 0;
  for (let index = 0; index < lineCount; index += 1) {
    const weight = random.logNormal(1, 0.8);
    weights.push(weight);
    weightSum += weight;
  }
  const lines: BuiltLine[] = [];
  const usedSkus = new Set<string>();
  const historical = diffDays(env.context.today, orderDate) > 200;
  for (let index = 0; index < lineCount; index += 1) {
    let sku: Sku | undefined;
    let priceResolution: ReturnType<PricingResolver['resolve']> | undefined;
    const lineTarget = (targetTotal * (weights[index] as number)) / weightSum;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const skuId = override?.skuIds?.[index] ?? pickDemandSku(random, env.catalog);
      if (usedSkus.has(skuId) && !override?.skuIds) continue;
      const candidate = dataset.skus.get(skuId);
      if (!candidate) continue;
      const isHistoricalDiscontinued = candidate.status === 'discontinued' && historical;
      if (candidate.status !== 'active' && !isHistoricalDiscontinued && !override?.skuIds) continue;
      priceResolution = env.pricing.resolve(customer, candidate, orderDate);
      if (!priceResolution) continue;
      // Small line budgets favour cheaper items (consumables), which keeps the
      // order-value distribution on target while leaving room for outliers.
      if (
        !override?.skuIds &&
        attempt < 8 &&
        priceResolution.listUnitPrice.minor > lineTarget * 2.5
      )
        continue;
      sku = candidate;
      usedSkus.add(skuId);
      break;
    }
    if (!sku || !priceResolution) continue;
    const quantityValue = quantityFor(random, sku, lineTarget, priceResolution.listUnitPrice.minor);
    const discountBps =
      override?.discountBps ??
      (priceResolution.source === 'contract'
        ? 0
        : random.weighted([
            { value: 0, weight: 72 },
            { value: random.pick([200, 300, 500, 750, 1_000]), weight: 26.5 },
            { value: random.pick([1_200, 1_500, 2_000, 2_500, 3_000]), weight: 1.5 },
          ]));
    let unitCost = fromUsd(sku.standardCost, customer.preferredCurrency);
    if (override?.marginTargetBps !== undefined) {
      unitCost = money(
        roundHalfUp(
          priceResolution.listUnitPrice.minor *
            (1 - discountBps / 10_000) *
            (1 - override.marginTargetBps / 10_000),
        ),
        customer.preferredCurrency,
      );
    }
    const priced = priceLine({
      quantity: quantityValue,
      listUnitPrice: priceResolution.listUnitPrice,
      discountBps,
      taxRateBps: env.pricing.taxRateBps(customer, shippingRegion, sku),
      unitCost,
    });
    lines.push({
      sku,
      priced,
      quantityMilli: quantityToMilli(quantityValue),
      priceSource: priceResolution.source,
    });
  }
  return lines;
}

export function decideOrderKind(random: Random, age: number, override?: OrderKind): OrderKind {
  if (override) return override;
  const roll = random.next();
  if (roll < 0.04) return 'cancelled';
  if (age <= 21 && roll < 0.07) return 'draft';
  if (age <= 45 && roll < 0.09) return 'on_hold';
  return 'normal';
}

/**
 * Computes only the commercial totals of an order. Used for the historical
 * tier index so customer and KPI aggregates reconcile with expanded records.
 */
export function summarizeOrder(env: OrderEnvironment, skeleton: OrderSkeleton): OrderSummary {
  const random = env.context.random(`order/${skeleton.index}`);
  const customer = env.context.dataset.customers.get(skeleton.customerId) as Customer;
  const shipping = env.customers.addressesByCustomer
    .get(customer.id)
    ?.find((address) => address.id === customer.defaultShippingAddressId);
  const override = env.overrides?.get(skeleton.index);
  const lines = buildLines(
    env,
    random,
    customer,
    skeleton.orderDate,
    shipping?.region ?? 'IL',
    override,
  );
  const currency = customer.preferredCurrency;
  const freight = money(override?.freightMinor ?? freightFor(random, lines, currency), currency);
  const totals = documentTotals(
    lines.map((line) => line.priced),
    freight,
    currency,
  );
  return {
    index: skeleton.index,
    customerId: skeleton.customerId,
    orderDate: skeleton.orderDate,
    kind: skeleton.kind,
    currency,
    fxRateToUsd: FX_RATES_TO_USD[currency],
    totalMinor: totals.total.minor,
    subtotalMinor: totals.subtotal.minor,
    freightMinor: freight.minor,
    costMinor: totals.costTotal.minor,
    lineCount: lines.length,
  };
}

function freightFor(random: Random, lines: BuiltLine[], currency: CurrencyCode): number {
  if (random.chance(0.38)) return 0;
  let grams = 0;
  for (const line of lines) grams += (line.sku.weightGrams ?? 500) * (line.quantityMilli / 1000);
  const dollars = 18 + Math.min(1_200, grams / 1_000) * random.float(0.25, 0.6);
  return roundHalfUp(dollars / Number(FX_RATES_TO_USD[currency])) * 100;
}

function paymentDelayDays(
  random: Random,
  customer: Customer,
  override?: { mean: number; spread: number },
): number {
  if (override) return Math.round(random.normal(override.mean, override.spread));
  switch (customer.health) {
    case 'healthy':
      return Math.round(random.normal(-4, 6));
    case 'watch':
      return Math.round(random.normal(6, 10));
    case 'at_risk':
      return Math.round(random.normal(21, 16));
  }
}

function paymentMethod(random: Random, customer: Customer): PaymentMethod {
  if (customer.regionCode === 'BR') {
    return random.weighted<PaymentMethod>([
      { value: 'pix', weight: 46 },
      { value: 'boleto', weight: 38 },
      { value: 'wire', weight: 12 },
      { value: 'credit_card', weight: 4 },
    ]);
  }
  return random.weighted<PaymentMethod>([
    { value: 'ach', weight: customer.segment === 'smb' ? 42 : 58 },
    { value: 'wire', weight: customer.segment === 'smb' ? 14 : 28 },
    { value: 'credit_card', weight: customer.segment === 'smb' ? 26 : 6 },
    { value: 'check', weight: customer.segment === 'smb' ? 16 : 6 },
    { value: 'other', weight: 2 },
  ]);
}

/**
 * Builds the full order graph. The result is deterministic for a given index
 * and independent of other orders, which is what lets the historical tier be
 * expanded on demand.
 */
/**
 * A quote that did not become an order (section 75.3: 52,000 quotes against
 * 48,000 converted ones, the 30% of orders a quote precedes). Its state
 * follows its age: a recent quote is a draft or sent, one inside its 30 days
 * may have been viewed, accepted or rejected, and an older one expired or was
 * rejected. `index` is past the last order's, so the quote's id, lines and
 * number follow the ones orders hold.
 */
export function buildPipelineQuote(
  env: OrderEnvironment,
  index: number,
  quoteDate: string,
  customer: Customer,
  random: Random,
): { quote: Quote; lines: QuoteLine[] } {
  const { context } = env;
  const addresses = env.customers.addressesByCustomer.get(customer.id) ?? [];
  const shipping =
    addresses.find((address) => address.id === customer.defaultShippingAddressId) ?? addresses[0];
  const contacts = env.customers.contactsByCustomer.get(customer.id) ?? [];
  const contact = contacts.find((entry) => entry.isPrimary) ?? contacts[0];
  const built = buildLines(env, random, customer, quoteDate, shipping?.region ?? 'IL', undefined);
  const currency = customer.preferredCurrency;
  const fxRateToUsd = FX_RATES_TO_USD[currency];
  const freight = money(freightFor(random, built, currency), currency);
  const totals = documentTotals(
    built.map((line) => line.priced),
    freight,
    currency,
  );
  const maxDiscount = built.reduce((max, line) => Math.max(max, line.priced.discountBps), 0);
  const approval = evaluateQuoteApproval({
    approvalValueUsdMinor: roundHalfUp(
      (totals.subtotal.minor + freight.minor) * Number(fxRateToUsd),
    ),
    grossMarginBps: totals.grossMarginBps,
    maxLineDiscountBps: maxDiscount,
  });
  const age = diffDays(context.today, quoteDate);
  const status: Quote['status'] =
    age <= 3
      ? random.weighted<Quote['status']>([
          { value: 'draft', weight: 30 },
          { value: approval.required ? 'pending_approval' : 'sent', weight: 70 },
        ])
      : age <= 30
        ? random.weighted<Quote['status']>([
            { value: 'sent', weight: 35 },
            { value: 'viewed', weight: 30 },
            { value: 'accepted', weight: 10 },
            { value: 'rejected', weight: 25 },
          ])
        : random.weighted<Quote['status']>([
            { value: 'expired', weight: 70 },
            { value: 'rejected', weight: 30 },
          ]);
  const createdAt = instantOn(quoteDate, random);
  const year = Number(quoteDate.slice(0, 4));
  const id = formatId('quote', index + 1);
  const sentAt =
    status === 'draft' || status === 'pending_approval'
      ? undefined
      : addMs(createdAt, random.int(1, 6) * 3_600_000);
  const viewedAt =
    sentAt && status !== 'sent' && status !== 'expired'
      ? addMs(sentAt, random.int(1, 72) * 3_600_000)
      : undefined;
  const decidedAt = viewedAt ?? sentAt;
  const quote: Quote = {
    id,
    organizationId: ORGANIZATION_ID,
    quoteNumber: yearlyNumber(
      env,
      'quote',
      year,
      index - (env.firstIndexOfYear.get(year) ?? 0) + 1,
    ),
    customerId: customer.id,
    contactId: contact?.id ?? '',
    ownerId: customer.accountOwnerId,
    createdBusinessDate: quoteDate,
    expirationDate: addDays(quoteDate, 30),
    currency,
    fxRateToUsd,
    priceListId: customer.priceListId,
    status,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    freight,
    total: totals.total,
    costTotal: totals.costTotal,
    grossMargin: totals.grossMargin,
    grossMarginBps: totals.grossMarginBps,
    metadata: metadataAt(
      createdAt,
      customer.accountOwnerId,
      decidedAt ?? createdAt,
      customer.accountOwnerId,
      sentAt ? 3 : 1,
    ),
    ...(sentAt ? { sentAt } : {}),
    ...(viewedAt ? { viewedAt } : {}),
    ...(status === 'accepted' && decidedAt
      ? { acceptedAt: addMs(decidedAt, random.int(1, 48) * 3_600_000) }
      : {}),
    ...(status === 'rejected'
      ? {
          rejectionReason: random.pick([
            'Price above the competing bid',
            'Project postponed by the customer',
            'Lead time too long for the site schedule',
            'Customer sourced from an existing supplier',
          ]),
        }
      : {}),
  };
  const lines: QuoteLine[] = built.map((line, position) => ({
    id: formatId('quoteLine', index * LINE_BLOCK + position + 1),
    organizationId: ORGANIZATION_ID,
    quoteId: id,
    lineNumber: position + 1,
    skuId: line.sku.id,
    skuCode: line.sku.sku,
    description: line.sku.name,
    unitOfMeasure: line.sku.unitOfMeasure,
    quantity: line.priced.quantity,
    listUnitPrice: line.priced.listUnitPrice,
    unitPrice: line.priced.unitPrice,
    discountBps: line.priced.discountBps,
    taxRateBps: line.priced.taxRateBps,
    unitCost: line.priced.unitCost,
    netAmount: line.priced.netAmount,
    taxAmount: line.priced.taxAmount,
    totalAmount: line.priced.totalAmount,
  }));
  return { quote, lines };
}

export function buildOrderGraph(env: OrderEnvironment, skeleton: OrderSkeleton): OrderGraph {
  const { context } = env;
  const { dataset, today } = context;
  const random = context.random(`order/${skeleton.index}`);
  const customer = dataset.customers.get(skeleton.customerId) as Customer;
  const override = env.overrides?.get(skeleton.index);
  const addresses = env.customers.addressesByCustomer.get(customer.id) ?? [];
  const billing =
    addresses.find((address) => address.id === customer.billingAddressId) ?? addresses[0];
  const shipping =
    addresses.find((address) => address.id === customer.defaultShippingAddressId) ?? billing;
  const contacts = env.customers.contactsByCustomer.get(customer.id) ?? [];
  const contact = contacts.find((entry) => entry.isPrimary) ?? contacts[0];
  const age = diffDays(today, skeleton.orderDate);
  const kind = skeleton.kind;
  const ownerId = customer.accountOwnerId;
  const shippingRegion = shipping?.region ?? 'IL';
  const orderDate = skeleton.orderDate;
  const index = skeleton.index;
  const id = orderId(index);
  const year = Number(orderDate.slice(0, 4));
  const orderNumber =
    override?.orderNumber ??
    yearlyNumber(env, 'salesOrder', year, index - (env.firstIndexOfYear.get(year) ?? 0) + 1);

  // Lines and freight draw first so `summarizeOrder` and this builder share the same stream.
  const built = buildLines(env, random, customer, orderDate, shippingRegion, override);
  const currency = customer.preferredCurrency;
  const fxRateToUsd = FX_RATES_TO_USD[currency];
  const usdEquivalent = (minor: number): number => roundHalfUp(minor * Number(fxRateToUsd));
  const cash = (minor: number): Money => money(minor, currency);
  const freight = cash(override?.freightMinor ?? freightFor(random, built, currency));
  const createdAt = instantOn(orderDate, random);
  const totals = documentTotals(
    built.map((line) => line.priced),
    freight,
    currency,
  );
  const maxDiscount = built.reduce((max, line) => Math.max(max, line.priced.discountBps), 0);

  const graph: OrderGraph = {
    order: undefined as unknown as SalesOrder,
    lines: [],
    quoteLines: [],
    reservations: [],
    shipments: [],
    shipmentLines: [],
    movements: [],
    invoices: [],
    invoiceLines: [],
    payments: [],
    allocations: [],
    returns: [],
    returnLines: [],
    creditMemos: [],
    creditMemoLines: [],
    creditMemoApplications: [],
  };

  // Lines
  const lines: SalesOrderLine[] = built.map((line, position) => ({
    id: lineId(index, position + 1),
    organizationId: ORGANIZATION_ID,
    orderId: id,
    lineNumber: position + 1,
    skuId: line.sku.id,
    skuCode: line.sku.sku,
    description: line.sku.name,
    unitOfMeasure: line.sku.unitOfMeasure,
    orderedQuantity: line.priced.quantity,
    cancelledQuantity: '0',
    reservedQuantity: '0',
    fulfilledQuantity: '0',
    returnedQuantity: '0',
    invoicedQuantity: '0',
    listUnitPrice: line.priced.listUnitPrice,
    unitPrice: line.priced.unitPrice,
    discountBps: line.priced.discountBps,
    taxRateBps: line.priced.taxRateBps,
    unitCost: line.priced.unitCost,
    netAmount: line.priced.netAmount,
    taxAmount: line.priced.taxAmount,
    totalAmount: line.priced.totalAmount,
    preferredWarehouseId: skeleton.warehouseId,
    promisedDate: addBusinessDays(orderDate, random.int(2, 9)),
  }));
  graph.lines = lines;
  const lineById = new Map<string, SalesOrderLine>();
  for (const line of lines) lineById.set(line.id, line);
  const reservationsByLine = new Map<string, InventoryReservation[]>();
  const trackReservation = (reservation: InventoryReservation): void => {
    graph.reservations.push(reservation);
    const bucket = reservationsByLine.get(reservation.orderLineId);
    if (bucket) bucket.push(reservation);
    else reservationsByLine.set(reservation.orderLineId, [reservation]);
  };

  // Source quote (about 30% of orders)
  let sourceQuoteId: string | undefined;
  if (random.chance(0.3) && !override?.skuIds && !override?.lineSpecs) {
    const quoteDate = addDays(orderDate, -random.int(2, 21));
    const quoteId = formatId('quote', index + 1);
    const quoteCreatedAt = instantOn(quoteDate, random);
    const quoteYear = Number(quoteDate.slice(0, 4));
    const quoteApproval = evaluateQuoteApproval({
      approvalValueUsdMinor: usdEquivalent(totals.subtotal.minor + freight.minor),
      grossMarginBps: totals.grossMarginBps,
      maxLineDiscountBps: maxDiscount,
    });
    const quote: Quote = {
      id: quoteId,
      organizationId: ORGANIZATION_ID,
      quoteNumber: yearlyNumber(
        env,
        'quote',
        quoteYear,
        index - (env.firstIndexOfYear.get(quoteYear) ?? 0) + 1,
      ),
      customerId: customer.id,
      contactId: contact?.id ?? '',
      ownerId,
      createdBusinessDate: quoteDate,
      expirationDate: addDays(quoteDate, 30),
      currency,
      fxRateToUsd,
      priceListId: customer.priceListId,
      status: 'converted',
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      freight,
      total: totals.total,
      costTotal: totals.costTotal,
      grossMargin: totals.grossMargin,
      grossMarginBps: totals.grossMarginBps,
      sentAt: addMs(quoteCreatedAt, random.int(1, 6) * 3_600_000),
      acceptedAt: addMs(createdAt, -random.int(1, 48) * 3_600_000),
      convertedOrderId: id,
      metadata: metadataAt(
        quoteCreatedAt,
        ownerId,
        createdAt,
        ownerId,
        quoteApproval.required ? 5 : 4,
      ),
      ...(random.chance(0.5)
        ? { terms: 'Prices valid 30 days. Freight prepaid and added unless noted.' }
        : {}),
    };
    if (random.chance(0.5))
      quote.viewedAt = addMs(quote.sentAt as string, random.int(1, 72) * 3_600_000);
    graph.quote = quote;
    graph.quoteLines = built.map((line, position) => ({
      id: formatId('quoteLine', index * LINE_BLOCK + position + 1),
      organizationId: ORGANIZATION_ID,
      quoteId,
      lineNumber: position + 1,
      skuId: line.sku.id,
      skuCode: line.sku.sku,
      description: line.sku.name,
      unitOfMeasure: line.sku.unitOfMeasure,
      quantity: line.priced.quantity,
      listUnitPrice: line.priced.listUnitPrice,
      unitPrice: line.priced.unitPrice,
      discountBps: line.priced.discountBps,
      taxRateBps: line.priced.taxRateBps,
      unitCost: line.priced.unitCost,
      netAmount: line.priced.netAmount,
      taxAmount: line.priced.taxAmount,
      totalAmount: line.priced.totalAmount,
    }));
    sourceQuoteId = quoteId;
  }

  // Approval policy
  const approvalValue = totals.subtotal.minor + freight.minor;
  const creditLimitExceeded =
    customer.creditLimit.minor > 0 &&
    totals.total.minor > customer.creditLimit.minor * 0.9 &&
    random.chance(0.5);
  const evaluation = evaluateOrderApproval({
    approvalValueUsdMinor: usdEquivalent(approvalValue),
    grossMarginBps: totals.grossMarginBps,
    maxLineDiscountBps: maxDiscount,
    creditLimitExceeded,
    customerOnHold: customer.status === 'on_hold' && age <= 60,
  });
  const requiresApproval = evaluation.required;
  const approvalPending =
    kind === 'pending_approval' ||
    (requiresApproval && age <= 4 && kind === 'normal' && random.chance(0.6));

  const riskFlags: OrderRiskFlag[] = [];
  if (creditLimitExceeded) riskFlags.push('credit_limit_exceeded');
  if (totals.grossMarginBps < 2_200) riskFlags.push('low_margin');
  if (maxDiscount >= 1_200) riskFlags.push('high_discount');
  if (customer.status === 'on_hold') riskFlags.push('customer_on_hold');
  if (customer.health === 'at_risk' && age <= 60) riskFlags.push('overdue_receivables');

  const submittedAt = addMs(createdAt, random.int(5, 240) * 60_000);
  if (override?.daysToConfirm !== undefined) {
    // Keep the confirmation on the requested day.
  }
  let status: SalesOrder['status'];
  let approvalStatus: SalesOrder['approvalStatus'] = requiresApproval ? 'approved' : 'not_required';
  let confirmedAt: string | undefined;
  const approvalDecidedAt = requiresApproval
    ? addMs(submittedAt, random.int(2, 36) * 3_600_000)
    : submittedAt;
  const confirmationDate = businessDateOf(approvalDecidedAt);

  if (kind === 'draft') {
    status = 'draft';
    approvalStatus = 'not_required';
  } else if (approvalPending) {
    status = 'pending_approval';
    approvalStatus = 'pending';
  } else if (kind === 'cancelled' && random.chance(0.3)) {
    status = 'cancelled';
    approvalStatus = requiresApproval ? 'cancelled' : 'not_required';
  } else {
    status = 'confirmed';
    confirmedAt = approvalDecidedAt;
  }

  // Approval request record
  if (requiresApproval && kind !== 'draft') {
    const requestId = formatId('approvalRequest', index + 1);
    const steps: ApprovalStep[] = evaluation.steps.map((step, position) => {
      const approverPool =
        step.requiredRole === 'finance_manager'
          ? env.financeActors
          : [env.tenant.personaUserIds.get('sofia-ramirez') as string];
      const decided = !approvalPending && !(status === 'cancelled');
      return {
        id: formatId('approvalStep', index * DOC_BLOCK + position + 1),
        sequence: step.sequence,
        requiredRole: step.requiredRole,
        assignedUserId: random.pick(approverPool),
        status: decided ? 'approved' : approvalPending && step.sequence > 1 ? 'pending' : 'pending',
        ...(decided
          ? {
              decidedBy: random.pick(approverPool),
              decidedAt: approvalDecidedAt,
              comment: random.pick([
                'Approved — pricing within policy.',
                'Approved per strategic account plan.',
                'Approved; margin reviewed with sales.',
                'OK to proceed.',
              ]),
            }
          : {}),
      };
    });
    graph.approval = {
      id: requestId,
      organizationId: ORGANIZATION_ID,
      targetType: 'sales_order',
      targetId: id,
      targetNumber: orderNumber,
      policyCode: evaluation.policyCode,
      reasons: evaluation.reasons,
      status: approvalPending ? 'pending' : status === 'cancelled' ? 'cancelled' : 'approved',
      requestedBy: ownerId,
      requestedAt: submittedAt,
      amount: cash(approvalValue),
      steps,
      metadata: metadataAt(
        submittedAt,
        ownerId,
        approvalPending ? submittedAt : approvalDecidedAt,
        ownerId,
        approvalPending ? 1 : 2,
      ),
      ...(approvalPending ? {} : { decidedAt: approvalDecidedAt }),
    };
  }

  const order: SalesOrder = {
    id,
    organizationId: ORGANIZATION_ID,
    orderNumber,
    customerId: customer.id,
    contactId: contact?.id ?? '',
    ownerId,
    salesTeamId: customer.salesTeamId,
    orderDate,
    defaultWarehouseId: skeleton.warehouseId,
    billingAddress: snapshotAddress(billing, customer.legalName),
    shippingAddress: snapshotAddress(shipping, customer.displayName),
    currency,
    fxRateToUsd,
    paymentTermsCode: customer.paymentTermsCode,
    status,
    approvalStatus,
    riskFlags,
    allocationStatus: 'unallocated',
    fulfillmentStatus: 'unfulfilled',
    invoiceStatus: 'not_invoiced',
    paymentStatus: 'not_invoiced',
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    freight,
    total: totals.total,
    costTotal: totals.costTotal,
    grossMargin: totals.grossMargin,
    grossMarginBps: totals.grossMarginBps,
    metadata: metadataAt(createdAt, ownerId, createdAt, ownerId, 1),
    ...(sourceQuoteId ? { sourceQuoteId } : {}),
    ...(graph.approval ? { approvalRequestId: graph.approval.id } : {}),
    ...(confirmedAt ? { confirmedAt } : {}),
    ...(override?.customerPoNumber
      ? { customerPoNumber: override.customerPoNumber }
      : random.chance(0.55)
        ? {
            customerPoNumber: `${random.pick(['PO', 'PO-', 'P', 'PUR-'])}${random.digits(random.int(5, 7))}`,
          }
        : {}),
    ...(override?.requestedDeliveryDate
      ? { requestedDeliveryDate: override.requestedDeliveryDate }
      : random.chance(0.45)
        ? { requestedDeliveryDate: addBusinessDays(orderDate, random.int(3, 15)) }
        : {}),
    ...(random.chance(0.12)
      ? {
          notes: random.pick(ORDER_NOTES),
        }
      : {}),
  };
  graph.order = order;
  void ORDER_TAGS;

  if (status === 'draft' || status === 'pending_approval') {
    order.metadata.version = status === 'pending_approval' ? 2 : 1;
    order.metadata.updatedAt = status === 'pending_approval' ? submittedAt : createdAt;
    return graph;
  }

  if (status === 'cancelled') {
    const cancelledAt = addMs(submittedAt, random.int(1, 72) * 3_600_000);
    order.cancelledAt = cancelledAt;
    order.cancellationReason = random.pick(CANCELLATION_REASONS);
    for (const line of lines) line.cancelledQuantity = line.orderedQuantity;
    order.metadata.version = 3;
    order.metadata.updatedAt = cancelledAt;
    return graph;
  }

  // Confirmed. Allocation, fulfillment, invoicing and payment follow.
  let version = requiresApproval ? 3 : 2;
  let lastUpdatedAt = confirmedAt as string;
  const confirmedDate = confirmationDate;
  const holdOrder = kind === 'on_hold';
  const cancelLater = kind === 'cancelled';

  // Shortage plan
  const shortages = new Map<number, number>();
  if (override?.backorder) {
    for (const [lineIndex, qty] of Object.entries(override.backorder))
      shortages.set(Number(lineIndex), quantityToMilli(qty) / 1000);
  } else if (override?.shortage) {
    for (const shortage of override.shortage)
      shortages.set(shortage.lineIndex, shortage.backordered);
  } else {
    for (const [position, line] of built.entries()) {
      if (random.chance(0.06)) {
        const milli = line.quantityMilli;
        const backordered = Math.max(1, Math.round((milli / 1000) * random.float(0.2, 0.8)));
        shortages.set(position, Math.min(Math.floor(milli / 1000), backordered));
      }
    }
  }
  const shortageResolvesOn = override?.backorder
    ? addBusinessDays(today, 7)
    : addBusinessDays(confirmedDate, random.int(4, 18));
  const shortageResolved = compareDates(shortageResolvesOn, today) <= 0;

  // Reservations at confirmation.
  const reservationIdBase = index * LINE_BLOCK * 2;
  let reservationCounter = 0;
  const lineReserved = new Map<string, number>();
  for (const [position, line] of lines.entries()) {
    const orderedMilli = quantityToMilli(line.orderedQuantity);
    const backorderedMilli = (shortages.get(position) ?? 0) * 1000;
    const reservedMilli = Math.max(0, orderedMilli - backorderedMilli);
    if (reservedMilli > 0) {
      reservationCounter += 1;
      trackReservation({
        id: formatId('inventoryReservation', reservationIdBase + reservationCounter),
        organizationId: ORGANIZATION_ID,
        orderId: id,
        orderLineId: line.id,
        skuId: line.skuId,
        warehouseId: line.preferredWarehouseId,
        quantity: milliToQuantity(reservedMilli),
        consumedQuantity: '0',
        status: 'active',
        createdAt: confirmedAt as string,
      });
      lineReserved.set(line.id, reservedMilli);
    }
    if (backorderedMilli > 0 && shortageResolved) {
      reservationCounter += 1;
      trackReservation({
        id: formatId('inventoryReservation', reservationIdBase + reservationCounter),
        organizationId: ORGANIZATION_ID,
        orderId: id,
        orderLineId: line.id,
        skuId: line.skuId,
        warehouseId: line.preferredWarehouseId,
        quantity: milliToQuantity(backorderedMilli),
        consumedQuantity: '0',
        status: 'active',
        createdAt: businessDateToInstant(shortageResolvesOn, 9),
      });
      lineReserved.set(line.id, reservedMilli + backorderedMilli);
    }
  }
  for (const line of lines) line.reservedQuantity = milliToQuantity(lineReserved.get(line.id) ?? 0);

  if (holdOrder) {
    order.status = 'on_hold';
    order.holdReason = random.pick([
      'Credit review pending',
      'Customer requested hold — site not ready',
      'Awaiting updated PO from customer',
      'Pricing verification',
    ]);
    order.allocationStatus = allocationStatusOf(lines);
    order.metadata.version = version + 1;
    order.metadata.updatedAt = addMs(confirmedAt as string, random.int(2, 48) * 3_600_000);
    return graph;
  }

  // Shipments: first wave ships reserved quantities; backordered remainder ships when resolved.
  const firstShipDate = nextBusinessDayOnOrAfter(
    addDays(
      confirmedDate,
      random.weighted([
        { value: 0, weight: 25 },
        { value: 1, weight: 40 },
        { value: 2, weight: 20 },
        { value: 3, weight: 9 },
        { value: random.int(4, 8), weight: 6 },
      ]),
    ),
  );
  const waves: {
    date: string;
    quantities: Map<string, number>;
    spec?: OrderWaveSpec | undefined;
  }[] = [];
  const firstWave = new Map<string, number>();
  for (const line of lines) {
    const reservedAtConfirm = Math.max(
      0,
      quantityToMilli(line.orderedQuantity) - (shortages.get(line.lineNumber - 1) ?? 0) * 1000,
    );
    if (reservedAtConfirm > 0) firstWave.set(line.id, reservedAtConfirm);
  }
  if (firstWave.size > 0) waves.push({ date: firstShipDate, quantities: firstWave });
  if (shortages.size > 0) {
    const secondWave = new Map<string, number>();
    for (const [position, backordered] of shortages) {
      const line = lines[position] as SalesOrderLine;
      secondWave.set(line.id, backordered * 1000);
    }
    waves.push({
      date: nextBusinessDayOnOrAfter(addDays(shortageResolvesOn, random.int(0, 2))),
      quantities: secondWave,
    });
  }
  if (override?.waves) {
    waves.length = 0;
    for (const spec of override.waves) {
      const quantities = new Map<string, number>();
      for (const [lineIndex, qty] of Object.entries(spec.quantities)) {
        const line = lines[Number(lineIndex)];
        if (line) quantities.set(line.id, quantityToMilli(qty));
      }
      waves.push({ date: addDays(today, -spec.daysAgo), quantities, spec });
    }
  }
  // Optional split of the first wave across two shipments for larger orders.
  const splitCount = override?.waves
    ? 1
    : (override?.shipmentCount ?? (lines.length >= 6 && random.chance(0.18) ? 2 : 1));
  if (splitCount > 1 && waves[0]) {
    const original = waves[0];
    const entries = [...original.quantities.entries()];
    const partSize = Math.ceil(entries.length / splitCount);
    const parts: { date: string; quantities: Map<string, number> }[] = [];
    for (let part = 0; part < splitCount; part += 1) {
      const slice = entries.slice(part * partSize, (part + 1) * partSize);
      if (slice.length === 0) continue;
      parts.push({
        date:
          part === 0
            ? original.date
            : nextBusinessDayOnOrAfter(addDays(original.date, random.int(1, 4))),
        quantities: new Map(slice),
      });
    }
    waves.splice(0, 1, ...parts);
  }

  if (cancelLater) {
    // Cancelled after confirmation but before any shipment.
    const cancelledAt = addMs(confirmedAt as string, random.int(2, 96) * 3_600_000);
    order.status = 'cancelled';
    order.cancelledAt = cancelledAt;
    order.cancellationReason = random.pick(CANCELLATION_REASONS);
    for (const line of lines) {
      line.cancelledQuantity = line.orderedQuantity;
      line.reservedQuantity = '0';
    }
    for (const reservation of graph.reservations) reservation.status = 'released';
    if (graph.approval) graph.approval.status = 'approved';
    order.metadata.version = version + 1;
    order.metadata.updatedAt = cancelledAt;
    return graph;
  }

  const warehouseActors = env.warehouseActors.get(skeleton.warehouseId) ?? [
    env.tenant.personaUserIds.get('jordan-wells') as string,
  ];
  const carrierSpec = random.pick(customer.regionCode === 'BR' ? BR_CARRIERS : CARRIERS);
  const invoiceableWaves: {
    shipment: Shipment;
    shipmentLines: ShipmentLine[];
    spec: OrderWaveSpec | undefined;
  }[] = [];
  let docCounter = 0;
  const fulfilledMilli = new Map<string, number>();

  for (const wave of waves) {
    docCounter += 1;
    const shipmentId = formatId('shipment', index * DOC_BLOCK + docCounter);
    const shipDate = wave.date;
    const shipDateInstant = instantOn(shipDate, random, 9, 16);
    const daysSinceShip = diffDays(today, shipDate);
    const actor = random.pick(warehouseActors);
    let shipmentStatus: Shipment['status'];
    let shippedAt: string | undefined;
    let deliveredAt: string | undefined;
    const transitDays = random.int(1, 5);
    const createdDate = addDays(shipDate, -random.int(0, 1));
    const createdAtShipment =
      compareDates(createdDate, today) <= 0 ? instantOn(createdDate, random, 7, 15) : undefined;
    if (createdAtShipment === undefined) continue; // Not created yet.
    if (daysSinceShip < 0) {
      shipmentStatus = random.pick(['pending', 'pending', 'picking', 'packed']);
    } else if (daysSinceShip === 0) {
      shipmentStatus = random.weighted([
        { value: 'picking', weight: 25 },
        { value: 'packed', weight: 20 },
        { value: 'ready_to_ship', weight: 20 },
        { value: 'shipped', weight: 35 },
      ]);
      if (shipmentStatus === 'shipped') shippedAt = shipDateInstant;
    } else if (daysSinceShip <= transitDays) {
      shipmentStatus = daysSinceShip === 1 && random.chance(0.4) ? 'shipped' : 'in_transit';
      shippedAt = shipDateInstant;
    } else {
      shipmentStatus = 'delivered';
      shippedAt = shipDateInstant;
      deliveredAt = instantOn(addDays(shipDate, transitDays), random, 8, 17);
    }
    const waveStatus =
      wave.spec?.status ?? (docCounter === 1 ? override?.shipmentStatus : undefined);
    if (waveStatus) {
      shipmentStatus = waveStatus;
      if (
        shipmentStatus === 'in_transit' ||
        shipmentStatus === 'shipped' ||
        shipmentStatus === 'exception'
      ) {
        shippedAt = shipDateInstant;
        deliveredAt = undefined;
      } else if (shipmentStatus === 'delivered') {
        shippedAt = shipDateInstant;
        deliveredAt = deliveredAt ?? instantOn(addDays(shipDate, transitDays), random, 8, 17);
      } else {
        shippedAt = undefined;
        deliveredAt = undefined;
      }
    }
    const exception =
      wave.spec?.exception ||
      (override?.exception && docCounter === 1) ||
      (shippedAt && !deliveredAt && random.chance(0.03));
    if (exception && shippedAt) shipmentStatus = 'exception';
    const shipment: Shipment = {
      id: shipmentId,
      organizationId: ORGANIZATION_ID,
      shipmentNumber:
        wave.spec?.shipmentNumber ??
        (override?.shipmentNumber && docCounter === 1 ? override.shipmentNumber : ''),
      orderId: id,
      customerId: customer.id,
      warehouseId: skeleton.warehouseId,
      carrier: carrierSpec.carrier,
      service: random.pick(carrierSpec.services),
      status: shipmentStatus,
      estimatedDeliveryDate: addDays(shipDate, transitDays),
      metadata: metadataAt(
        createdAtShipment,
        actor,
        deliveredAt ?? shippedAt ?? createdAtShipment,
        actor,
        deliveredAt ? 6 : shippedAt ? 5 : shipmentStatus === 'pending' ? 1 : 3,
      ),
      ...(shippedAt
        ? { shippedAt, trackingNumber: `1Z${random.letters(3)}${random.digits(12)}` }
        : {}),
      ...(deliveredAt ? { deliveredAt } : {}),
    };
    if (exception) {
      const detail = random.pick(SHIPMENT_EXCEPTIONS_LONG);
      shipment.exceptionCode = detail.code;
      shipment.exceptionMessage = detail.message;
    }
    graph.shipments.push(shipment);
    const shipmentLines: ShipmentLine[] = [];
    let lineCounter = 0;
    for (const [orderLineId, milli] of wave.quantities) {
      lineCounter += 1;
      const line = lineById.get(orderLineId) as SalesOrderLine;
      const reservations = (reservationsByLine.get(orderLineId) ?? []).filter(
        (reservation) => reservation.status === 'active',
      );
      const shipmentLine: ShipmentLine = {
        id: formatId(
          'shipmentLine',
          index * DOC_BLOCK * LINE_BLOCK + (docCounter - 1) * LINE_BLOCK + lineCounter,
        ),
        organizationId: ORGANIZATION_ID,
        shipmentId,
        orderLineId,
        skuId: line.skuId,
        quantity: milliToQuantity(milli),
        reservationIds: reservations.map((reservation) => reservation.id),
        pickedQuantity: shipmentStatus === 'pending' ? '0' : milliToQuantity(milli),
        packedQuantity:
          shipmentStatus === 'pending' || shipmentStatus === 'picking'
            ? '0'
            : milliToQuantity(milli),
      };
      shipmentLines.push(shipmentLine);
      if (shippedAt) {
        // Consume reservations and reduce on-hand.
        let remaining = milli;
        for (const reservation of reservations) {
          const available =
            quantityToMilli(reservation.quantity) - quantityToMilli(reservation.consumedQuantity);
          const consume = Math.min(available, remaining);
          if (consume <= 0) continue;
          reservation.consumedQuantity = milliToQuantity(
            quantityToMilli(reservation.consumedQuantity) + consume,
          );
          if (
            quantityToMilli(reservation.consumedQuantity) >= quantityToMilli(reservation.quantity)
          )
            reservation.status = 'consumed';
          remaining -= consume;
        }
        graph.movements.push({
          id: formatId(
            'stockMovement',
            index * DOC_BLOCK * LINE_BLOCK + (docCounter - 1) * LINE_BLOCK + lineCounter,
          ),
          organizationId: ORGANIZATION_ID,
          type: 'shipment',
          skuId: line.skuId,
          warehouseId: skeleton.warehouseId,
          onHandDelta: milliToQuantity(-milli),
          damagedDelta: '0',
          quarantineDelta: '0',
          sourceEntityType: 'shipment',
          sourceEntityId: shipmentId,
          occurredAt: shippedAt,
          actorId: actor,
        });
        fulfilledMilli.set(orderLineId, (fulfilledMilli.get(orderLineId) ?? 0) + milli);
      }
    }
    graph.shipmentLines.push(...shipmentLines);
    if (shippedAt) invoiceableWaves.push({ shipment, shipmentLines, spec: wave.spec });
    lastUpdatedAt = shipment.metadata.updatedAt;
    version += 1;
  }

  for (const line of lines) {
    const fulfilled = fulfilledMilli.get(line.id) ?? 0;
    line.fulfilledQuantity = milliToQuantity(fulfilled);
    let reservedRemaining = 0;
    for (const reservation of reservationsByLine.get(line.id) ?? []) {
      if (reservation.status === 'active')
        reservedRemaining +=
          quantityToMilli(reservation.quantity) - quantityToMilli(reservation.consumedQuantity);
    }
    line.reservedQuantity = milliToQuantity(reservedRemaining);
  }

  // Invoices per shipped wave (section 66.4), freight on the first.
  let invoiceCounter = 0;
  for (const [waveIndex, wave] of invoiceableWaves.entries()) {
    invoiceCounter += 1;
    const invoiceId = formatId('invoice', index * DOC_BLOCK + invoiceCounter);
    const issueDate = businessDateOf(wave.shipment.shippedAt as string);
    const issuedAt = addMs(wave.shipment.shippedAt as string, random.int(20, 240) * 60_000);
    const invoiceLines: InvoiceLine[] = wave.shipmentLines.map((shipmentLine, position) => {
      const line = lineById.get(shipmentLine.orderLineId) as SalesOrderLine;
      const priced = priceLine({
        quantity: shipmentLine.quantity,
        listUnitPrice: line.listUnitPrice,
        discountBps: line.discountBps,
        taxRateBps: line.taxRateBps,
        unitCost: line.unitCost,
      });
      line.invoicedQuantity = milliToQuantity(
        quantityToMilli(line.invoicedQuantity) + quantityToMilli(shipmentLine.quantity),
      );
      return {
        id: formatId(
          'invoiceLine',
          index * DOC_BLOCK * LINE_BLOCK + (invoiceCounter - 1) * LINE_BLOCK + position + 1,
        ),
        organizationId: ORGANIZATION_ID,
        invoiceId,
        lineNumber: position + 1,
        orderLineId: line.id,
        shipmentLineId: shipmentLine.id,
        skuId: line.skuId,
        description: line.description,
        quantity: shipmentLine.quantity,
        unitPrice: line.listUnitPrice,
        discountBps: line.discountBps,
        taxRateBps: line.taxRateBps,
        netAmount: priced.netAmount,
        taxAmount: priced.taxAmount,
        totalAmount: priced.totalAmount,
        unitCostSnapshot: line.unitCost,
      };
    });
    const invoiceFreight = waveIndex === 0 ? freight : cash(0);
    const subtotal = cash(invoiceLines.reduce((sum, line) => sum + line.netAmount.minor, 0));
    const taxTotal = cash(invoiceLines.reduce((sum, line) => sum + line.taxAmount.minor, 0));
    const total = cash(subtotal.minor + taxTotal.minor + invoiceFreight.minor);
    const costTotal = cash(
      invoiceLines.reduce(
        (sum, line) =>
          sum +
          roundHalfUp(
            ((line.unitCostSnapshot as Money).minor * quantityToMilli(line.quantity)) / 1000,
          ),
        0,
      ),
    );
    const dueDate = dueDateFor(issueDate, customer.paymentTermsCode);
    const invoice: Invoice = {
      id: invoiceId,
      organizationId: ORGANIZATION_ID,
      invoiceNumber:
        wave.spec?.invoiceNumber ??
        (override?.invoiceNumber && invoiceCounter === 1 ? override.invoiceNumber : ''),
      customerId: customer.id,
      sourceOrderId: id,
      issueDate,
      dueDate,
      currency,
      fxRateToUsd,
      lifecycle: 'open',
      collectionState: 'current',
      settlement: 'unpaid',
      paidAmount: cash(0),
      outstanding: total,
      billingAddress: order.billingAddress,
      paymentTermsCode: customer.paymentTermsCode,
      subtotal,
      taxTotal,
      freight: invoiceFreight,
      total,
      costTotal,
      writtenOffAmount: cash(0),
      sentAt: addMs(issuedAt, random.int(5, 120) * 60_000),
      openedAt: issuedAt,
      metadata: metadataAt(
        issuedAt,
        random.pick(env.financeActors),
        issuedAt,
        random.pick(env.financeActors),
        2,
      ),
      ...(contact ? { billingContactId: contact.id } : {}),
      ...(order.customerPoNumber ? { customerPoNumber: order.customerPoNumber } : {}),
    };
    graph.invoices.push(invoice);
    graph.invoiceLines.push(...invoiceLines);

    // Payment behaviour
    const suppressPayment = wave.spec?.noPayment || (override?.noPayment && invoiceCounter === 1);
    const delay = paymentDelayDays(random, customer, override?.paymentDelayDays);
    let paidDate = addDays(dueDate, delay);
    if (compareDates(paidDate, addDays(issueDate, 1)) < 0)
      paidDate = addDays(issueDate, random.int(1, 5));
    const overdueDays =
      wave.spec?.invoiceOverdueDays ??
      (invoiceCounter === 1 ? override?.invoiceOverdueDays : undefined);
    if (overdueDays !== undefined) {
      invoice.dueDate = addDays(today, -overdueDays);
      paidDate = addDays(today, 30);
    }
    const partial =
      wave.spec?.partialPayment ||
      (override?.partialPayment && invoiceCounter === 1) ||
      random.chance(0.06);
    if (!suppressPayment && compareDates(paidDate, today) <= 0 && weekdayOf(paidDate) !== 0) {
      const paymentDate = nextBusinessDayOnOrAfter(paidDate);
      const paymentAmount = partial
        ? roundHalfUp(total.minor * random.float(0.3, 0.7))
        : total.minor;
      const paymentId = formatId('payment', index * DOC_BLOCK + invoiceCounter);
      const postedAt = instantOn(paymentDate, random, 8, 16);
      const recordedBy = random.pick(env.financeActors);
      const payment: Payment = {
        id: paymentId,
        organizationId: ORGANIZATION_ID,
        paymentNumber: '',
        customerId: customer.id,
        amount: cash(paymentAmount),
        fxRateToUsd,
        method: paymentMethod(random, customer),
        receivedDate: paymentDate,
        reference: `${random.pick(['ACH', 'WIRE', 'CHK', 'CC'])}-${random.digits(8)}`,
        status: 'posted',
        recordedBy,
        unappliedAmount: cash(0),
        metadata: metadataAt(postedAt, recordedBy, postedAt, recordedBy, 2),
      };
      graph.payments.push(payment);
      graph.allocations.push({
        id: formatId('paymentAllocation', index * DOC_BLOCK + invoiceCounter),
        organizationId: ORGANIZATION_ID,
        paymentId,
        invoiceId,
        amount: cash(paymentAmount),
        status: 'active',
        createdAt: postedAt,
      });
      invoice.paidAmount = cash(paymentAmount);
      invoice.outstanding = cash(total.minor - paymentAmount);
      invoice.settlement = paymentAmount >= total.minor ? 'paid' : 'partially_paid';
      invoice.metadata.updatedAt = postedAt;
      invoice.metadata.version = 3;
      lastUpdatedAt = postedAt;
    }
    if (override?.invoiceOutstandingMinor !== undefined && invoiceCounter === 1) {
      invoice.outstanding = cash(override.invoiceOutstandingMinor);
      invoice.paidAmount = cash(total.minor - override.invoiceOutstandingMinor);
      invoice.settlement =
        override.invoiceOutstandingMinor === 0
          ? 'paid'
          : override.invoiceOutstandingMinor >= total.minor
            ? 'unpaid'
            : 'partially_paid';
    }
    if (invoice.outstanding.minor > 0 && compareDates(invoice.dueDate, today) < 0)
      invoice.collectionState = 'overdue';
    if (invoice.lifecycle === 'open' && invoice.outstanding.minor > 0 && random.chance(0.012)) {
      invoice.collectionState = 'disputed';
      invoice.disputeReason = random.pick([
        'Customer disputes freight charge',
        'Quantity received differs from invoice',
        'Pricing does not match quote',
        'Duplicate of prior invoice claimed',
      ]);
    }
    version += 1;
  }

  // Returns (section 64) for delivered orders.
  const delivered = graph.shipments.filter((shipment) => shipment.status === 'delivered');
  if (delivered.length > 0 && (override?.returnRequested || random.chance(0.04))) {
    const source = delivered[0] as Shipment;
    const requestedDate = addDays(businessDateOf(source.deliveredAt as string), random.int(2, 18));
    if (compareDates(requestedDate, today) <= 0) {
      const requestedAt = instantOn(requestedDate, random);
      const returnId = formatId('return', index + 1);
      const daysSince = diffDays(today, requestedDate);
      const stages: Return['status'][] = [
        'requested',
        'authorized',
        'in_transit',
        'received',
        'inspected',
        'completed',
      ];
      const stage = Math.min(
        stages.length - 1,
        Math.floor(daysSince / 3) + (random.chance(0.3) ? 1 : 0),
      );
      const returnStatus = random.chance(0.05) ? 'rejected' : (stages[stage] as Return['status']);
      const returnedLines = graph.shipmentLines
        .filter((line) => line.shipmentId === source.id)
        .slice(0, random.int(1, 2));
      const ret: Return = {
        id: returnId,
        organizationId: ORGANIZATION_ID,
        returnNumber: '',
        orderId: id,
        customerId: customer.id,
        status: returnStatus,
        requestedAt,
        receivingWarehouseId: skeleton.warehouseId,
        metadata: metadataAt(requestedAt, ownerId, requestedAt, ownerId, 1),
      };
      // A stage three days apart, never after today: the random step ahead may reach a stage
      // whose third day has not come yet, and its stamp then falls on today.
      const stampAt = (stageIndex: number): string =>
        instantOn(addDays(requestedDate, Math.min(stageIndex * 3, daysSince)), random);
      if (stage >= 1 && returnStatus !== 'rejected') ret.authorizedAt = stampAt(1);
      if (stage >= 3 && returnStatus !== 'rejected') ret.receivedAt = stampAt(3);
      if (stage >= 4 && returnStatus !== 'rejected') ret.inspectedAt = stampAt(4);
      if (stage >= 5 && returnStatus !== 'rejected') ret.completedAt = stampAt(5);
      ret.metadata.version = 1 + stage;
      ret.metadata.updatedAt =
        ret.completedAt ?? ret.inspectedAt ?? ret.receivedAt ?? ret.authorizedAt ?? requestedAt;
      graph.returns.push(ret);
      let creditMinor = 0;
      let creditTax = 0;
      for (const [position, shipmentLine] of returnedLines.entries()) {
        const line = lineById.get(shipmentLine.orderLineId) as SalesOrderLine;
        const requestedQty = Math.max(
          1,
          Math.floor((quantityToMilli(shipmentLine.quantity) / 1000) * random.float(0.2, 1)),
        );
        const received = stage >= 3 && returnStatus !== 'rejected' ? requestedQty : 0;
        const accepted =
          stage >= 4 && returnStatus !== 'rejected'
            ? random.chance(0.85)
              ? received
              : Math.max(0, received - 1)
            : 0;
        const disposition: ReturnLine['disposition'] | undefined =
          stage >= 4 && returnStatus !== 'rejected'
            ? random.weighted([
                { value: 'restock', weight: 55 },
                { value: 'quarantine', weight: 20 },
                { value: 'scrap', weight: 15 },
                { value: 'return_to_supplier', weight: 10 },
              ])
            : undefined;
        const unitCredit = line.unitPrice;
        graph.returnLines.push({
          id: formatId('returnLine', index * LINE_BLOCK + position + 1),
          organizationId: ORGANIZATION_ID,
          returnId,
          orderLineId: line.id,
          shipmentLineId: shipmentLine.id,
          skuId: line.skuId,
          requestedQuantity: quantity(requestedQty),
          receivedQuantity: quantity(received),
          acceptedQuantity: quantity(accepted),
          rejectedQuantity: quantity(Math.max(0, received - accepted)),
          reason: random.weighted([
            { value: 'damaged', weight: 22 },
            { value: 'wrong_item', weight: 18 },
            { value: 'defective', weight: 20 },
            { value: 'not_needed', weight: 20 },
            { value: 'shipment_damage', weight: 10 },
            { value: 'quality_issue', weight: 7 },
            { value: 'other', weight: 3 },
          ]),
          unitCreditAmount: unitCredit,
          ...(disposition ? { disposition } : {}),
        });
        if (accepted > 0) {
          line.returnedQuantity = milliToQuantity(
            quantityToMilli(line.returnedQuantity) + accepted * 1000,
          );
          creditMinor += unitCredit.minor * accepted;
          creditTax += roundHalfUp(unitCredit.minor * accepted * (line.taxRateBps / 10_000));
          if (
            disposition === 'restock' ||
            disposition === 'quarantine' ||
            disposition === 'return_to_supplier'
          ) {
            graph.movements.push({
              id: formatId(
                'stockMovement',
                index * DOC_BLOCK * LINE_BLOCK + 3 * LINE_BLOCK + position + 1,
              ),
              organizationId: ORGANIZATION_ID,
              type: 'customer_return',
              skuId: line.skuId,
              warehouseId: skeleton.warehouseId,
              onHandDelta: quantity(accepted),
              damagedDelta: '0',
              quarantineDelta: disposition === 'restock' ? '0' : quantity(accepted),
              sourceEntityType: 'return',
              sourceEntityId: returnId,
              occurredAt: ret.inspectedAt as string,
              actorId: random.pick(warehouseActors),
            });
          }
        }
      }
      if (stage >= 5 && creditMinor > 0 && returnStatus === 'completed') {
        const creditMemoId = formatId('creditMemo', index + 1);
        const issuedAt = ret.completedAt as string;
        const invoice = graph.invoices[0];
        const total = cash(creditMinor + creditTax);
        const applyTo =
          invoice && invoice.outstanding.minor > 0
            ? Math.min(invoice.outstanding.minor, total.minor)
            : 0;
        const creditMemo: CreditMemo = {
          id: creditMemoId,
          organizationId: ORGANIZATION_ID,
          creditMemoNumber: '',
          customerId: customer.id,
          sourceReturnId: returnId,
          reason: 'return',
          issueDate: businessDateOf(issuedAt),
          currency,
          lifecycle: applyTo >= total.minor ? 'fully_applied' : 'open',
          subtotal: cash(creditMinor),
          taxTotal: cash(creditTax),
          total,
          appliedAmount: cash(applyTo),
          unappliedAmount: cash(total.minor - applyTo),
          metadata: metadataAt(
            issuedAt,
            random.pick(env.financeActors),
            issuedAt,
            random.pick(env.financeActors),
            2,
          ),
          ...(invoice ? { sourceInvoiceId: invoice.id } : {}),
        };
        graph.creditMemos.push(creditMemo);
        graph.creditMemoLines.push({
          id: formatId('creditMemoLine', index + 1),
          organizationId: ORGANIZATION_ID,
          creditMemoId,
          returnLineId: graph.returnLines[0]?.id ?? '',
          description: `Return credit for ${ret.returnNumber || 'RMA'}`,
          amount: cash(creditMinor),
          taxAmount: cash(creditTax),
        });
        ret.creditMemoId = creditMemoId;
        if (invoice && applyTo > 0) {
          graph.creditMemoApplications.push({
            id: formatId('creditMemoApplication', index + 1),
            organizationId: ORGANIZATION_ID,
            creditMemoId,
            invoiceId: invoice.id,
            amount: cash(applyTo),
            status: 'active',
            createdAt: issuedAt,
          });
          invoice.paidAmount = cash(invoice.paidAmount.minor + applyTo);
          invoice.outstanding = cash(invoice.outstanding.minor - applyTo);
          invoice.settlement = invoice.outstanding.minor === 0 ? 'paid' : 'partially_paid';
          if (invoice.outstanding.minor === 0) invoice.collectionState = 'current';
        }
      }
    }
  }

  // Derived order dimensions (section 59.1)
  order.allocationStatus = allocationStatusOf(lines);
  order.fulfillmentStatus = fulfillmentStatusOf(lines);
  order.invoiceStatus = invoiceStatusOf(lines);
  order.paymentStatus = paymentStatusOf(graph.invoices);
  if (order.fulfillmentStatus === 'partially_fulfilled' || order.allocationStatus !== 'allocated') {
    if (
      lines.some(
        (line) =>
          quantityToMilli(line.orderedQuantity) -
            quantityToMilli(line.cancelledQuantity) -
            quantityToMilli(line.fulfilledQuantity) -
            quantityToMilli(line.reservedQuantity) >
          0,
      )
    ) {
      order.riskFlags.push('inventory_shortage');
      if (order.requestedDeliveryDate && compareDates(order.requestedDeliveryDate, today) < 0)
        order.riskFlags.push('requested_date_at_risk');
    }
  }
  const allDone =
    (order.fulfillmentStatus === 'fulfilled' ||
      order.fulfillmentStatus === 'returned' ||
      order.fulfillmentStatus === 'partially_returned') &&
    order.invoiceStatus === 'invoiced' &&
    (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded');
  if (allDone) {
    order.status = 'closed';
    order.closedAt = lastUpdatedAt;
  }
  order.metadata.version = version;
  order.metadata.updatedAt = lastUpdatedAt;
  order.metadata.updatedBy =
    graph.payments.length > 0
      ? (graph.payments[graph.payments.length - 1] as Payment).recordedBy
      : graph.shipments.length > 0
        ? (graph.shipments[graph.shipments.length - 1] as Shipment).metadata.updatedBy
        : ownerId;
  return graph;
}

export function graphRecordCount(graph: OrderGraph): number {
  return (
    1 +
    graph.lines.length +
    (graph.quote ? 1 : 0) +
    graph.quoteLines.length +
    (graph.approval ? 1 : 0) +
    graph.reservations.length +
    graph.shipments.length +
    graph.shipmentLines.length +
    graph.movements.length +
    graph.invoices.length +
    graph.invoiceLines.length +
    graph.payments.length +
    graph.allocations.length +
    graph.returns.length +
    graph.returnLines.length +
    graph.creditMemos.length +
    graph.creditMemoLines.length +
    graph.creditMemoApplications.length
  );
}

export {
  instantMs,
  nextBusinessDayOnOrAfter,
  instantOn,
  metadataAt,
  allocationStatusOf,
  fulfillmentStatusOf,
  invoiceStatusOf,
  paymentStatusOf,
};
