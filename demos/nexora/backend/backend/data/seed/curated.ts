import {
  ORGANIZATION_ID,
  addDays,
  addMs,
  compareDates,
  diffDays,
  formatId,
  FX_RATES_TO_USD,
  money,
  usd,
  type ContractPrice,
  type Customer,
  type CustomerNote,
  type Invoice,
  type Payment,
  type PaymentAllocation,
} from '../../domain';
import type { CatalogSeedResult } from './catalog';
import type { SeedContext } from './context';
import type { CustomerSeedResult } from './customers';
import {
  instantOn,
  metadataAt,
  nextBusinessDayOnOrAfter,
  type OrderOverride,
  type OrderSkeleton,
} from './orders';
import type { ExtraPurchaseOrder } from './procurement';
import type { TicketOverride } from './support';
import type { TenantSeedResult } from './tenant';
import { warehouseForRegion } from './timeline';

/** Section 76 — the mandatory Meridian Controls Group narrative. */
export const MERIDIAN = {
  accountNumber: 'CUS-010428',
  orderNumber: 'SO-2026-01842',
  orderTotalMinor: 8_642_000,
  shipmentNumber: 'SHP-009841',
  invoiceNumber: 'INV-2026-02891',
  invoiceOutstandingMinor: 4_186_000,
  invoiceOverdueDays: 14,
  ticketNumber: 'TCK-10492',
  grossReceivablesTargetMinor: 28_493_000,
  ordersPerYear: 187,
  mx240ListPriceMinor: 214_000,
  mx240ContractPriceMinor: 198_400,
  backorderedUnits: 6,
} as const;

export const RESERVED_NUMBERS = new Set<string>([
  MERIDIAN.orderNumber,
  MERIDIAN.shipmentNumber,
  MERIDIAN.invoiceNumber,
  MERIDIAN.ticketNumber,
]);

/** Adjusts master data before transactions are generated. */
export function curateMasterData(
  context: SeedContext,
  tenant: TenantSeedResult,
  catalog: CatalogSeedResult,
  customers: CustomerSeedResult,
): void {
  const { dataset, today } = context;
  const meridianId = customers.flagshipCustomerIds.get('meridian') as string;
  const meridian = dataset.customers.get(meridianId) as Customer;
  meridian.taxProfile = {
    type: 'exempt',
    exemptionReason: 'Manufacturing exemption certificate on file (IL ST-587)',
  };
  meridian.paymentTermsCode = 'NET_45';

  // MX-240 pricing: list price and Meridian's contract price.
  const mx240 = catalog.flagshipSkuIds.get('Servo Motor MX-240') as string;
  const standardListId = tenant.priceListIdsByName.get('Standard') as string;
  for (const [listName, listId] of tenant.priceListIdsByName) {
    const entry = catalog.entriesByList.get(listId)?.get(mx240);
    if (!entry) continue;
    const factor =
      listName === 'Standard' || listName === 'Brazil Standard'
        ? 1
        : listName === 'SMB'
          ? 1.04
          : listName === 'Enterprise'
            ? 0.94
            : listName === 'Strategic Accounts'
              ? 0.89
              : listName === 'Brazil Distributor'
                ? 0.88
                : 0.85;
    // Brazil lists keep the landed-price rule of the catalog seed (USD list / FX × 1.15).
    const landed = entry.unitPrice.currency === 'BRL' ? 1.15 / Number(FX_RATES_TO_USD.BRL) : 1;
    entry.unitPrice = money(
      Math.round((MERIDIAN.mx240ListPriceMinor * factor * landed) / 100) * 100,
      entry.unitPrice.currency,
    );
  }
  void standardListId;
  const existing = [...dataset.contractPrices.values()].find(
    (price) => price.customerId === meridianId && price.skuId === mx240,
  );
  const validFrom = addDays(today, -200);
  if (existing) {
    existing.unitPrice = usd(MERIDIAN.mx240ContractPriceMinor);
    existing.validFrom = validFrom;
    existing.validTo = addDays(validFrom, 365);
  } else {
    const price: ContractPrice = {
      id: formatId('contractPrice', dataset.contractPrices.size + 1),
      organizationId: ORGANIZATION_ID,
      customerId: meridianId,
      skuId: mx240,
      currency: 'USD',
      unitPrice: usd(MERIDIAN.mx240ContractPriceMinor),
      validFrom,
      validTo: addDays(validFrom, 365),
      metadata: metadataAt(
        instantOn(validFrom, context.random('curated/contract')),
        meridian.accountOwnerId,
      ),
    };
    price.metadata.id = price.id;
    dataset.contractPrices.set(price.id, price);
  }

  // Meridian's order weight: about 187 orders per year (section 22.1).
  const share = MERIDIAN.ordersPerYear / context.scale.ordersPerYear;
  const others = customers.orderWeightedCustomerIds.filter((id) => id !== meridianId);
  const copies = Math.max(1, Math.round((share * others.length) / (1 - share)));
  customers.orderWeightedCustomerIds.length = 0;
  customers.orderWeightedCustomerIds.push(...others);
  for (let index = 0; index < copies; index += 1)
    customers.orderWeightedCustomerIds.push(meridianId);

  // Narrative notes.
  const priya = tenant.personaUserIds.get('priya-shah') as string;
  const noah = tenant.personaUserIds.get('noah-bennett') as string;
  const notes: [string, string, CustomerNote['visibility'], number][] = [
    [
      priya,
      `Collections call with Meridian AP (Dana Whitfield) regarding ${MERIDIAN.invoiceNumber}: they are disputing nothing, the payment run was pushed to next Friday because of their ERP cutover. Holding credit at $500k; no new hold for now.`,
      'organization',
      2,
    ],
    [
      noah,
      'Renewal discussion scheduled for the first week of October. Prepare contract pricing on the top 20 SKUs and the OTD summary — the MX-240 backorder will come up.',
      'organization',
      5,
    ],
    [
      noah,
      'Plant 2 in Naperville is adding a second packaging line in Q1; expect 15–20% more MX-240 and VX-7 volume.',
      'team',
      19,
    ],
    [
      priya,
      'Credit review: exposure is within limit but the overdue invoice keeps the account at risk until it clears.',
      'private',
      1,
    ],
  ];
  const random = context.random('curated/notes');
  for (const [index, [authorId, body, visibility, daysAgo]] of notes.entries()) {
    const createdAt = instantOn(addDays(today, -daysAgo), random);
    const note: CustomerNote = {
      id: formatId('customerNote', 900_000 + index + 1),
      organizationId: ORGANIZATION_ID,
      customerId: meridianId,
      authorId,
      body,
      visibility,
      isPinned: index === 0,
      mentionedUserIds: index === 0 ? [noah] : [],
      attachmentIds: [],
      metadata: metadataAt(createdAt, authorId),
      ...(visibility === 'team' ? { teamId: meridian.salesTeamId } : {}),
    };
    note.metadata.id = note.id;
    dataset.customerNotes.set(note.id, note);
  }
}

export interface CurationResult {
  overrides: Map<number, OrderOverride>;
  /** -1 where the tenant holds no order old enough for the narrative. */
  meridianOrderIndex: number;
  fixtureIndexes: Map<string, number>;
}

/** Chooses order indexes for the narrative and the section 82 edge cases. */
export function curateOrders(
  context: SeedContext,
  tenant: TenantSeedResult,
  catalog: CatalogSeedResult,
  customers: CustomerSeedResult,
  skeletons: OrderSkeleton[],
): CurationResult {
  const { today, dataset } = context;
  const overrides = new Map<number, OrderOverride>();
  const fixtureIndexes = new Map<string, number>();
  const used = new Set<number>();
  const meridianId = customers.flagshipCustomerIds.get('meridian') as string;
  const chi = tenant.warehouseIdsByCode.get('CHI-01') ?? skeletons[0]?.warehouseId ?? '';

  const pick = (
    daysAgo: number,
    predicate: (skeleton: OrderSkeleton) => boolean = () => true,
  ): OrderSkeleton | undefined => {
    const date = addDays(today, -daysAgo);
    for (let delta = 0; delta <= 6; delta += 1) {
      for (const sign of [1, -1]) {
        const candidateDate = addDays(date, delta * sign);
        const found = skeletons.find(
          (skeleton) =>
            skeleton.orderDate === candidateDate &&
            !used.has(skeleton.index) &&
            skeleton.kind !== 'draft' &&
            predicate(skeleton),
        );
        if (found) {
          used.add(found.index);
          return found;
        }
      }
    }
    return undefined;
  };

  // Meridian orders: reassign the customer on all skeletons drawn for it, plus the narrative order.
  for (const skeleton of skeletons) {
    if (skeleton.customerId === meridianId) {
      skeleton.warehouseId = chi;
      overrides.set(skeleton.index, {
        targetMedianDollars: 14_500,
        paymentDelayDays: { mean: -6, spread: 4 },
      });
    }
  }
  const vx7 = catalog.flagshipSkuIds.get('Variable Frequency Drive VX-7') as string;
  const sr420 = catalog.flagshipSkuIds.get('Safety Relay SR-420') as string;
  const is18 = catalog.flagshipSkuIds.get('Inductive Sensor IS-18') as string;
  const ic900 = catalog.flagshipSkuIds.get('Industrial Controller IC-900') as string;
  const mx240 = catalog.flagshipSkuIds.get('Servo Motor MX-240') as string;
  // The narrative order is 61 days old: a tenant with less history (§77.2) has no order to hold it.
  const meridianOrder = pick(61);
  if (meridianOrder) {
    meridianOrder.customerId = meridianId;
    meridianOrder.warehouseId = chi;
    meridianOrder.kind = 'normal';
    overrides.set(meridianOrder.index, {
      orderNumber: MERIDIAN.orderNumber,
      kind: 'normal',
      customerPoNumber: 'MCG-77410',
      requestedDeliveryDate: addDays(today, -30),
      freightMinor: 168_000,
      paymentDelayDays: { mean: -6, spread: 4 },
      lineSpecs: [
        { skuId: vx7, quantity: '10', unitPriceMinor: 234_000, taxRateBps: 0 },
        { skuId: sr420, quantity: '40', unitPriceMinor: 31_200, taxRateBps: 0 },
        { skuId: is18, quantity: '50', unitPriceMinor: 8_600, taxRateBps: 0 },
        { skuId: ic900, quantity: '6', unitPriceMinor: 412_000, taxRateBps: 0 },
        {
          skuId: mx240,
          quantity: '10',
          unitPriceMinor: MERIDIAN.mx240ContractPriceMinor,
          taxRateBps: 0,
        },
      ],
      waves: [
        {
          daysAgo: 59,
          quantities: { 0: '10', 1: '40', 2: '50' },
          status: 'delivered',
          invoiceNumber: MERIDIAN.invoiceNumber,
          invoiceOverdueDays: MERIDIAN.invoiceOverdueDays,
          noPayment: true,
        },
        {
          daysAgo: 2,
          quantities: { 3: '6', 4: '4' },
          status: 'in_transit',
          shipmentNumber: MERIDIAN.shipmentNumber,
          noPayment: true,
        },
      ],
      backorder: { 4: String(MERIDIAN.backorderedUnits) },
    });
    fixtureIndexes.set('flagship.order.meridian', meridianOrder.index);
    fixtureIndexes.set('edge.order.partially_fulfilled', meridianOrder.index);
  }

  const assign = (
    key: string,
    daysAgo: number,
    override: OrderOverride,
    predicate?: (skeleton: OrderSkeleton) => boolean,
  ): void => {
    const skeleton = pick(daysAgo, predicate);
    if (!skeleton) return;
    if (override.kind) skeleton.kind = override.kind;
    else skeleton.kind = 'normal';
    overrides.set(skeleton.index, { ...(overrides.get(skeleton.index) ?? {}), ...override });
    fixtureIndexes.set(key, skeleton.index);
  };
  const notMeridian = (skeleton: OrderSkeleton): boolean => skeleton.customerId !== meridianId;
  const activeCustomer = (skeleton: OrderSkeleton): boolean =>
    notMeridian(skeleton) && dataset.customers.get(skeleton.customerId)?.status === 'active';

  assign('edge.order.single_line', 3, { lineCount: 1, kind: 'normal' }, activeCustomer);
  assign(
    'edge.order.large',
    6,
    { lineCount: 148, targetTotalMinor: 21_500_000, kind: 'normal', shipmentCount: 2 },
    activeCustomer,
  );
  assign(
    'edge.order.requires_sales_approval',
    1,
    { targetTotalMinor: 6_240_000, kind: 'pending_approval', discountBps: 0 },
    activeCustomer,
  );
  assign(
    'edge.order.requires_finance_approval',
    2,
    { targetTotalMinor: 3_180_000, marginTargetBps: 1_400, kind: 'pending_approval' },
    activeCustomer,
  );
  assign('edge.order.on_hold', 5, { kind: 'on_hold', targetTotalMinor: 4_400_000 }, activeCustomer);
  assign(
    'edge.order.partially_allocated',
    1,
    { lineCount: 4, kind: 'normal', backorder: { 1: '5' }, waves: [] },
    activeCustomer,
  );
  assign(
    'edge.order.three_shipments',
    14,
    { lineCount: 9, kind: 'normal', shipmentCount: 3 },
    activeCustomer,
  );
  assign(
    'edge.shipment.exception',
    5,
    { lineCount: 3, kind: 'normal', exception: true, shipmentStatus: 'exception' },
    activeCustomer,
  );
  assign('edge.conflict.stale_version', 4, { lineCount: 2, kind: 'normal' }, activeCustomer);
  assign(
    'edge.conflict.inventory_changed',
    2,
    { lineCount: 2, kind: 'normal', waves: [] },
    activeCustomer,
  );
  assign('edge.order.draft', 1, { lineCount: 3, kind: 'draft' }, activeCustomer);

  // Historical order referencing a discontinued SKU.
  const discontinued = [...dataset.skus.values()].find((sku) => sku.status === 'discontinued');
  if (discontinued) {
    assign(
      'edge.sku.discontinued_in_history',
      240,
      { skuIds: [discontinued.id], lineCount: 1, kind: 'normal' },
      notMeridian,
    );
    dataset.fixtures.set('edge.sku.discontinued', discontinued.id);
  }

  return { overrides, meridianOrderIndex: meridianOrder?.index ?? -1, fixtureIndexes };
}

/** Curated purchase orders (section 82 items 7, 18–20 and the MX-240 replenishment). */
export function curatedPurchaseOrders(
  context: SeedContext,
  tenant: TenantSeedResult,
  catalog: CatalogSeedResult,
): ExtraPurchaseOrder[] {
  const { dataset, today } = context;
  const chi = tenant.warehouseIdsByCode.get('CHI-01') as string;
  const mx240 = catalog.flagshipSkuIds.get('Servo Motor MX-240') as string;
  const promethean = [...dataset.suppliers.values()].find(
    (supplier) => supplier.displayName === 'Promethean Drives',
  )?.id;
  const anySku = (count: number): string[] => catalog.skuIds.slice(20, 20 + count);
  const extras: ExtraPurchaseOrder[] = [
    {
      createdDaysAgo: 12,
      supplierId: promethean ?? '',
      warehouseId: chi,
      skuIds: [mx240],
      quantities: [12],
      status: 'acknowledged',
      expectedDate: addDays(today, 5),
      notes: 'Expedite — Meridian backorder of 6 units pending.',
      fixtureKey: 'flagship.po.mx240_replenishment',
      receiptPlan: [{ fraction: 1, daysAfterExpected: 0 }],
    },
    {
      createdDaysAgo: 30,
      warehouseId: chi,
      skuIds: anySku(3),
      status: 'acknowledged',
      expectedDate: addDays(today, -9),
      delayed: true,
      receiptPlan: [{ fraction: 1, daysAfterExpected: 12 }],
      notes: 'Supplier reported a plant shutdown; revised date not confirmed.',
      fixtureKey: 'edge.po.delayed',
    },
    {
      createdDaysAgo: 25,
      skuIds: anySku(4),
      status: 'acknowledged',
      expectedDate: addDays(today, -6),
      receiptPlan: [
        { fraction: 0.55, daysAfterExpected: 0 },
        { fraction: 1, daysAfterExpected: 9 },
      ],
      fixtureKey: 'edge.po.partially_received',
    },
    {
      createdDaysAgo: 20,
      skuIds: anySku(2),
      status: 'acknowledged',
      expectedDate: addDays(today, -3),
      receiptPlan: [{ fraction: 1, daysAfterExpected: 0, damagedFraction: 0.15 }],
      notes: 'Two cartons crushed in transit; damaged units logged.',
      fixtureKey: 'edge.receipt.damaged',
    },
  ];
  return extras.filter((extra) => extra.supplierId !== '');
}

/** Curated tickets: the Meridian escalation and SLA edge cases. */
export function curatedTickets(
  context: SeedContext,
  customers: CustomerSeedResult,
  meridianOrderId: string,
  meridianShipmentId: string | undefined,
  mx240: string,
): TicketOverride[] {
  const meridianId = customers.flagshipCustomerIds.get('meridian') as string;
  const activeIds = [...context.dataset.customers.values()]
    .filter((customer) => customer.status === 'active' && customer.id !== meridianId)
    .map((customer) => customer.id);
  const random = context.random('curated/tickets');
  return [
    {
      customerId: meridianId,
      ticketNumber: MERIDIAN.ticketNumber,
      subject: `Shipment delay for ${MERIDIAN.orderNumber}`,
      description: `Our receiving team confirmed the second shipment is on the way, but we still show 6 × MX-240 open against ${MERIDIAN.orderNumber}. Line 4 at Plant 2 is scheduled to restart next Monday and we need a firm date for the remaining motors today.`,
      priority: 'high',
      status: 'escalated',
      category: 'shipping',
      relatedOrderId: meridianOrderId,
      relatedSkuId: mx240,
      createdDaysAgo: 4,
      assigneePersona: 'aisha-grant',
      messageCount: 7,
      escalationReason: 'Key account line-down risk; replenishment PO not yet received',
      tags: ['key-account', 'expedite'],
      breachFirstResponse: false,
      fixtureKey: 'flagship.ticket.meridian',
      ...(meridianShipmentId ? { relatedShipmentId: meridianShipmentId } : {}),
    },
    {
      customerId: random.pick(activeIds),
      priority: 'urgent',
      status: 'open',
      category: 'product',
      subject: 'Line down — VFD fault on VX-7 after firmware update',
      createdDaysAgo: 0,
      nearBreach: true,
      tags: ['line-down'],
      fixtureKey: 'edge.ticket.urgent_near_breach',
    },
    {
      customerId: random.pick(activeIds),
      priority: 'high',
      status: 'open',
      category: 'shipping',
      subject: 'Pallet delivered to wrong dock — still missing 3 cartons',
      createdDaysAgo: 3,
      breachFirstResponse: true,
      fixtureKey: 'edge.ticket.breached_high',
    },
    {
      customerId: random.pick(activeIds),
      priority: 'normal',
      status: 'pending_customer',
      category: 'billing',
      subject: 'Statement reconciliation for Q2 — multiple invoices',
      createdDaysAgo: 26,
      messageCount: 120,
      tags: ['reconciliation'],
      fixtureKey: 'edge.ticket.long_conversation',
    },
  ];
}

/**
 * Brings Meridian's gross receivables close to the narrative figure by posting
 * payments against its oldest open invoices, never touching the highlighted one.
 */
export function tuneMeridianReceivables(
  context: SeedContext,
  tenant: TenantSeedResult,
  customers: CustomerSeedResult,
): void {
  const { dataset, today } = context;
  const meridianId = customers.flagshipCustomerIds.get('meridian') as string;
  const open = [...dataset.invoices.values()]
    .filter(
      (invoice) =>
        invoice.customerId === meridianId &&
        invoice.lifecycle === 'open' &&
        invoice.outstanding.minor > 0,
    )
    .sort((a, b) => a.issueDate.localeCompare(b.issueDate));
  let outstanding = open.reduce((sum, invoice) => sum + invoice.outstanding.minor, 0);
  const finance = tenant.personaUserIds.get('priya-shah') as string;
  const random = context.random('curated/receivables');
  let counter = 0;
  let maxPaymentSequence = 0;
  for (const payment of dataset.payments.values())
    maxPaymentSequence = Math.max(maxPaymentSequence, Number(payment.paymentNumber.slice(4)) || 0);
  for (const invoice of open) {
    if (outstanding <= MERIDIAN.grossReceivablesTargetMinor) break;
    if (invoice.invoiceNumber === MERIDIAN.invoiceNumber) continue;
    if (diffDays(today, invoice.issueDate) < 3) continue;
    const amount = invoice.outstanding.minor;
    // Settle only invoices that keep the balance at or above the narrative figure.
    if (outstanding - amount < MERIDIAN.grossReceivablesTargetMinor) continue;
    const paymentDate = nextBusinessDayOnOrAfter(
      addDays(
        invoice.issueDate,
        Math.min(diffDays(today, invoice.issueDate) - 1, random.int(20, 40)),
      ),
    );
    if (compareDates(paymentDate, today) > 0) continue;
    counter += 1;
    const postedAt = instantOn(paymentDate, random, 9, 16);
    const payment: Payment = {
      id: formatId('payment', 95_000_000 + counter),
      organizationId: ORGANIZATION_ID,
      paymentNumber: `PAY-${String(maxPaymentSequence + counter).padStart(6, '0')}`,
      customerId: meridianId,
      amount: usd(amount),
      fxRateToUsd: '1.00000000',
      method: 'ach',
      receivedDate: paymentDate,
      reference: `ACH-${random.digits(8)}`,
      status: 'posted',
      recordedBy: finance,
      unappliedAmount: usd(0),
      metadata: metadataAt(postedAt, finance, postedAt, finance, 2),
    };
    dataset.payments.set(payment.id, payment);
    const allocation: PaymentAllocation = {
      id: formatId('paymentAllocation', 95_000_000 + counter),
      organizationId: ORGANIZATION_ID,
      paymentId: payment.id,
      invoiceId: invoice.id,
      amount: usd(amount),
      status: 'active',
      createdAt: postedAt,
    };
    dataset.paymentAllocations.set(allocation.id, allocation);
    invoice.paidAmount = usd(invoice.paidAmount.minor + amount);
    invoice.outstanding = usd(0);
    invoice.settlement = 'paid';
    invoice.collectionState = 'current';
    invoice.metadata.updatedAt = postedAt;
    invoice.metadata.version += 1;
    outstanding -= amount;
  }
  void addMs;
}

export function meridianInvoice(context: SeedContext): Invoice | undefined {
  return [...context.dataset.invoices.values()].find(
    (invoice) => invoice.invoiceNumber === MERIDIAN.invoiceNumber,
  );
}

export { warehouseForRegion };
