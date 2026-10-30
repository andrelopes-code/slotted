import { beforeAll, describe, expect, it } from 'vitest';
import { MERIDIAN } from '../data/seed/curated';
import {
  businessDateOf,
  evaluateConditions,
  NexoraApiError,
  type ConditionNode,
  type WorkflowAction,
} from '../domain';
import { createNexoraBackend, type NexoraApi } from './index';
import type { InventoryListItem, MovementListItem } from './resources/operations';
import { addMoney, compareDates, usdMinor, type Money } from '../domain';
import type { ListQuery, ListResponse } from './query';
import type { ReportAnswer, ReportDoor, ReportList, ReportValue } from './resources/reports';
import { Latency, Transaction } from './runtime';
import type { ScenarioId } from './scenarios';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let api: NexoraApi;

beforeAll(() => {
  api = createNexoraBackend({ scale: 'smoke', latency: 'none' });
});

async function expectApiError(promise: Promise<unknown>, code: string): Promise<NexoraApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(NexoraApiError);
    expect((error as NexoraApiError).code).toBe(code);
    return error as NexoraApiError;
  }
  throw new Error(`expected ${code}`);
}

describe('session and personas', () => {
  it('signs in Sofia Ramirez by default with sales-manager permissions', async () => {
    const session = await api.session.get();
    expect(session.user.displayName).toBe('Sofia Ramirez');
    expect(session.permissions).toContain('orders.approve');
    expect(session.permissions).not.toContain('payments.record');
    // The nine of section 55.6, and the stand-ins a scale seeds a holder for (the light seed has all three).
    expect(
      session.personas.filter(
        (persona) =>
          !persona.key.includes('-lead') &&
          !['finance-controller', 'staff-accountant'].includes(persona.key),
      ),
    ).toHaveLength(9);
  });

  /**
   * Section 55.6 names nine personas and none holds procurement_manager, while
   * every purchase order that needs an approval waits on that role first: the
   * procurement lead is offered as a stand-in persona, a seeded user and not a
   * new one, so a purchase order can be approved in the demo.
   */
  it('offers the procurement lead as a stand-in who decides a purchase order’s procurement step', async () => {
    const session = await api.session.get();
    const lead = session.personas.find((persona) => persona.key === 'procurement-lead');
    expect(lead?.role).toBe('procurement_manager');
    await api.demo.setPersona('marcus-lee');
    const supplier = (
      await api.suppliers.list({
        pageSize: 25,
        filter: {
          status: { eq: 'active' },
          relationshipTier: { eq: 'standard' },
          skuCount: { gte: 1 },
        },
      })
    ).data.find((row) => row.supportedCurrencies[0] === 'USD')!;
    const mapping = (await api.suppliers.get(supplier.id)).mappings[0]!;
    const quantity = String(Math.ceil(3_000_000 / mapping.unitCost.minor));
    const created = await api.purchaseOrders.create({
      supplierId: supplier.id,
      destinationWarehouseId: 'wh_000001',
      lines: [{ skuId: mapping.skuId, quantity, unitCostMinor: mapping.unitCost.minor }],
    });
    const submitted = await api.purchaseOrders.submit(created.purchaseOrder.id, {
      ifMatch: created.purchaseOrder.metadata.version,
    });
    expect(submitted.purchaseOrder.status).toBe('pending_approval');
    await api.demo.setPersona('procurement-lead');
    await api.approvals.approve(
      submitted.approval!.id,
      {},
      { ifMatch: submitted.approval!.metadata.version },
    );
    expect((await api.purchaseOrders.get(created.purchaseOrder.id)).purchaseOrder.status).toBe(
      'approved',
    );
    await api.demo.setPersona('sofia-ramirez');
  });

  it('enforces permissions per persona', async () => {
    await api.demo.setPersona('jordan-wells');
    await expectApiError(api.finance.invoices.list(), 'FORBIDDEN');
    const inventory = await api.inventory.list({ pageSize: 25 });
    expect(inventory.data.every((position) => position.warehouseCode === 'CHI-01')).toBe(true);
    await api.demo.setPersona('sofia-ramirez');
  });
});

describe('customers and the Meridian narrative', () => {
  it('lists customers with projections and searches by name', async () => {
    const page = await api.customers.list({ q: 'meridian', pageSize: 25 });
    expect(page.page.totalItems).toBeGreaterThanOrEqual(1);
    const meridian = page.data.find(
      (customer) => customer.accountNumber === MERIDIAN.accountNumber,
    );
    expect(meridian).toBeDefined();
    expect(meridian?.health).toBe('at_risk');
    expect(meridian?.summary.overdueReceivables.minor).toBeGreaterThanOrEqual(
      MERIDIAN.invoiceOutstandingMinor,
    );
  });

  it('resolves the cross-module story to the same ids', async () => {
    const fixtures = api.demo.fixtures();
    const order = await api.orders.get(fixtures['flagship.order.meridian'] as string);
    expect(order.order.orderNumber).toBe(MERIDIAN.orderNumber);
    expect(order.order.total.minor).toBe(MERIDIAN.orderTotalMinor);
    expect(order.order.fulfillmentStatus).toBe('partially_fulfilled');
    expect(order.order.riskFlags).toContain('inventory_shortage');
    expect(order.shipments.map((shipment) => shipment.shipmentNumber)).toContain(
      MERIDIAN.shipmentNumber,
    );
    const invoice = order.invoices.find((entry) => entry.invoiceNumber === MERIDIAN.invoiceNumber);
    expect(invoice?.outstanding.minor).toBe(MERIDIAN.invoiceOutstandingMinor);
    expect(invoice?.collectionState).toBe('overdue');
    const mx240 = order.lines.find((line) => line.skuId === fixtures['flagship.sku.mx240']);
    expect(mx240?.backorderedQuantity).toBe(String(MERIDIAN.backorderedUnits));
    const ticket = await api.support.tickets.get(fixtures['flagship.ticket.meridian'] as string);
    expect(ticket.ticket.ticketNumber).toBe(MERIDIAN.ticketNumber);
    expect(ticket.relatedOrder?.orderNumber).toBe(MERIDIAN.orderNumber);
  });
});

describe('list queries', () => {
  it('filters, sorts and paginates orders across both tiers', async () => {
    const page = await api.orders.list({
      filter: { status: 'confirmed,on_hold' },
      sort: '-total',
      pageSize: 25,
    });
    expect(page.data.length).toBeGreaterThan(0);
    expect(
      page.data.every((order) => order.status === 'confirmed' || order.status === 'on_hold'),
    ).toBe(true);
    expect(page.data[0]!.total.minor).toBeGreaterThanOrEqual(
      page.data[page.data.length - 1]!.total.minor,
    );
    const all = await api.orders.list({ pageSize: 25 });
    expect(all.page.totalItems).toBeGreaterThan(api.store.dataset.salesOrders.size);
  });

  it('rejects unknown sort fields', async () => {
    await expectApiError(api.orders.list({ sort: 'nope' }), 'INVALID_SORT');
    await expectApiError(api.orders.list({ pageSize: 30 }), 'INVALID_QUERY');
  });

  it('expands a historical order on demand', async () => {
    const page = await api.orders.list({ filter: { historical: true }, pageSize: 25 });
    const historical = page.data[0]!;
    const detail = await api.orders.get(historical.id);
    expect(detail.order.historical).toBe(true);
    expect(detail.lines.length).toBe(historical.lineCount);
    expect(detail.order.total.minor).toBe(historical.total.minor);
  });
});

describe('order to cash', () => {
  it('creates, submits, allocates, ships, invoices and pays an order', async () => {
    await api.demo.setPersona('maya-chen');
    const customers = await api.customers.list({ filter: { status: 'active' }, pageSize: 25 });
    const customer = customers.data[0]!;
    const skus = await api.catalog.skus({
      filter: { status: 'active', available: { gte: '5' } },
      pageSize: 25,
    });
    const sku = skus.data.find((candidate) => candidate.unitOfMeasure === 'EA')!;
    const warehouse = (await api.inventory.sku(sku.id)).positions.find(
      (position) => Number(position.available) >= 5,
    )!;

    const created = await api.orders.create({
      customerId: customer.id,
      defaultWarehouseId: warehouse.warehouseId,
      lines: [{ skuId: sku.id, quantity: '2' }],
      freightMinor: 2_500,
    });
    expect(created.order.status).toBe('draft');
    const submitted = await api.orders.submit(created.order.id, {
      ifMatch: created.order.metadata.version,
    });
    expect(['confirmed', 'pending_approval']).toContain(submitted.order.status);
    let order = submitted;
    if (order.order.status === 'pending_approval') {
      const approval = await api.approvals.list({ filter: { targetId: order.order.id } });
      await api.demo.setPersona('sofia-ramirez');
      await api.approvals.approve(
        approval.data[0]!.id,
        {},
        { ifMatch: approval.data[0]!.metadata.version },
      );
      await api.demo.setPersona('maya-chen');
      order = await api.orders.get(order.order.id);
    }
    expect(order.order.status).toBe('confirmed');
    expect(order.order.allocationStatus).toBe('allocated');

    await expectApiError(api.orders.hold(order.order.id, { reason: 'x' }), 'PRECONDITION_REQUIRED');
    await expectApiError(
      api.orders.hold(order.order.id, { reason: 'x' }, { ifMatch: 999 }),
      'STALE_VERSION',
    );

    const shipment = await api.shipments.create({
      orderId: order.order.id,
      warehouseId: warehouse.warehouseId,
    });
    let version = shipment.shipment.metadata.version;
    const picking = await api.shipments.startPicking(shipment.shipment.id, { ifMatch: version });
    version = picking.shipment.metadata.version;
    const packed = await api.shipments.pack(shipment.shipment.id, {}, { ifMatch: version });
    const ready = await api.shipments.ready(
      shipment.shipment.id,
      {},
      { ifMatch: packed.shipment.metadata.version },
    );
    const shipped = await api.shipments.ship(
      shipment.shipment.id,
      {},
      { ifMatch: ready.shipment.metadata.version },
    );
    expect(shipped.shipment.status).toBe('shipped');
    order = await api.orders.get(order.order.id);
    expect(order.order.fulfillmentStatus).toBe('fulfilled');
    const positionAfter = (await api.inventory.sku(sku.id)).positions.find(
      (position) => position.warehouseId === warehouse.warehouseId,
    )!;
    expect(Number(positionAfter.onHand)).toBe(Number(warehouse.onHand) - 2);

    const invoice = await api.finance.invoices.createFromOrder({ orderId: order.order.id });
    expect(invoice.invoice.lifecycle).toBe('draft');
    const opened = await api.finance.invoices.open(invoice.invoice.id, {
      ifMatch: invoice.invoice.metadata.version,
    });
    expect(opened.invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/);
    expect(opened.invoice.total.minor).toBe(order.order.total.minor);
    const payment = await api.finance.payments.record({
      customerId: customer.id,
      amountMinor: opened.invoice.total.minor,
      method: 'ach',
      allocations: [{ invoiceId: opened.invoice.id, amountMinor: opened.invoice.total.minor }],
    });
    expect(payment.payment.unappliedAmount.minor).toBe(0);
    const paid = await api.finance.invoices.get(opened.invoice.id);
    expect(paid.invoice.settlement).toBe('paid');
    order = await api.orders.get(order.order.id);
    expect(order.order.status).toBe('closed');
    const audit = await api.audit({ filter: { entityId: order.order.id } });
    expect(audit.page.totalItems).toBeGreaterThan(2);
    await api.demo.setPersona('sofia-ramirez');
  });

  it('rolls back a failed command atomically', async () => {
    await api.demo.setPersona('maya-chen');
    const before = api.store.dataset.salesOrders.size;
    await expectApiError(api.orders.create({ customerId: 'cus_missing', lines: [] }), 'NOT_FOUND');
    expect(api.store.dataset.salesOrders.size).toBe(before);
    await api.demo.setPersona('sofia-ramirez');
  });

  it('honours idempotency keys', async () => {
    await api.demo.setPersona('maya-chen');
    const customers = await api.customers.list({ filter: { status: 'active' }, pageSize: 25 });
    const customer = customers.data[1]!;
    const first = await api.customers.notes.add(
      customer.id,
      { body: 'Idempotent note' },
      { idempotencyKey: 'note-1' },
    );
    const second = await api.customers.notes.add(
      customer.id,
      { body: 'Idempotent note' },
      { idempotencyKey: 'note-1' },
    );
    expect(second.id).toBe(first.id);
    await expectApiError(
      api.customers.notes.add(customer.id, { body: 'Different' }, { idempotencyKey: 'note-1' }),
      'IDEMPOTENCY_KEY_REUSED',
    );
    await api.demo.setPersona('sofia-ramirez');
  });
});

describe('regions and currencies', () => {
  it('exposes the operating regions and issues Brazilian documents in BRL', async () => {
    const session = await api.session.get();
    expect(session.organization.regions.map((region) => region.code)).toEqual(['US', 'BR']);
    const brazil = await api.customers.list({ filter: { regionCode: 'BR' }, pageSize: 25 });
    expect(brazil.page.totalItems).toBeGreaterThan(0);
    const customer = brazil.data[0]!;
    expect(customer.preferredCurrency).toBe('BRL');
    expect(customer.creditLimit.currency).toBe('BRL');
    expect(customer.summary.grossReceivables.currency).toBe('BRL');
    const orders = await api.orders.list({
      filter: { customerId: customer.id },
      pageSize: 25,
    });
    for (const order of orders.data) {
      expect(order.currency).toBe('BRL');
      expect(order.total.currency).toBe('BRL');
    }
    const invoices = await api.finance.invoices.list({ filter: { currency: 'BRL' }, pageSize: 25 });
    expect(invoices.page.totalItems).toBeGreaterThan(0);
    expect(invoices.data[0]!.fxRateToUsd).toBe('0.18500000');
  });
});

describe('analytics and scenarios', () => {
  it('produces a dashboard, finance overview and search results', async () => {
    const dashboard = await api.analytics.dashboard();
    expect(dashboard.kpis.length).toBeGreaterThan(8);
    expect(dashboard.monthly.length).toBeGreaterThan(12);
    await api.demo.setPersona('priya-shah');
    const overview = await api.finance.overview();
    expect(overview.receivables.minor).toBeGreaterThan(0);
    expect(overview.aging).toHaveLength(5);
    await api.demo.setPersona('sofia-ramirez');
    const search = await api.search('MX-240');
    expect(search.groups.find((group) => group.type === 'sku')?.hits.length).toBeGreaterThan(0);
  });

  it('advances the demo clock and re-evaluates time-derived state', async () => {
    const before = await api.finance.invoices.list({
      filter: { collectionState: 'overdue' },
      pageSize: 25,
    });
    const advanced = await api.demo.advanceClock(24 * 40);
    expect(advanced.demo.today > '2026-09-04').toBe(true);
    const after = await api.finance.invoices.list({
      filter: { collectionState: 'overdue' },
      pageSize: 25,
    });
    expect(after.page.totalItems).toBeGreaterThan(before.page.totalItems);
  });

  it('applies the inventory crisis scenario deterministically', async () => {
    const session = await api.demo.setScenario('inventory_crisis');
    expect(session.user.displayName).toBe('Marcus Lee');
    const low = await api.inventory.list({ filter: { belowSafetyStock: true }, pageSize: 100 });
    expect(low.page.totalItems).toBeGreaterThanOrEqual(42);
    const delayed = await api.purchaseOrders.list({
      filter: { exceptionFlags: { contains: 'delayed' } },
      pageSize: 25,
    });
    expect(delayed.page.totalItems).toBeGreaterThanOrEqual(8);
    await api.reset('healthy');
  });
});

describe('historical tier', () => {
  it('summarizes the history as seeded, even when a write comes before the first read', async () => {
    const reference = createNexoraBackend({ scale: 'smoke', latency: 'none' });
    const expected = reference.store.history.summaries;
    const summary = expected.find((entry) => entry.kind !== 'cancelled') as (typeof expected)[0];
    const customer = reference.store.dataset.customers.get(summary.customerId);

    const mutated = createNexoraBackend({ scale: 'smoke', latency: 'none' });
    await mutated.customers.update(
      summary.customerId,
      { taxExempt: customer?.taxProfile.type !== 'exempt' },
      { ifMatch: customer?.metadata.version ?? 1 },
    );
    expect(mutated.store.history.summaries).toEqual(expected);
  });
});

describe('stock movements', () => {
  /**
   * The ledger filters by the fields a movement already carries before it joins the SKU, the
   * warehouse and the actor. The answer is the one the joined list would give.
   */
  it('answers a day of the ledger as the whole ledger filtered would', async () => {
    const backend = createNexoraBackend({ scale: 'smoke', latency: 'none' });
    await backend.demo.setPersona('maya-chen');
    const all: MovementListItem[] = [];
    for (let page = 1; ; page++) {
      const answer = await backend.inventory.movements({ page, pageSize: 100 });
      all.push(...answer.data);
      if (page >= answer.page.totalPages) break;
    }
    const day = all[Math.floor(all.length / 2)]!.occurredAt.slice(0, 10);
    const from = `${day}T00:00:00Z`;
    const to = `${new Date(Date.parse(from) + 86_400_000).toISOString().slice(0, 10)}T00:00:00Z`;
    const inside = (item: MovementListItem) =>
      Date.parse(item.occurredAt) >= Date.parse(from) &&
      Date.parse(item.occurredAt) < Date.parse(to);

    const received = await backend.inventory.movements({
      pageSize: 25,
      filter: { occurredAt: { gte: from, lt: to }, onHandDelta: { gt: 0 } },
    });
    expect(received.page.totalItems).toBe(
      all.filter((item) => inside(item) && Number(item.onHandDelta) > 0).length,
    );

    // A filter on a joined field still reaches the joined item.
    const sku = all.find(inside)!;
    const bySku = await backend.inventory.movements({
      pageSize: 100,
      filter: { occurredAt: { gte: from, lt: to }, skuCode: sku.skuCode },
    });
    expect(bySku.data.map((item) => item.id).sort()).toEqual(
      all
        .filter((item) => inside(item) && item.skuCode === sku.skuCode)
        .map((item) => item.id)
        .sort(),
    );
  });

  it('counts the positions a warehouse has below reorder point as the whole list filtered would', async () => {
    const backend = createNexoraBackend({ scale: 'smoke', latency: 'none' });
    await backend.demo.setPersona('maya-chen');
    const all: InventoryListItem[] = [];
    for (let page = 1; ; page++) {
      const answer = await backend.inventory.list({ page, pageSize: 100 });
      all.push(...answer.data);
      if (page >= answer.page.totalPages) break;
    }
    const warehouseId = all[0]!.warehouseId;
    const below = await backend.inventory.list({
      pageSize: 25,
      filter: { warehouseId, belowReorderPoint: 'true' },
    });
    expect(below.page.totalItems).toBe(
      all.filter((item) => item.warehouseId === warehouseId && item.belowReorderPoint).length,
    );
    const byCode = await backend.inventory.list({
      pageSize: 100,
      filter: { warehouseId, skuCode: all[0]!.skuCode },
    });
    expect(byCode.data.map((item) => item.skuId)).toEqual([all[0]!.skuId]);
  });
});

describe('procurement', () => {
  const CHI = 'wh_000001';

  /** A draft of one line from an active standard supplier in dollars, worth about the dollars asked for. */
  async function draft(dollars: number, supplierFilter: Record<string, unknown> = {}) {
    const supplier = (
      await api.suppliers.list({
        pageSize: 100,
        filter: { relationshipTier: { eq: 'standard' }, skuCount: { gte: 1 }, ...supplierFilter },
      })
    ).data.find((row) => row.supportedCurrencies[0] === 'USD')!;
    const mapping = (await api.suppliers.get(supplier.id)).mappings[0]!;
    const quantity = String(Math.max(1, Math.ceil((dollars * 100) / mapping.unitCost.minor)));
    return { supplier, mapping, quantity };
  }

  it('lists and opens to a warehouse operator the purchase orders bound for their warehouse only', async () => {
    await api.demo.setPersona('maya-chen');
    const elsewhere = (
      await api.purchaseOrders.list({ pageSize: 25, filter: { warehouseId: { neq: CHI } } })
    ).data[0]!;
    await api.demo.setPersona('jordan-wells');
    const rows = (await api.purchaseOrders.list({ pageSize: 100 })).data;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.destinationWarehouseId === CHI)).toBe(true);
    await expectApiError(api.purchaseOrders.get(elsewhere.id), 'FORBIDDEN');
    const found = await api.search(elsewhere.purchaseOrderNumber);
    expect(found.groups.flatMap((group) => group.hits).some((hit) => hit.id === elsewhere.id)).toBe(
      false,
    );
    await api.demo.setPersona('sofia-ramirez');
  });

  it('refuses a goods receipt taken outside the reader’s warehouses', async () => {
    await api.demo.setPersona('maya-chen');
    const receipts = (
      await api.purchaseOrders.list({
        pageSize: 100,
        filter: { status: { in: ['received', 'partially_received'] } },
      })
    ).data;
    const outside = receipts.find((po) => po.destinationWarehouseId !== CHI)!;
    const inside = receipts.find((po) => po.destinationWarehouseId === CHI)!;
    const outsideReceipt = (await api.purchaseOrders.get(outside.id)).receipts[0]!;
    const insideReceipt = (await api.purchaseOrders.get(inside.id)).receipts[0]!;
    await api.demo.setPersona('jordan-wells');
    await expectApiError(api.purchaseOrders.receipt(outsideReceipt.id), 'FORBIDDEN');
    expect((await api.purchaseOrders.receipt(insideReceipt.id)).receipt.id).toBe(insideReceipt.id);
    await api.demo.setPersona('sofia-ramirez');
  });

  it('writes a purchase order’s money down to nought for a reader without cost.view, as the catalogue does', async () => {
    await api.demo.setPersona('jordan-wells');
    const row = (
      await api.purchaseOrders.list({
        pageSize: 25,
        filter: { warehouseId: { eq: CHI }, status: { in: ['received'] } },
      })
    ).data[0]!;
    expect(row.total.minor).toBe(0);
    const detail = await api.purchaseOrders.get(row.id);
    expect(detail.purchaseOrder.subtotal.minor).toBe(0);
    expect(
      detail.lines.every((line) => line.unitCost.minor === 0 && line.lineTotal.minor === 0),
    ).toBe(true);
    const receipt = await api.purchaseOrders.receipt(detail.receipts[0]!.id);
    expect(receipt.lines.every((line) => line.unitCost.minor === 0)).toBe(true);
    await api.demo.setPersona('maya-chen');
    expect((await api.purchaseOrders.get(row.id)).purchaseOrder.total.minor).toBeGreaterThan(0);
    await api.demo.setPersona('sofia-ramirez');
  });

  it('refuses to submit an inactive supplier’s draft with the inactive code', async () => {
    await api.demo.setPersona('maya-chen');
    const candidates = (
      await api.suppliers.list({
        pageSize: 100,
        sort: 'openPurchaseOrderCount',
        filter: { status: { eq: 'active' }, skuCount: { gte: 1 } },
      })
    ).data;
    let tried = false;
    for (const supplier of candidates) {
      const mapping = (await api.suppliers.get(supplier.id)).mappings[0]!;
      const created = await api.purchaseOrders.create({
        supplierId: supplier.id,
        destinationWarehouseId: CHI,
        lines: [{ skuId: mapping.skuId, quantity: '1' }],
      });
      const idle = await api.suppliers
        .update(supplier.id, { status: 'inactive' }, { ifMatch: supplier.metadata.version })
        .catch(() => null);
      if (idle === null) continue;
      await expectApiError(
        api.purchaseOrders.submit(created.purchaseOrder.id, {
          ifMatch: created.purchaseOrder.metadata.version,
        }),
        'SUPPLIER_INACTIVE',
      );
      await api.suppliers.update(
        supplier.id,
        { status: 'active' },
        { ifMatch: idle.metadata.version },
      );
      tried = true;
      break;
    }
    expect(tried).toBe(true);
    await api.demo.setPersona('sofia-ramirez');
  });

  it('keeps the reason given for a receipt past the 5% tolerance', async () => {
    await api.demo.setPersona('maya-chen');
    const { supplier, mapping, quantity } = await draft(2_000, { status: { eq: 'active' } });
    const created = await api.purchaseOrders.create({
      supplierId: supplier.id,
      destinationWarehouseId: CHI,
      lines: [{ skuId: mapping.skuId, quantity }],
    });
    const submitted = await api.purchaseOrders.submit(created.purchaseOrder.id, { ifMatch: 1 });
    const sent = await api.purchaseOrders.send(created.purchaseOrder.id, {
      ifMatch: submitted.purchaseOrder.metadata.version,
    });
    const line = sent.lines[0]!;
    const receipt = await api.purchaseOrders.receive(
      created.purchaseOrder.id,
      {
        lines: { [line.id]: { accepted: String(Number(quantity) * 2) } },
        overReceiptReason: 'A full pallet arrived; kept for the backorder.',
      },
      { ifMatch: sent.purchaseOrder.metadata.version },
    );
    expect(receipt.receipt.overReceiptReason).toBe(
      'A full pallet arrived; kept for the backorder.',
    );
    await api.demo.setPersona('sofia-ramirez');
  });

  it('sorts purchase orders by total in US dollars, whatever currency each is written in', async () => {
    await api.demo.setPersona('maya-chen');
    const rows = (await api.purchaseOrders.list({ pageSize: 100, sort: '-total' })).data;
    const usd = rows.map((row) => Math.round(row.total.minor * Number(row.fxRateToUsd ?? '1')));
    for (let index = 1; index < usd.length; index += 1)
      expect(usd[index]!).toBeLessThanOrEqual(usd[index - 1]! + 1);
    await api.demo.setPersona('sofia-ramirez');
  });

  it('states on each mapping the unit cost last accepted from the supplier for the SKU', async () => {
    await api.demo.setPersona('maya-chen');
    const received = (
      await api.purchaseOrders.list({ pageSize: 25, filter: { status: { eq: 'received' } } })
    ).data[0]!;
    const detail = await api.purchaseOrders.get(received.id);
    const line = detail.lines.find((candidate) => Number(candidate.receivedAcceptedQuantity) > 0)!;
    const mapping = (await api.suppliers.get(received.supplierId)).mappings.find(
      (candidate) => candidate.skuId === line.skuId,
    );
    if (mapping) expect(mapping.lastAcceptedUnitCost?.minor).toBeGreaterThan(0);
    await api.demo.setPersona('sofia-ramirez');
  });
});

describe('finance', () => {
  const openInvoices = async (filter: Record<string, unknown> = {}) => {
    const rows = [];
    for (let page = 1; page <= 40; page += 1) {
      const answer = await api.finance.invoices.list({
        page,
        pageSize: 100,
        filter: { lifecycle: 'open', ...filter } as never,
      });
      rows.push(...answer.data);
      if (page >= answer.page.totalPages) break;
    }
    return rows.filter((row) => row.outstanding.minor > 0);
  };
  const usdOf = (row: { outstanding: { minor: number }; fxRateToUsd?: string }) =>
    Math.round(row.outstanding.minor * Number(row.fxRateToUsd ?? '1'));

  /**
   * Section 66.5 states the write-off authority in a USD equivalent. The
   * command measured a balance in the document's own minor units, so an
   * accountant was refused R$1,000 (US$185) as if it were US$1,000.
   */
  it('measures the write-off authority in US dollars, whatever the invoice is written in', async () => {
    await api.demo.setPersona('staff-accountant');
    const session = await api.session.get();
    expect(session.roles.map((role) => role.name)).toContain('Accountant');
    const brl = (await openInvoices({ currency: 'BRL' })).find(
      (row) => row.outstanding.minor > 50_000 && usdOf(row) <= 50_000,
    )!;
    expect(brl).toBeDefined();
    const written = await api.finance.invoices.writeOff(
      brl.id,
      { reason: 'Balance below collection cost' },
      { ifMatch: brl.metadata.version },
    );
    expect(written.invoice.lifecycle).toBe('written_off');

    const usd = (await openInvoices({ currency: 'USD' })).find(
      (row) => row.outstanding.minor > 50_000 && row.outstanding.minor <= 500_000,
    )!;
    const refused = await expectApiError(
      api.finance.invoices.writeOff(
        usd.id,
        { reason: 'Too small to chase' },
        { ifMatch: usd.metadata.version },
      ),
      'WRITE_OFF_LIMIT_EXCEEDED',
    );
    expect(refused.message).toContain('US$500');
    await api.demo.setPersona('sofia-ramirez');
  });

  /**
   * Priya Shah is the one Finance Manager persona and the one who asks for a
   * write-off above US$5,000, which a requester never decides (section 67.4):
   * the step is assigned to the finance controller, a stand-in who decides it.
   */
  it('assigns a write-off above US$5,000 to the finance controller, whose approval writes it off', async () => {
    // The smoke seed's Finance team holds no second Finance Manager; the light seed, the demo's, does.
    const smoke = api;
    api = createNexoraBackend({ scale: 'light', latency: 'none' });
    await api.demo.setPersona('priya-shah');
    const large = (await openInvoices()).find((row) => usdOf(row) > 500_000)!;
    const requested = await api.finance.invoices.writeOff(
      large.id,
      { reason: 'Customer insolvent' },
      { ifMatch: large.metadata.version },
    );
    expect(requested.invoice.lifecycle).toBe('open');
    const approval = requested.approval!;
    expect(approval.status).toBe('pending');
    expect(approval.steps.map((step) => step.requiredRole)).toEqual(['finance_manager']);
    const personas = (await api.session.get()).personas;
    const controller = personas.find((persona) => persona.key === 'finance-controller')!;
    expect(controller.role).toBe('finance_manager');
    expect(approval.steps[0]!.assignedUserId).toBe(controller.userId);
    await expectApiError(
      api.approvals.approve(approval.id, {}, { ifMatch: approval.metadata.version }),
      'FORBIDDEN',
    );
    await expectApiError(
      api.finance.invoices.writeOff(
        large.id,
        { reason: 'Again' },
        { ifMatch: requested.invoice.metadata.version },
      ),
      'APPROVAL_REQUIRED',
    );
    await api.demo.setPersona('finance-controller');
    await api.approvals.approve(
      approval.id,
      { comment: 'Agreed' },
      { ifMatch: approval.metadata.version },
    );
    const after = await api.finance.invoices.get(large.id);
    expect(after.invoice.lifecycle).toBe('written_off');
    expect(after.approval?.status).toBe('approved');
    api = smoke;
  }, 60_000);

  it('states the cash collected this month, its eight-week trend and the disputed balance', async () => {
    await api.demo.setPersona('priya-shah');
    const before = await api.finance.overview();
    expect(before.cashCollectedByWeek).toHaveLength(8);
    const disputed = await openInvoices({ collectionState: 'disputed' });
    expect(before.disputedReceivables.minor).toBe(
      disputed.reduce((sum, row) => sum + usdOf(row), 0),
    );
    const customer = (
      await api.customers.list({ filter: { preferredCurrency: 'USD' }, pageSize: 25 })
    ).data[0]!;
    await api.finance.payments.record({
      customerId: customer.id,
      amountMinor: 123_400,
      method: 'ach',
    });
    const after = await api.finance.overview();
    expect(after.cashCollectedMonthToDate.minor - before.cashCollectedMonthToDate.minor).toBe(
      123_400,
    );
    expect(after.paymentsReceivedMonthToDate).toBe(before.paymentsReceivedMonthToDate + 1);
    expect(
      after.cashCollectedByWeek.at(-1)!.amount.minor -
        before.cashCollectedByWeek.at(-1)!.amount.minor,
    ).toBe(123_400);
    await api.demo.setPersona('sofia-ramirez');
  });

  it('sorts invoices and payments by their amount in US dollars, whatever currency each is written in', async () => {
    await api.demo.setPersona('priya-shah');
    const invoices = await api.finance.invoices.list({
      pageSize: 100,
      sort: '-outstanding',
      filter: { lifecycle: 'open' },
    });
    const values = invoices.data.map(usdOf);
    expect(new Set(invoices.data.map((row) => row.currency)).size).toBeGreaterThan(1);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    const payments = await api.finance.payments.list({ pageSize: 100, sort: '-amount' });
    const amounts = payments.data.map((row) =>
      Math.round(row.amount.minor * Number(row.fxRateToUsd ?? '1')),
    );
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    await api.demo.setPersona('sofia-ramirez');
  });

  /** The light seed held a credit memo of 7 September and returns of 5 and 6 against a today of 4 September. */
  it('dates no return and no credit memo after the demo’s today, and seeds an invoice a credit memo paid', async () => {
    const light = createNexoraBackend({ scale: 'light', latency: 'none' });
    await light.demo.setPersona('maya-chen');
    const today = (await light.session.get()).demo.today;
    const memos = await light.finance.creditMemos.list({ pageSize: 25, sort: '-issueDate' });
    expect(memos.data[0]!.issueDate <= today, memos.data[0]!.issueDate).toBe(true);
    for (let page = 1; page <= 20; page += 1) {
      const returns = await light.returns.list({ page, pageSize: 100 });
      for (const row of returns.data)
        for (const stamp of [
          row.requestedAt,
          row.authorizedAt,
          row.receivedAt,
          row.inspectedAt,
          row.completedAt,
        ])
          if (stamp)
            expect(businessDateOf(stamp) <= today, `${row.returnNumber} ${stamp}`).toBe(true);
      if (page >= returns.page.totalPages) break;
    }
    // Section 82: the invoice settled by a credit memo is seeded, and a credit application settles it.
    const settled = light.demo.fixtures()['edge.invoice.paid_with_credit_memo'];
    expect(settled).toBeDefined();
    const invoice = await light.finance.invoices.get(settled!);
    expect(invoice.invoice.settlement).toBe('paid');
    expect(invoice.creditApplications.some((application) => application.status === 'active')).toBe(
      true,
    );
  }, 60_000);

  /** §77.7: overdue receivables ×2.2, as the overview reads them — in US dollars. It measured minor units across currencies and reached ×1.70. */
  it('raises the overdue receivables 2.2 times in collections pressure, as the overview measures them', async () => {
    const light = createNexoraBackend({ scale: 'light', latency: 'none', persona: 'priya-shah' });
    const healthy = (await light.finance.overview()).overdueReceivables.minor;
    await light.demo.setScenario('collections_pressure');
    await light.demo.setPersona('priya-shah');
    const pressed = (await light.finance.overview()).overdueReceivables.minor;
    expect(pressed / healthy).toBeGreaterThanOrEqual(2.2);
    expect(pressed / healthy).toBeLessThan(2.35);
  }, 60_000);

  /** The confidence is scored on read; the filter read the stored candidates, which are empty. */
  it('filters bank transactions by the confidence it scores', async () => {
    await api.demo.setPersona('priya-shah');
    const all = await api.finance.bankTransactions.list({
      pageSize: 100,
      filter: { status: { in: ['unmatched', 'suggested', 'needs_review'] } },
    });
    const confidences = new Set(
      all.data.flatMap((row) => (row.bestCandidate ? [row.bestCandidate.confidence] : [])),
    );
    expect(confidences.size).toBeGreaterThan(0);
    for (const confidence of confidences) {
      const narrowed = await api.finance.bankTransactions.list({
        pageSize: 100,
        filter: { confidence },
      });
      expect(narrowed.page.totalItems).toBeGreaterThan(0);
      expect(narrowed.data.every((row) => row.bestCandidate?.confidence === confidence)).toBe(true);
    }
    await api.demo.setPersona('sofia-ramirez');
  });

  /**
   * Section 55.5 gives a sales representative and a support agent read scope
   * over every customer and order, and an order's detail lists its invoices:
   * `invoices.view` answers every invoice to both, as it answers an order.
   */
  it('reads every invoice to a representative and a support agent, as it reads every order', async () => {
    await api.demo.setPersona('maya-chen');
    const total = (await api.finance.invoices.list({ pageSize: 25 })).page.totalItems;
    for (const persona of ['noah-bennett', 'aisha-grant']) {
      await api.demo.setPersona(persona);
      const user = (await api.session.get()).user;
      const answer = await api.finance.invoices.list({ pageSize: 25 });
      expect(answer.page.totalItems).toBe(total);
      const foreign = (await openInvoices()).find(
        (row) => row.customerId && row.customerName && row.sourceOrderId,
      )!;
      const customer = await api.customers.get(foreign.customerId);
      if (customer.customer.accountOwnerId !== user.id) {
        const invoice = await api.finance.invoices.get(foreign.id);
        const order = await api.orders.get(foreign.sourceOrderId!);
        expect(order.invoices.map((row) => row.id)).toContain(invoice.invoice.id);
      }
      await expectApiError(api.finance.payments.list(), 'FORBIDDEN');
    }
    await api.demo.setPersona('sofia-ramirez');
  });
});

describe('support', () => {
  /**
   * Section 55.6 names no Support Manager, while an escalation goes to one by
   * default and only one reopens a ticket past the seven-day window or from
   * closed (section 68.5): the support lead is the stand-in who receives it.
   */
  it('escalates to the support lead, who alone reopens a closed ticket', async () => {
    const backend = createNexoraBackend({ scale: 'smoke', latency: 'none' });
    const lead = (await backend.session.get()).personas.find(
      (persona) => persona.key === 'support-lead',
    );
    expect(lead?.role).toBe('support_manager');
    await backend.demo.setPersona('aisha-grant');
    const open = (
      await backend.support.tickets.list({ pageSize: 25, filter: { status: { eq: 'open' } } })
    ).data[0]!;
    const escalated = await backend.support.tickets.escalate(
      open.id,
      { reason: 'Carrier lost the pallet' },
      { ifMatch: open.metadata.version },
    );
    expect(escalated.ticket.status).toBe('escalated');
    expect(escalated.ticket.assigneeId).toBe(lead!.userId);
    const resolved = await backend.support.tickets.resolve(
      open.id,
      { resolutionCode: 'resolved_replacement', body: 'A replacement pallet ships today.' },
      { ifMatch: escalated.ticket.metadata.version },
    );
    expect(resolved.ticket.status).toBe('resolved');
    await backend.demo.advanceClock(24 * 8);
    const closed = await backend.support.tickets.get(open.id);
    expect(closed.ticket.status).toBe('closed');
    await expectApiError(
      backend.support.tickets.reopen(
        open.id,
        { reason: 'Still missing a carton' },
        { ifMatch: closed.ticket.metadata.version },
      ),
      'FORBIDDEN',
    );
    await backend.demo.setPersona('support-lead');
    const notified = await backend.notifications.list({ pageSize: 25 });
    expect(notified.data.some((notification) => notification.entityId === open.id)).toBe(true);
    const reopened = await backend.support.tickets.reopen(
      open.id,
      { reason: 'Still missing a carton' },
      { ifMatch: closed.ticket.metadata.version },
    );
    expect(reopened.ticket.status).toBe('open');
  }, 60_000);

  /**
   * Section 14 asks for assignment controls, and a support agent holds no
   * `users.view`: the support module answers its own roster, and a queue of
   * unassigned tickets is a filter the list accepts.
   */
  it('answers the support roster to an agent and filters the tickets nobody holds', async () => {
    await api.demo.setPersona('aisha-grant');
    await expectApiError(api.identity.users({ pageSize: 25 }), 'FORBIDDEN');
    const agents = await api.support.agents();
    const aisha = (await api.session.get()).user;
    expect(agents.map((agent) => agent.id)).toContain(aisha.id);
    expect(agents.some((agent) => agent.role === 'support_manager')).toBe(true);
    const all = await api.support.tickets.list({ pageSize: 25 });
    const unassigned = await api.support.tickets.list({
      pageSize: 25,
      filter: { assigned: { eq: false } },
    });
    expect(unassigned.data.every((ticket) => ticket.assigneeId === undefined)).toBe(true);
    const assigned = await api.support.tickets.list({
      pageSize: 25,
      filter: { assigned: { eq: true } },
    });
    expect(unassigned.page.totalItems + assigned.page.totalItems).toBe(all.page.totalItems);
    const held = agents.find((agent) => agent.id === aisha.id)!;
    const mine = await api.support.tickets.list({
      pageSize: 25,
      filter: {
        assigneeId: { eq: aisha.id },
        status: { in: ['new', 'open', 'pending_customer', 'pending_internal', 'escalated'] },
      },
    });
    expect(held.openTicketCount).toBe(mine.page.totalItems);
    await api.demo.setPersona('sofia-ramirez');
  });

  /**
   * A ticket opened today drew an hour up to 19:00 against a clock at 15:00:
   * sixteen tickets of the light seed and their messages were dated after the
   * demo clock, so a reply written now stood above messages from the future.
   */
  it('opens no ticket and writes no message after the demo clock', async () => {
    const backend = createNexoraBackend({ scale: 'light', latency: 'none' });
    await backend.demo.setPersona('aisha-grant');
    const now = (await backend.session.get()).demo.demoClock;
    const first = await backend.support.tickets.list({ pageSize: 100 });
    const late: string[] = [];
    for (let page = 1; page <= first.page.totalPages; page += 1) {
      const answer = await backend.support.tickets.list({ pageSize: 100, page });
      for (const ticket of answer.data) {
        if (ticket.metadata.createdAt > now) late.push(ticket.ticketNumber);
        const detail = await backend.support.tickets.get(ticket.id);
        if (detail.messages.some((message) => message.createdAt > now))
          late.push(`${ticket.ticketNumber} message`);
      }
    }
    expect(late).toEqual([]);
  }, 120_000);

  /** Section 68.6: an internal message never reaches a reader who does not answer the customer. */
  it('withholds internal notes from a reader without support.reply', async () => {
    const fixtures = api.demo.fixtures();
    const id = fixtures['flagship.ticket.meridian'] as string;
    await api.demo.setPersona('aisha-grant');
    const agent = await api.support.tickets.get(id);
    await api.support.tickets.internalNote(
      id,
      { body: 'Carrier claim filed' },
      { ifMatch: agent.ticket.metadata.version },
    );
    const withNote = await api.support.tickets.get(id);
    expect(withNote.messages.some((message) => message.visibility === 'internal')).toBe(true);
    await api.demo.setPersona('sofia-ramirez');
    const reader = await api.support.tickets.get(id);
    expect(reader.messages.every((message) => message.visibility === 'public')).toBe(true);
  });
});

/**
 * Section 16's reports. Every value with a door is computed from the records
 * the door's list holds under the same condition: the list's total is the
 * value's count, and where the value is a sum the list's rows add up to it, in
 * US dollars at each document's rate (section 72.1).
 */
describe('reports', () => {
  let backend: NexoraApi;

  beforeAll(async () => {
    backend = createNexoraBackend({ scale: 'smoke', latency: 'none' });
    await backend.demo.setPersona('maya-chen');
  });

  const lists = (
    b: NexoraApi,
  ): Record<ReportList, (query: ListQuery) => Promise<ListResponse<Record<string, unknown>>>> => ({
    orders: (query) => b.orders.list(query) as never,
    invoices: (query) => b.finance.invoices.list(query) as never,
    'credit-memos': (query) => b.finance.creditMemos.list(query) as never,
    payments: (query) => b.finance.payments.list(query) as never,
    quotes: (query) => b.quotes.list(query) as never,
    tickets: (query) => b.support.tickets.list(query) as never,
    stock: (query) => b.inventory.list(query) as never,
    movements: (query) => b.inventory.movements(query) as never,
    transfers: (query) => b.inventory.transfers.list(query) as never,
    'purchase-orders': (query) => b.purchaseOrders.list(query) as never,
  });

  async function rowsOf(b: NexoraApi, door: ReportDoor): Promise<Record<string, unknown>[]> {
    const read = lists(b)[door.list];
    const first = await read({ pageSize: 100, filter: door.filter });
    const rows = [...first.data];
    for (let page = 2; page <= first.page.totalPages; page += 1)
      rows.push(...(await read({ pageSize: 100, page, filter: door.filter })).data);
    expect(rows).toHaveLength(first.page.totalItems);
    return rows;
  }

  type Row = Record<string, unknown>;
  const money = (row: Row, field: string): Money => row[field] as Money;
  const rate = (row: Row) => row['fxRateToUsd'] as string | undefined;
  const total = (rows: Row[], of: (row: Row) => number) =>
    rows.reduce((sum, row) => sum + of(row), 0);
  /** The measures that are sums of the door's rows, by the key a figure or a column carries. */
  const SUMS: Record<string, (rows: Row[]) => number> = {
    bookedValue: (rows) => total(rows, (row) => money(row, 'netUsd').minor),
    previousBookedValue: (rows) => total(rows, (row) => money(row, 'netUsd').minor),
    invoiced: (rows) =>
      total(rows, (row) =>
        usdMinor(addMoney(money(row, 'subtotal'), money(row, 'freight')), rate(row)),
      ),
    credited: (rows) => total(rows, (row) => usdMinor(money(row, 'subtotal'))),
    invoicedTotal: (rows) => total(rows, (row) => usdMinor(money(row, 'total'), rate(row))),
    overdue: (rows) => total(rows, (row) => usdMinor(money(row, 'outstanding'), rate(row))),
    collected: (rows) => total(rows, (row) => usdMinor(money(row, 'amount'), rate(row))),
    value: (rows) => total(rows, (row) => money(row, 'onHandValue').minor),
    valuation: (rows) => total(rows, (row) => money(row, 'onHandValue').minor),
    inventoryValue: (rows) => total(rows, (row) => money(row, 'onHandValue').minor),
    agedValue: (rows) => total(rows, (row) => money(row, 'onHandValue').minor),
    spend: (rows) =>
      total(rows, (row) =>
        usdMinor(addMoney(money(row, 'subtotal'), money(row, 'freight')), rate(row)),
      ),
  };
  /** The measures that count the door's records. */
  const COUNTS = new Set([
    'orders',
    'quotes',
    'opened',
    'resolved',
    'met',
    'breached',
    'escalated',
    'positions',
    'agedPositions',
    'transfers',
    'shipments',
    'receipts',
    'losses',
    'payments',
    'received',
    'ticketVolume',
  ]);

  /** Every value of an answer with the key that names its measure. */
  function valuesOf(answer: ReportAnswer): [string, string, ReportValue][] {
    const values: [string, string, ReportValue][] = [];
    for (const figure of answer.figures) {
      values.push([figure.key, `figure ${figure.key}`, figure]);
      if (figure.previous)
        values.push([figure.key, `figure ${figure.key} (previous)`, figure.previous]);
    }
    for (const table of answer.tables)
      for (const row of [...table.rows, ...(table.total ? [table.total] : [])])
        for (const [key, cell] of Object.entries(row.cells))
          values.push([key, `${table.key} › ${row.key} › ${key}`, cell]);
    return values;
  }

  async function reconcile(b: NexoraApi, answer: ReportAnswer): Promise<number> {
    let checked = 0;
    for (const [measure, where, cell] of valuesOf(answer)) {
      if (!cell.door || cell.value === null) continue;
      const rows = await rowsOf(b, cell.door);
      expect(rows.length, where).toBe(cell.count);
      if (COUNTS.has(measure)) expect(cell.value, where).toBe(rows.length);
      const sum = SUMS[measure];
      if (sum) expect(cell.value, where).toBe(sum(rows));
      if (measure === 'revenue') {
        // Section 72.2: the door's invoices, less the credit memos opened in the same days.
        const memos = await rowsOf(b, {
          list: 'credit-memos',
          filter: {
            issueDate: cell.door.filter['issueDate'] as never,
            lifecycle: { in: ['open', 'fully_applied'] },
            ...(cell.door.filter['regionCode']
              ? { regionCode: cell.door.filter['regionCode'] }
              : {}),
            ...(cell.door.filter['customerSegment']
              ? { customerSegment: cell.door.filter['customerSegment'] }
              : {}),
          },
        });
        expect(cell.value, where).toBe(
          (SUMS['invoiced'] as (rows: Row[]) => number)(rows) -
            (SUMS['credited'] as (rows: Row[]) => number)(memos),
        );
      }
      if (measure === 'lineRevenue') {
        const skuId = (cell.door.filter['skuIds'] as { in: string[] }).in[0] as string;
        let lines = 0;
        for (const row of rows) {
          const order = b.store.dataset.salesOrders.get(row['id'] as string)!;
          for (const line of b.runtime.indexes.linesByOrder.get(order.id))
            if (line.skuId === skuId) lines += usdMinor(line.netAmount, order.fxRateToUsd);
        }
        expect(cell.value, where).toBe(lines);
      }
      checked += 1;
    }
    return checked;
  }

  it.each(['executive', 'sales', 'inventory', 'procurement', 'finance', 'support'] as const)(
    'reconciles every value of the %s report with the list its door opens',
    async (report) => {
      const answer = (await backend.analytics[report]()) as ReportAnswer;
      expect(answer.withheld).toEqual([]);
      expect(await reconcile(backend, answer)).toBeGreaterThan(10);
    },
    120_000,
  );

  it('reconciles a segment and a region the way the lists filter them', async () => {
    const sales = await backend.analytics.sales({ segment: 'enterprise', region: 'US' });
    expect(sales.filters).toEqual({ segment: 'enterprise', region: 'US' });
    expect(await reconcile(backend, sales)).toBeGreaterThan(10);
    const support = await backend.analytics.support({ segment: 'strategic' });
    expect(await reconcile(backend, support)).toBeGreaterThan(5);
  }, 120_000);

  it('compares with a period of the same length: the one before, or the same weeks a year earlier', async () => {
    const before = await backend.analytics.sales({ from: '2026-08-06', to: '2026-09-04' });
    expect(before.period).toEqual({ from: '2026-08-06', to: '2026-09-04', days: 30 });
    expect(before.comparison).toEqual({ from: '2026-07-07', to: '2026-08-05', days: 30 });
    const year = await backend.analytics.sales({
      from: '2026-08-06',
      to: '2026-09-04',
      compare: 'year',
    });
    expect(year.comparison).toEqual({ from: '2025-08-07', to: '2025-09-05', days: 30 });
    const none = await backend.analytics.sales({ compare: 'none' });
    expect(none.comparison).toBeNull();
    expect(none.figures.every((figure) => figure.previous === undefined)).toBe(true);
    // A day, a week and a month: the grain follows the period's length.
    expect((await backend.analytics.sales({ from: '2026-08-29', to: '2026-09-04' })).grain).toBe(
      'day',
    );
    expect(before.grain).toBe('week');
    expect(before.buckets.at(-1)).toEqual({ from: '2026-08-29', to: '2026-09-04', days: 7 });
    const year12 = await backend.analytics.sales({ from: '2025-09-05', to: '2026-09-04' });
    expect(year12.grain).toBe('month');
    expect(year12.buckets.reduce((sum, bucket) => sum + bucket.days, 0)).toBe(year12.period.days);
  });

  it('answers what is not kept as missing, never as a zero', async () => {
    const light = createNexoraBackend({ scale: 'light', latency: 'none' });
    await light.demo.setPersona('maya-chen');
    const coverage = light.store.seed.context;
    // Thirty days to today fit the light window; the thirty before them do not.
    const sales = await light.analytics.sales();
    const discount = sales.figures.find((figure) => figure.key === 'discountRate')!;
    expect(discount.value).not.toBeNull();
    expect(discount.previous).toEqual({ value: null, missing: 'not-kept' });
    expect(
      sales.figures.find((figure) => figure.key === 'bookedValue')!.previous!.value,
    ).toBeGreaterThan(0);
    // A year of orders is kept; a year of lines is not.
    const year = await light.analytics.sales({ from: '2025-09-05', to: '2026-09-04' });
    expect(year.figures.find((figure) => figure.key === 'bookedValue')!.value).toBeGreaterThan(0);
    expect(year.figures.find((figure) => figure.key === 'discountRate')!.missing).toBe('not-kept');
    expect(year.tables.find((table) => table.key === 'byProduct')!.missing).toBe('not-kept');
    expect(year.tables.find((table) => table.key === 'byRep')).toMatchObject({
      missing: 'not-kept',
      rows: [],
    });
    expect(year.coverage).toEqual({
      orders: coverage.historyStart,
      'order-lines': coverage.operationalStart,
      quotes: coverage.operationalStart,
    });
    expect(year.annotations).toContainEqual({
      date: coverage.operationalStart,
      kind: 'records-kept',
      label: 'Records kept from here',
    });
    // Section 72.7 over invoices the window does not hold for 90 days is undefined, not a ratio of a part.
    const overview = await light.finance.overview();
    expect(overview).toMatchObject({
      dsoDays: null,
      dsoUndefined: 'not-kept',
      keptFrom: coverage.operationalStart,
    });
    expect(overview.cashCollectedByWeek.map((week) => week.kept)).toContain(false);
    expect((await backend.finance.overview()).dsoDays).toBeGreaterThan(0);
  }, 120_000);

  it('refuses a period the history does not hold or that ends after today', async () => {
    await expectApiError(backend.analytics.sales({ from: '2020-01-01' }), 'VALIDATION_FAILED');
    await expectApiError(backend.analytics.sales({ to: '2099-01-01' }), 'VALIDATION_FAILED');
    await expectApiError(
      backend.analytics.sales({ from: '2026-09-04', to: '2026-09-01' }),
      'VALIDATION_FAILED',
    );
  });

  it('withholds margin from a representative and names who holds it', async () => {
    await backend.demo.setPersona('noah-bennett');
    try {
      const sales = await backend.analytics.sales();
      expect(sales.figures.map((figure) => figure.key)).not.toContain('bookedMargin');
      for (const table of sales.tables)
        for (const row of table.rows) expect(Object.keys(row.cells)).not.toContain('margin');
      expect(sales.withheld).toEqual([
        {
          permission: 'cost.view',
          roles: [
            'administrator',
            'executive',
            'sales_manager',
            'finance_manager',
            'procurement_manager',
            'buyer',
            'auditor',
          ],
          parts: ['margin'],
        },
      ]);
      // Section 55.5: a representative reads every order, and so every colleague's line of the ranking.
      expect(sales.tables.find((table) => table.key === 'byRep')!.rows.length).toBeGreaterThan(1);
      const finance = await backend.analytics.finance();
      expect(finance.figures.map((figure) => figure.key)).toEqual(['revenue', 'overdueOfInvoiced']);
      expect(finance.withheld.map((entry) => entry.permission)).toEqual(['payments.view']);
    } finally {
      await backend.demo.setPersona('maya-chen');
    }
  });

  it('leaves out of the executive report what the reader may not read, once per permission', async () => {
    await backend.demo.setPersona('procurement-lead');
    try {
      const executive = await backend.analytics.executive();
      expect(executive.figures.map((figure) => figure.key)).toEqual(['inventoryValue']);
      expect(executive.withheld.map((entry) => [entry.permission, entry.parts])).toEqual([
        ['invoices.view', ['revenue']],
        ['orders.view', ['orders']],
        ['support.view', ['service']],
      ]);
      const support = await backend.analytics.support();
      expect(support.figures).toEqual([]);
      expect(support.withheld[0]).toMatchObject({ permission: 'support.view', parts: ['tickets'] });
    } finally {
      await backend.demo.setPersona('maya-chen');
    }
  });

  it('refuses every report to a reader without analytics.view', async () => {
    await backend.demo.setPersona('jordan-wells');
    try {
      await expectApiError(backend.analytics.executive(), 'FORBIDDEN');
      await expectApiError(backend.analytics.inventory(), 'FORBIDDEN');
    } finally {
      await backend.demo.setPersona('maya-chen');
    }
  });

  it('flags the period it reads differently: an incident, a crisis, and nothing on the healthy light tenant', async () => {
    // The smoke tenant writes a loss a week, and a week of eight is outside its band; the light one does not.
    const light = createNexoraBackend({ scale: 'light', latency: 'none', persona: 'maya-chen' });
    const healthy = await Promise.all(
      (['executive', 'sales', 'inventory', 'support'] as const).map((report) =>
        light.analytics[report](),
      ),
    );
    expect(healthy.flatMap((answer) => answer.anomalies)).toEqual([]);
    const incident = createNexoraBackend({
      scale: 'smoke',
      latency: 'none',
      scenario: 'support_incident',
    });
    await incident.demo.setPersona('maya-chen');
    const support = await incident.analytics.support();
    expect(support.anomalies).toMatchObject([
      { key: 'support.ticketVolume', direction: 'above', against: 'buckets' },
    ]);
    expect(support.annotations).toContainEqual({
      date: incident.store.today,
      kind: 'scenario',
      label: 'Support Incident',
    });
    expect(await reconcile(incident, support)).toBeGreaterThan(5);
    const crisis = createNexoraBackend({
      scale: 'smoke',
      latency: 'none',
      scenario: 'inventory_crisis',
    });
    await crisis.demo.setPersona('maya-chen');
    const inventory = await crisis.analytics.inventory();
    expect(inventory.anomalies).toMatchObject([{ key: 'inventory.losses', direction: 'above' }]);
    expect((await crisis.analytics.executive()).anomalies.map((anomaly) => anomaly.key)).toContain(
      'inventory.losses',
    );
  }, 120_000);

  it('reads a new tenant as thirty days of records with nothing to compare them with', async () => {
    const tenant = createNexoraBackend({ latency: 'none', scenario: 'new_tenant' });
    const sales = await tenant.analytics.sales();
    expect(sales.figures.find((figure) => figure.key === 'orders')!.value).toBeGreaterThan(0);
    for (const figure of sales.figures)
      expect(figure.previous, figure.key).toEqual({ value: null, missing: 'not-kept' });
    expect(await reconcile(tenant, sales)).toBeGreaterThan(5);
  }, 120_000);

  /**
   * Section 72.10: a line is on time when the receipt that satisfies it arrives
   * by its expected date. The supplier's record counted the first receipt, so a
   * line half received on time and finished late read as on time.
   */
  it('times a supplier line by the receipt that completes it, on the record as in the report', async () => {
    const b = createNexoraBackend({ scale: 'smoke', latency: 'none', persona: 'maya-chen' });
    const supplier = await b.suppliers.create({
      displayName: 'Harbor Line Supply',
      category: 'MRO',
    });
    const sku = [...b.store.dataset.skus.values()].find(
      (candidate) => candidate.status === 'active',
    )!;
    const today = b.store.today;
    const created = await b.purchaseOrders.create({
      supplierId: supplier.id,
      destinationWarehouseId: 'wh_000001',
      lines: [{ skuId: sku.id, quantity: '10' }],
      expectedDate: today,
    });
    const submitted = await b.purchaseOrders.submit(created.purchaseOrder.id, { ifMatch: 1 });
    const sent = await b.purchaseOrders.send(created.purchaseOrder.id, {
      ifMatch: submitted.purchaseOrder.metadata.version,
    });
    const line = sent.lines[0]!;
    await b.purchaseOrders.receive(
      created.purchaseOrder.id,
      { lines: { [line.id]: { accepted: '5' } } },
      { ifMatch: sent.purchaseOrder.metadata.version },
    );
    await b.demo.advanceClock(72);
    const half = await b.purchaseOrders.get(created.purchaseOrder.id);
    await b.purchaseOrders.receive(
      created.purchaseOrder.id,
      { lines: { [line.id]: { accepted: '5' } } },
      { ifMatch: half.purchaseOrder.metadata.version },
    );
    expect((await b.suppliers.get(supplier.id)).supplier.performance.onTimeDeliveryBps).toBe(0);
    const procurement = await b.analytics.procurement({ from: b.store.today, to: b.store.today });
    const row = procurement.tables
      .find((table) => table.key === 'bySupplier')!
      .rows.find((candidate) => candidate.key === supplier.id)!;
    expect(row.cells['onTimeDelivery']!.value).toBe(0);
  });

  /**
   * Every seeded quote was the source of an order, so a conversion rate read
   * 100% by construction. Section 75.3's 52,000 quotes are 48,000 converted
   * ones and 4,000 more: the window now holds the open and lost quotes too.
   */
  it('seeds the quotes that did not become orders, each with its lines and its own number', async () => {
    const light = createNexoraBackend({ scale: 'light', latency: 'none', persona: 'maya-chen' });
    const quotes = [...light.store.dataset.quotes.values()];
    const statuses = new Set(quotes.map((quote) => quote.status));
    for (const status of ['converted', 'sent', 'viewed', 'accepted', 'rejected'])
      expect(statuses, status).toContain(status);
    expect(new Set(quotes.map((quote) => quote.quoteNumber)).size).toBe(quotes.length);
    const unconverted = quotes.filter((quote) => quote.status !== 'converted');
    expect(unconverted.length / quotes.length).toBeGreaterThan(0.03);
    expect(unconverted.length / quotes.length).toBeLessThan(0.15);
    for (const quote of unconverted) {
      expect(
        light.runtime.indexes.quoteLinesByQuote.get(quote.id).length,
        quote.quoteNumber,
      ).toBeGreaterThan(0);
      expect(quote.convertedOrderId).toBeUndefined();
      expect(
        compareDates(quote.createdBusinessDate, light.store.seed.context.operationalStart),
      ).toBeGreaterThanOrEqual(0);
    }
    const conversion = (await light.analytics.sales()).figures.find(
      (figure) => figure.key === 'conversionRate',
    )!;
    expect(conversion.value).toBeLessThan(10_000);
  });

  /**
   * The home's dashboard and the executive report say one number for one
   * figure over the same thirty days: section 72.2 net of credit memos,
   * section 72.3 over merchandise, section 72.10 over lines.
   */
  it('says on the dashboard the numbers the executive report says, by section 72', async () => {
    const dashboard = await backend.analytics.dashboard();
    const executive = await backend.analytics.executive();
    const figure = (key: string) => executive.figures.find((entry) => entry.key === key)!.value;
    const kpi = (label: string) => dashboard.kpis.find((entry) => entry.label === label)!.value;
    expect(dashboard.period).toEqual({ from: executive.period.from, to: executive.period.to });
    expect(kpi('Invoiced revenue (30d)')).toBe(figure('revenue'));
    expect(kpi('Gross margin (30d)')).toBe(figure('grossMargin'));
    expect(kpi('Orders confirmed (30d)')).toBe(figure('orders'));
    expect(kpi('Booked order value (30d)')).toBe(figure('bookedValue'));
    // A month before invoices are kept has no revenue to say, and says none.
    const light = createNexoraBackend({ scale: 'light', latency: 'none', persona: 'maya-chen' });
    const monthly = (await light.analytics.dashboard()).monthly;
    expect(monthly[0]!.invoicedRevenue).toBeNull();
    expect(monthly.at(-1)!.invoicedRevenue!.minor).toBeGreaterThan(0);
  });

  /**
   * The enterprise tenant did not seed: `Math.max(0, ...invoices)` passed every
   * invoice of the year as an argument and overflowed the stack. Seeding it
   * takes a minute and a half, so the guard reads the seed's code instead.
   */
  it('folds a maximum over a collection instead of spreading it into a call', () => {
    const folder = join(dirname(fileURLToPath(import.meta.url)), '../data/seed');
    const spreads = readdirSync(folder)
      .filter((file) => file.endsWith('.ts'))
      .filter((file) =>
        /Math\.(max|min)\(\s*[^)]*\.\.\.\s*\[\.\.\.dataset/.test(
          readFileSync(join(folder, file), 'utf8'),
        ),
      );
    expect(spreads).toEqual([]);
  });

  it('fails a report read under the degraded transport as often as the finance overview', () => {
    const latency = new Latency('degraded', 'reports');
    let failed = 0;
    for (let index = 0; index < 2_000; index += 1) {
      latency.delayFor('analytics', 'GET /analytics/sales');
      if (latency.shouldFail('GET /analytics/sales', 'analytics', `req_${index}`)) failed += 1;
    }
    expect(failed / 2_000).toBeGreaterThan(0.3);
    expect(failed / 2_000).toBeLessThan(0.4);
    expect(
      new Latency('normal', 'reports').shouldFail('GET /analytics/sales', 'analytics', 'x'),
    ).toBe(false);
  });
});

describe('workflow automation (section 69)', () => {
  type Definition = Parameters<NexoraApi['workflows']['create']>[0];
  const everything = (field: string, value: unknown = 0): ConditionNode => ({
    type: 'group',
    operator: 'and',
    children: [{ type: 'condition', field, operator: 'gte', value }],
  });
  const notifyOwner = (title: string): WorkflowAction => ({
    type: 'send_notification',
    config: { recipient: 'workflow_owner', title },
  });

  /** A tenant of its own, signed in as the administrator, the one role that writes workflows. */
  async function tenant(options: { scenario?: ScenarioId } = {}): Promise<NexoraApi> {
    const backend = createNexoraBackend({
      scale: 'smoke',
      latency: 'none',
      persona: 'maya-chen',
      ...options,
    });
    await backend.demo.setPersona('maya-chen');
    return backend;
  }

  async function active(backend: NexoraApi, definition: Definition): Promise<string> {
    const created = await backend.workflows.create(definition);
    await backend.workflows.activate(created.id, { ifMatch: created.metadata.version });
    return created.id;
  }

  const runsOf = (backend: NexoraApi, workflowId: string) =>
    [...backend.store.dataset.workflowRuns.values()]
      .filter((run) => run.workflowId === workflowId)
      .sort((a, b) => a.id.localeCompare(b.id));

  async function draftOrder(backend: NexoraApi) {
    const customer = (
      await backend.customers.list({ filter: { status: 'active' }, pageSize: 25 })
    ).data.find((candidate) => candidate.regionCode === 'US')!;
    const sku = (
      await backend.catalog.skus({
        filter: { status: 'active', available: { gte: '5' } },
        pageSize: 25,
      })
    ).data.find((candidate) => candidate.unitOfMeasure === 'EA')!;
    const warehouse = (await backend.inventory.sku(sku.id)).positions.find(
      (position) => Number(position.available) >= 5,
    )!;
    return backend.orders.create({
      customerId: customer.id,
      defaultWarehouseId: warehouse.warehouseId,
      lines: [{ skuId: sku.id, quantity: '2' }],
    });
  }

  /** Submits, and approves as the sales manager where the policy asks, until the order is confirmed. */
  async function confirm(
    backend: NexoraApi,
    order: { order: { id: string; metadata: { version: number } } },
  ) {
    const submitted = await backend.orders.submit(order.order.id, {
      ifMatch: order.order.metadata.version,
    });
    if (submitted.order.status === 'pending_approval') {
      const approval = (await backend.approvals.list({ filter: { targetId: order.order.id } }))
        .data[0]!;
      await backend.demo.setPersona('sofia-ramirez');
      await backend.approvals.approve(approval.id, {}, { ifMatch: approval.metadata.version });
      await backend.demo.setPersona('maya-chen');
    }
    return backend.orders.get(order.order.id);
  }

  it('runs the active workflows of each trigger of section 69.1, and only those', async () => {
    const backend = await tenant();
    const created = await active(backend, {
      name: 'Created',
      trigger: { type: 'order.created' },
      conditions: everything('order.totalUsd'),
      actions: [notifyOwner('Order created')],
    });
    const confirmed = await active(backend, {
      name: 'Confirmed',
      trigger: { type: 'order.confirmed' },
      conditions: everything('order.totalUsd'),
      actions: [notifyOwner('Order confirmed')],
    });
    const changed = await active(backend, {
      name: 'Value changed',
      trigger: { type: 'order.value_changed' },
      conditions: everything('order.totalUsd'),
      actions: [notifyOwner('Order value changed')],
    });
    // A draft and a paused workflow of the same trigger never run.
    const draft = await backend.workflows.create({
      name: 'Draft',
      trigger: { type: 'order.created' },
      conditions: everything('order.totalUsd'),
      actions: [notifyOwner('Never')],
    });
    const paused = await backend.workflows.create({
      name: 'Paused',
      trigger: { type: 'order.created' },
      conditions: everything('order.totalUsd'),
      actions: [notifyOwner('Never')],
    });
    const on = await backend.workflows.activate(paused.id, { ifMatch: paused.metadata.version });
    await backend.workflows.pause(paused.id, { ifMatch: on.metadata.version });

    const order = await draftOrder(backend);
    expect(runsOf(backend, created)).toHaveLength(1);
    expect(runsOf(backend, created)[0]).toMatchObject({
      status: 'succeeded',
      affectedEntityType: 'sales_order',
      affectedEntityId: order.order.id,
      affectedLabel: order.order.orderNumber,
      causedBy: order.order.ownerId,
      chainDepth: 1,
    });
    const line = order.lines[0]!;
    const edited = await backend.orders.update(
      order.order.id,
      { lineQuantities: { [line.id]: '3' } },
      { ifMatch: order.order.metadata.version },
    );
    expect(runsOf(backend, changed)).toHaveLength(1);
    await confirm(backend, edited);
    expect(runsOf(backend, confirmed)).toHaveLength(1);
    expect(runsOf(backend, draft.id)).toHaveLength(0);
    expect(runsOf(backend, paused.id)).toHaveLength(0);

    const escalatedFlow = await active(backend, {
      name: 'Escalated',
      trigger: { type: 'ticket.escalated' },
      conditions: everything('customer.creditUtilizationBps'),
      actions: [notifyOwner('Ticket escalated')],
    });
    const statusFlow = await active(backend, {
      name: 'Status',
      trigger: { type: 'customer.status_changed' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'customer.status', operator: 'eq', value: 'on_hold' },
        ],
      },
      actions: [notifyOwner('Customer held')],
    });
    const ticket = (
      await backend.support.tickets.list({ pageSize: 25, filter: { status: { eq: 'open' } } })
    ).data[0]!;
    await backend.support.tickets.escalate(
      ticket.id,
      { reason: 'Customer line down' },
      { ifMatch: ticket.metadata.version },
    );
    expect(runsOf(backend, escalatedFlow)[0]).toMatchObject({
      status: 'succeeded',
      affectedEntityId: ticket.id,
    });
    const customer = (await backend.customers.list({ filter: { status: 'active' }, pageSize: 25 }))
      .data[3]!;
    await backend.customers.hold(customer.id, 'Payment bounced', {
      ifMatch: customer.metadata.version,
    });
    expect(runsOf(backend, statusFlow)[0]).toMatchObject({
      status: 'succeeded',
      affectedEntityId: customer.id,
    });

    const stockFlow = await active(backend, {
      name: 'Stock',
      trigger: { type: 'inventory.below_reorder_point' },
      conditions: everything('inventory.available'),
      actions: [notifyOwner('Stock low')],
    });
    const position = [...backend.runtime.projections.inventory().values()].find(
      (candidate) =>
        !candidate.belowReorderPoint &&
        backend.store.dataset.skus.get(candidate.skuId)?.quantityPrecision === 0 &&
        Number(candidate.reorderPoint) > 0 &&
        Number(candidate.available) - Number(candidate.reorderPoint) < 9 &&
        Number(candidate.sellableOnHand) > Number(candidate.reorderPoint),
    )!;
    const skuCode = backend.store.dataset.skus.get(position.skuId)!.sku;
    const warehouseCode = backend.store.dataset.warehouses.get(position.warehouseId)!.code;
    const drop = Number(position.available) - Number(position.reorderPoint) + 1;
    await backend.inventory.adjust({
      skuId: position.skuId,
      warehouseId: position.warehouseId,
      quantityDelta: `-${drop}`,
      reason: 'count_correction',
      note: 'The count found fewer on the shelf',
    });
    expect(runsOf(backend, stockFlow)[0]).toMatchObject({
      status: 'succeeded',
      affectedEntityType: 'sku',
      affectedEntityId: position.skuId,
      affectedLabel: `${skuCode} at ${warehouseCode}`,
    });

    const overdueFlow = await active(backend, {
      name: 'Overdue',
      trigger: { type: 'invoice.overdue' },
      conditions: everything('invoice.outstandingUsd'),
      actions: [notifyOwner('Invoice overdue')],
    });
    const current = [...backend.store.dataset.invoices.values()]
      .filter(
        (invoice) =>
          invoice.lifecycle === 'open' &&
          invoice.collectionState === 'current' &&
          invoice.outstanding.minor > 0 &&
          invoice.dueDate >= backend.store.today,
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]!;
    const days = diffDaysFrom(backend.store.today, current.dueDate) + 1;
    const advanced = await backend.demo.advanceClock(24 * Math.max(1, days));
    expect(advanced.effects.workflowRuns).toBeGreaterThan(0);
    const overdueRuns = runsOf(backend, overdueFlow);
    expect(overdueRuns.some((run) => run.affectedEntityId === current.id)).toBe(true);
    expect(overdueRuns.every((run) => run.causedBy === 'usr_system')).toBe(true);
  }, 90_000);

  it('runs a workflow once per event, and writes a skipped run when the conditions do not match', async () => {
    const backend = await tenant();
    const id = await active(backend, {
      name: 'Large only',
      trigger: { type: 'order.created' },
      conditions: everything('order.totalUsd', 1_000_000_000),
      actions: [notifyOwner('Never sent')],
    });
    const order = await draftOrder(backend);
    const [run] = runsOf(backend, id);
    expect(run).toMatchObject({ status: 'skipped', conditionsMet: false });
    expect(run!.actionResults.every((result) => result.status === 'skipped')).toBe(true);
    // The same event dispatched again is the same idempotency key: no second run.
    const tx = new Transaction(backend.runtime, backend.runtime.actor, 'replay');
    tx.enqueue({
      id: run!.triggerEventId,
      type: 'order.created',
      refs: { orderId: order.order.id },
      depth: 1,
      causedBy: backend.runtime.actor.id,
    });
    backend.commands.automation.dispatch(tx);
    expect(runsOf(backend, id)).toHaveLength(1);
  });

  it('puts a workflow whose run failed in error, tells its owner, and keeps the command and its other actions', async () => {
    const backend = await tenant();
    const priya = backend.store.seed.personaUserIds.get('priya-shah')!;
    const created = await backend.workflows.create({
      name: 'Hold changed orders',
      trigger: { type: 'order.value_changed' },
      conditions: everything('order.totalUsd'),
      actions: [{ type: 'place_order_on_hold', config: { reason: 'Re-check credit' } }],
      ownerId: priya,
    });
    await backend.workflows.activate(created.id, { ifMatch: created.metadata.version });
    const partial = await active(backend, {
      name: 'Notify then hold',
      trigger: { type: 'order.value_changed' },
      conditions: everything('order.totalUsd'),
      actions: [
        notifyOwner('Order changed'),
        { type: 'place_order_on_hold', config: { reason: 'x' } },
      ],
    });
    const order = await draftOrder(backend);
    const edited = await backend.orders.update(
      order.order.id,
      { lineQuantities: { [order.lines[0]!.id]: '4' } },
      { ifMatch: order.order.metadata.version },
    );
    expect(edited.lines[0]!.orderedQuantity).toBe('4');
    const [failed] = runsOf(backend, created.id);
    expect(failed).toMatchObject({ status: 'failed', errorCode: 'ACTION_REFUSED' });
    expect(failed!.actionResults[0]!.message).toBe(
      'Order in status draft cannot be placed on hold',
    );
    const after = await backend.workflows.get(created.id);
    expect(after.workflow.status).toBe('error');
    expect(after.workflow.lastFailure).toMatchObject({
      runId: failed!.id,
      errorCode: 'ACTION_REFUSED',
    });
    expect(
      [...backend.store.dataset.notifications.values()].some(
        (notification) => notification.userId === priya && notification.entityId === created.id,
      ),
    ).toBe(true);
    const [mixed] = runsOf(backend, partial);
    expect(mixed!.status).toBe('partially_failed');
    expect((await backend.orders.get(order.order.id)).order.status).toBe('draft');
    expect((await backend.workflows.get(partial)).workflow.status).toBe('active');

    // An edit takes a workflow in error to paused; it runs again once activated.
    const fixed = await backend.workflows.update(
      created.id,
      {
        conditions: {
          type: 'group',
          operator: 'and',
          children: [
            { type: 'condition', field: 'order.status', operator: 'eq', value: 'confirmed' },
          ],
        },
      },
      { ifMatch: after.workflow.metadata.version },
    );
    expect(fixed.status).toBe('paused');
  });

  it('stops a chain at its sixth workflow with WORKFLOW_RECURSION_LIMIT', async () => {
    const backend = await tenant();
    const hold = await active(backend, {
      name: 'Hold the customer of an escalation',
      trigger: { type: 'ticket.escalated' },
      conditions: everything('customer.creditUtilizationBps'),
      actions: [{ type: 'place_customer_on_hold', config: { reason: 'Escalated by support' } }],
    });
    const chained = await active(backend, {
      name: 'Tell the owner of a held customer',
      trigger: { type: 'customer.status_changed' },
      conditions: {
        type: 'group',
        operator: 'and',
        children: [
          { type: 'condition', field: 'customer.status', operator: 'eq', value: 'on_hold' },
        ],
      },
      actions: [
        { type: 'send_notification', config: { recipient: 'account_owner', title: 'On hold' } },
      ],
    });
    const ticket = (
      await backend.support.tickets.list({ pageSize: 50, filter: { status: { eq: 'open' } } })
    ).data.find(
      (candidate) => backend.store.dataset.customers.get(candidate.customerId)?.status === 'active',
    )!;
    await backend.support.tickets.escalate(
      ticket.id,
      { reason: 'Down' },
      { ifMatch: ticket.metadata.version },
    );
    const [first] = runsOf(backend, hold);
    const [second] = runsOf(backend, chained);
    expect(first).toMatchObject({ status: 'succeeded', chainDepth: 1 });
    expect(second).toMatchObject({ status: 'succeeded', chainDepth: 2, parentRunId: first!.id });

    const tx = new Transaction(backend.runtime, backend.runtime.actor, 'chain');
    tx.enqueue({
      id: 'evt_deep',
      type: 'customer.status_changed',
      refs: { customerId: ticket.customerId },
      depth: 6,
      causedBy: backend.runtime.actor.id,
    });
    backend.commands.automation.dispatch(tx);
    const deep = runsOf(backend, chained).find((run) => run.triggerEventId === 'evt_deep')!;
    expect(deep).toMatchObject({
      status: 'failed',
      errorCode: 'WORKFLOW_RECURSION_LIMIT',
      chainDepth: 6,
    });
    expect(deep.actionResults.every((result) => result.status === 'skipped')).toBe(true);
    expect(backend.store.dataset.workflows.get(chained)!.status).toBe('error');
  });

  it('writes what an action does as the automation actor, in the audit and the activity', async () => {
    const backend = await tenant();
    const aisha = backend.store.seed.personaUserIds.get('aisha-grant')!;
    await active(backend, {
      name: 'Hand escalations to Aisha',
      trigger: { type: 'ticket.escalated' },
      conditions: everything('customer.creditUtilizationBps'),
      actions: [
        { type: 'assign_user', config: { assignee: aisha } },
        { type: 'add_tag', config: { record: 'ticket', tag: 'escalation-desk' } },
        { type: 'place_customer_on_hold', config: { reason: 'Escalated' } },
      ],
    });
    const ticket = (
      await backend.support.tickets.list({ pageSize: 50, filter: { status: { eq: 'open' } } })
    ).data.find(
      (candidate) =>
        candidate.assigneeId !== aisha &&
        backend.store.dataset.customers.get(candidate.customerId)?.status === 'active',
    )!;
    await backend.support.tickets.escalate(
      ticket.id,
      { reason: 'Down' },
      { ifMatch: ticket.metadata.version },
    );
    const after = await backend.support.tickets.get(ticket.id);
    expect(after.ticket.assigneeId).toBe(aisha);
    expect(after.ticket.tags).toContain('escalation-desk');
    const audit = await backend.audit({ filter: { entityId: ticket.id }, pageSize: 50 });
    const assigned = audit.data.find((event) => event.action === 'ticket.assigned')!;
    expect(assigned.actorId).toBe('usr_system_automation');
    expect(assigned.actorName).toBe('Workflow Automation');
    expect(assigned.workflowRunId).toMatch(/^wfr_/);
    const escalatedBy = audit.data.find((event) => event.action === 'ticket.escalated')!;
    expect(escalatedBy.actorId).toBe(backend.runtime.actor.id);
    const activity = await backend.customers.activity(ticket.customerId, { limit: 20 });
    const held = activity.data.find((event) => event.type === 'customer.status_changed')!;
    expect(held.actorId).toBe('usr_system_automation');
    expect(held.metadata?.['workflowName']).toBe('Hand escalations to Aisha');
    expect((await backend.customers.get(ticket.customerId)).customer.status).toBe('on_hold');
  });

  it('gives each action of section 69.3 the effect of the interactive command', async () => {
    const backend = await tenant();
    const sofia = backend.store.seed.personaUserIds.get('sofia-ramirez')!;
    const marcus = backend.store.seed.personaUserIds.get('marcus-lee')!;
    const reviewed = await active(backend, {
      name: 'Review every confirmed order',
      trigger: { type: 'order.confirmed' },
      conditions: everything('order.totalUsd'),
      actions: [
        {
          type: 'send_notification',
          config: { recipient: sofia, title: 'Confirmed', body: 'Look' },
        },
        {
          type: 'create_task',
          config: {
            assignee: 'order_owner',
            title: 'Check the plan',
            priority: 'high',
            dueInDays: 2,
          },
        },
        { type: 'add_tag', config: { record: 'customer', tag: 'reviewed' } },
        { type: 'request_approval', config: { role: 'finance_manager' } },
      ],
    });
    const order = await confirm(backend, await draftOrder(backend));
    const [run] = runsOf(backend, reviewed).filter(
      (entry) => entry.affectedEntityId === order.order.id,
    );
    expect(run!.status).toBe('succeeded');
    const notification = [...backend.store.dataset.notifications.values()].find(
      (entry) => entry.userId === sofia && entry.title === 'Confirmed',
    )!;
    expect(notification).toMatchObject({
      entityType: 'sales_order',
      entityId: order.order.id,
      body: 'Look',
    });
    const task = [...backend.store.dataset.tasks.values()].find(
      (entry) => entry.title === 'Check the plan',
    )!;
    expect(task).toMatchObject({
      assigneeId: order.order.ownerId,
      createdBy: 'usr_system_automation',
      priority: 'high',
      relatedEntityType: 'sales_order',
      relatedEntityId: order.order.id,
      dueDate: addDaysFrom(backend.store.today, 2),
    });
    expect(
      [...backend.store.dataset.notifications.values()].some(
        (entry) =>
          entry.userId === order.order.ownerId &&
          entry.title === 'New task: Check the plan' &&
          entry.entityId === order.order.id,
      ),
    ).toBe(true);
    expect((await backend.customers.get(order.order.customerId)).customer.tags).toContain(
      'reviewed',
    );
    const held = await backend.orders.get(order.order.id);
    expect(held.order.status).toBe('pending_approval');
    const request = backend.store.dataset.approvalRequests.get(held.order.approvalRequestId!)!;
    expect(request.steps.map((step) => step.requiredRole)).toEqual(['finance_manager']);
    expect(request.requestedBy).toBe('usr_system_automation');

    // An order is held as the hold command holds it; a hold already in place is nothing to do.
    const holding = await active(backend, {
      name: 'Hold confirmed orders',
      trigger: { type: 'order.confirmed' },
      conditions: everything('order.totalUsd'),
      actions: [{ type: 'place_order_on_hold', config: { reason: 'Credit review' } }],
    });
    await backend.workflows.pause(reviewed, {
      ifMatch: backend.store.dataset.workflows.get(reviewed)!.metadata.version,
    });
    const second = await confirm(backend, await draftOrder(backend));
    expect(second.order.status).toBe('on_hold');
    expect(second.order.holdReason).toBe('Credit review');
    expect(runsOf(backend, holding).at(-1)!.status).toBe('succeeded');

    // A position below its reorder point gets the draft the buyer would write.
    const drafting = await active(backend, {
      name: 'Draft below reorder point',
      trigger: { type: 'inventory.below_reorder_point' },
      conditions: everything('inventory.reorderPoint'),
      actions: [
        { type: 'create_purchase_order_draft', config: {} },
        { type: 'create_task', config: { assignee: marcus, title: 'Review the draft' } },
      ],
    });
    const position = [...backend.runtime.projections.inventory().values()].find(
      (candidate) =>
        !candidate.belowReorderPoint &&
        backend.store.dataset.skus.get(candidate.skuId)?.quantityPrecision === 0 &&
        Number(candidate.reorderPoint) > 0 &&
        Number(candidate.inbound) === 0 &&
        Number(candidate.available) - Number(candidate.reorderPoint) < 9 &&
        backend.store.dataset.skus.get(candidate.skuId)?.preferredSupplierId !== undefined,
    )!;
    await backend.inventory.adjust({
      skuId: position.skuId,
      warehouseId: position.warehouseId,
      quantityDelta: `-${Number(position.available) - Number(position.reorderPoint) + 1}`,
      reason: 'count_correction',
      note: 'The count found fewer on the shelf',
    });
    const [drafted] = runsOf(backend, drafting);
    expect(drafted!.status).toBe('succeeded');
    const po = [...backend.store.dataset.purchaseOrders.values()].find((candidate) =>
      drafted!.actionResults[0]!.message!.includes(candidate.purchaseOrderNumber),
    )!;
    expect(po).toMatchObject({
      status: 'draft',
      destinationWarehouseId: position.warehouseId,
      buyerId: 'usr_system_automation',
    });
    expect(backend.store.dataset.purchaseOrderLines.size).toBeGreaterThan(0);
  }, 90_000);

  it('runs a daily schedule once a day, a weekly one on its day, and one run for a missed stretch', async () => {
    const backend = await tenant();
    const daily = await active(backend, {
      name: 'Daily',
      trigger: { type: 'schedule.daily', config: { hour: 6 } },
      conditions: everything('metrics.overdueInvoices'),
      actions: [notifyOwner('Daily')],
    });
    const weekly = await active(backend, {
      name: 'Weekly',
      trigger: { type: 'schedule.weekly', config: { weekday: 'monday', hour: 7 } },
      conditions: everything('metrics.pendingApprovals'),
      actions: [notifyOwner('Weekly')],
    });
    // The seed's clock stands on a Friday at 10:00 in Chicago: the next 06:00 is tomorrow's.
    expect(backend.store.today).toBe('2026-09-04');
    await backend.demo.advanceClock(1);
    expect(runsOf(backend, daily)).toHaveLength(0);
    await backend.demo.advanceClock(23);
    expect(runsOf(backend, daily)).toHaveLength(1);
    await backend.demo.advanceClock(1);
    expect(runsOf(backend, daily)).toHaveLength(1);
    expect(runsOf(backend, weekly)).toHaveLength(0);
    // Sunday's and Monday's 06:00 fall in one move of the clock: one run stands for both.
    await backend.demo.advanceClock(47);
    expect(runsOf(backend, daily)).toHaveLength(2);
    expect(runsOf(backend, daily).at(-1)!.occurrences).toBe(2);
    expect(runsOf(backend, weekly)).toHaveLength(1);
    expect(runsOf(backend, weekly)[0]!.triggerEventId).toBe('schedule:2026-09-07');
    // Three weeks at once: one run each, standing for every occurrence it collapses.
    await backend.demo.advanceClock(24 * 21);
    expect(runsOf(backend, daily)).toHaveLength(3);
    expect(runsOf(backend, daily).at(-1)!.occurrences).toBe(21);
    expect(runsOf(backend, weekly)).toHaveLength(2);
    expect(runsOf(backend, weekly).at(-1)!.occurrences).toBe(3);
    expect(runsOf(backend, weekly).at(-1)!.affectedEntityType).toBeUndefined();
  }, 60_000);

  it('refuses a definition section 69.2 refuses, at save, and what would stop a run, at activation', async () => {
    const backend = await tenant();
    const base: Definition = {
      name: 'Checked',
      trigger: { type: 'order.created' },
      conditions: everything('order.totalUsd'),
      actions: [notifyOwner('x')],
    };
    const empty = await expectApiError(
      backend.workflows.create({
        ...base,
        conditions: {
          type: 'group',
          operator: 'and',
          children: [{ type: 'group', operator: 'or', children: [] }],
        },
      }),
      'VALIDATION_FAILED',
    );
    expect(empty.fieldErrors).toEqual([
      expect.objectContaining({ field: 'conditions', code: 'INVALID_CONDITIONS' }),
    ]);
    let deep: ConditionNode = {
      type: 'condition',
      field: 'order.totalUsd',
      operator: 'gt',
      value: 1,
    };
    for (let level = 0; level < 6; level += 1)
      deep = { type: 'group', operator: 'and', children: [deep] };
    await expectApiError(
      backend.workflows.create({ ...base, conditions: deep }),
      'VALIDATION_FAILED',
    );
    const many: ConditionNode = {
      type: 'group',
      operator: 'or',
      children: Array.from({ length: 51 }, (_, value) => ({
        type: 'condition' as const,
        field: 'order.lineCount',
        operator: 'eq' as const,
        value,
      })),
    };
    await expectApiError(
      backend.workflows.create({ ...base, conditions: many }),
      'VALIDATION_FAILED',
    );
    for (const condition of [
      { type: 'condition', field: 'order.customerPoNumber', operator: 'gt', value: 'A' },
      { type: 'condition', field: 'customer.segment', operator: 'in', value: [] },
      { type: 'condition', field: 'ticket.priority', operator: 'eq', value: 'urgent' },
      { type: 'condition', field: '', operator: 'eq', value: 'x' },
    ] as ConditionNode[])
      await expectApiError(
        backend.workflows.create({
          ...base,
          conditions: { type: 'group', operator: 'and', children: [condition] },
        }),
        'VALIDATION_FAILED',
      );
    await expectApiError(
      backend.workflows.create({
        ...base,
        actions: [{ type: 'create_purchase_order_draft', config: {} }],
      }),
      'VALIDATION_FAILED',
    );
    // A draft saves without a title; activation refuses it with the field.
    const draft = await backend.workflows.create({
      ...base,
      actions: [{ type: 'send_notification', config: { recipient: 'workflow_owner' } }],
    });
    const refused = await expectApiError(
      backend.workflows.activate(draft.id, { ifMatch: draft.metadata.version }),
      'VALIDATION_FAILED',
    );
    expect(refused.fieldErrors?.map((error) => error.field)).toEqual(['actions.0.config.title']);
    // The seeded draft names the owner of a quote a scheduled run does not have.
    const seeded = [...backend.store.dataset.workflows.values()].find(
      (workflow) => workflow.status === 'draft',
    )!;
    const noOne = await expectApiError(
      backend.workflows.activate(seeded.id, { ifMatch: seeded.metadata.version }),
      'VALIDATION_FAILED',
    );
    expect(noOne.fieldErrors?.map((error) => error.code)).toContain('TARGET_UNAVAILABLE');
    // An active workflow is edited only into a definition that can run.
    const running = await active(backend, base);
    const current = backend.store.dataset.workflows.get(running)!;
    await expectApiError(
      backend.workflows.update(
        running,
        { actions: [{ type: 'send_notification', config: { recipient: 'workflow_owner' } }] },
        { ifMatch: current.metadata.version },
      ),
      'VALIDATION_FAILED',
    );
    await expectApiError(
      backend.workflows.pause(running, { ifMatch: current.metadata.version - 1 }),
      'STALE_VERSION',
    );
    await expectApiError(
      backend.workflows.activate(running, { ifMatch: current.metadata.version }),
      'INVALID_STATE_TRANSITION',
    );
    const archived = await backend.workflows.archive(running, {
      ifMatch: current.metadata.version,
    });
    await expectApiError(
      backend.workflows.activate(running, { ifMatch: archived.metadata.version }),
      'INVALID_STATE_TRANSITION',
    );
  });

  it('lets a holder of workflows.view own a workflow, and only the administrator write one', async () => {
    const backend = await tenant();
    const marcus = backend.store.seed.personaUserIds.get('marcus-lee')!;
    const priya = backend.store.seed.personaUserIds.get('priya-shah')!;
    const base: Definition = {
      name: 'Owned',
      trigger: { type: 'order.created' },
      conditions: everything('order.totalUsd'),
      actions: [notifyOwner('x')],
    };
    const refused = await expectApiError(
      backend.workflows.create({ ...base, ownerId: marcus }),
      'VALIDATION_FAILED',
    );
    expect(refused.fieldErrors?.map((error) => error.field)).toEqual(['ownerId']);
    expect((await backend.workflows.create({ ...base, ownerId: priya })).ownerName).toBe(
      'Priya Shah',
    );
    const owners = (await backend.workflows.catalog()).owners.map((owner) => owner.id);
    expect(owners).toContain(priya);
    expect(owners).not.toContain(marcus);
    expect(
      [...backend.store.dataset.workflows.values()].every((workflow) =>
        owners.includes(workflow.ownerId),
      ),
    ).toBe(true);
    await backend.demo.setPersona('sofia-ramirez');
    expect((await backend.workflows.list({ pageSize: 50 })).page.totalItems).toBeGreaterThan(0);
    await expectApiError(backend.workflows.create(base), 'FORBIDDEN');
    await backend.demo.setPersona('marcus-lee');
    await expectApiError(backend.workflows.list({}), 'FORBIDDEN');
  });

  it('seeds a workflow in each state of section 15, and runs the engine would write', async () => {
    const backend = await tenant();
    const workflows = [...backend.store.dataset.workflows.values()];
    expect(new Set(workflows.map((workflow) => workflow.status))).toEqual(
      new Set(['draft', 'active', 'paused', 'error', 'archived']),
    );
    const fixtures = backend.demo.fixtures();
    const nested = backend.store.dataset.workflows.get(
      fixtures['edge.workflow.nested_conditions']!,
    )!;
    expect(
      nested.conditions.type === 'group' &&
        nested.conditions.children.some((child) => child.type === 'group'),
    ).toBe(true);
    const failed = backend.store.dataset.workflowRuns.get(fixtures['edge.workflow.failed_run']!)!;
    expect(failed).toMatchObject({
      status: 'failed',
      errorCode: 'ACTION_REFUSED',
      affectedEntityType: 'sales_order',
    });
    expect(backend.store.dataset.workflows.get(failed.workflowId)!.status).toBe('error');
    for (const workflow of workflows) {
      const runs = runsOf(backend, workflow.id);
      expect(workflow.runCount, workflow.name).toBe(runs.length);
      if (runs.length > 0)
        expect(workflow.lastRunAt).toBe(
          runs
            .map((run) => run.startedAt)
            .sort()
            .at(-1),
        );
      for (const run of runs) {
        expect(run.startedAt <= backend.store.now, run.id).toBe(true);
        if (run.id === failed.id) continue;
        const refs =
          run.triggerType === 'order.confirmed'
            ? { orderId: run.affectedEntityId! }
            : run.triggerType === 'invoice.overdue'
              ? { invoiceId: run.affectedEntityId! }
              : run.triggerType === 'ticket.escalated'
                ? { ticketId: run.affectedEntityId! }
                : run.triggerType === 'customer.status_changed'
                  ? { customerId: run.affectedEntityId!, previousStatus: 'active' }
                  : {};
        const date = run.triggerEventId.replace('schedule:', '');
        const subject = backend.commands.automation.subjectOf({
          id: run.triggerEventId,
          type: run.triggerType,
          refs,
          depth: 1,
          causedBy: run.causedBy,
          ...(run.triggerType.startsWith('schedule')
            ? { schedule: { date, weekday: 'monday', hour: 7, occurrences: 1 } }
            : {}),
        });
        expect(evaluateConditions(workflow.conditions, subject), run.id).toBe(run.conditionsMet);
        // A run that says an action succeeded wrote what that action writes.
        if (run.status === 'succeeded' && workflow.actions[0]?.type === 'send_notification')
          expect(
            [...backend.store.dataset.notifications.values()].some(
              (notification) =>
                notification.createdAt === run.startedAt &&
                notification.title === workflow.actions[0]!.config['title'],
            ),
            run.id,
          ).toBe(true);
      }
    }
  });

  it('seeds no workflow for a new tenant, and runs the escalation a support incident writes', async () => {
    const fresh = createNexoraBackend({ scenario: 'new_tenant', latency: 'none' });
    expect((await fresh.workflows.list({})).page.totalItems).toBe(0);
    const incident = await tenant({ scenario: 'support_incident' });
    const escalated = [...incident.store.dataset.tickets.values()].find(
      (ticket) => ticket.id === 'tkt_700001',
    )!;
    expect(escalated.status).toBe('escalated');
    const runs = [...incident.store.dataset.workflowRuns.values()].filter(
      (run) => run.affectedEntityId === escalated.id,
    );
    expect(runs).toHaveLength(1);
    expect(runs[0]!.triggerType).toBe('ticket.escalated');
  }, 60_000);

  it('reads what a workflow did in fourteen days as its runs add up, and its last outcomes in order', async () => {
    const backend = await tenant();
    const id = backend.demo.fixtures()['edge.workflow.nested_conditions']!;
    const { insight, workflow } = await backend.workflows.get(id);
    const runs = runsOf(backend, id);
    const from = businessDateOf(
      new Date(Date.parse(backend.store.now) - 13 * 86_400_000).toISOString(),
    );
    const kept = runs.filter((run) => businessDateOf(run.startedAt) >= from);
    expect(insight.days).toHaveLength(14);
    expect(insight.events).toBe(kept.length);
    expect(
      insight.days.reduce(
        (sum, day) => sum + day.succeeded + day.partially_failed + day.failed + day.skipped,
        0,
      ),
    ).toBe(kept.length);
    expect(insight.matched).toBe(kept.filter((run) => run.conditionsMet).length);
    expect(
      insight.actions[0]!.succeeded + insight.actions[0]!.failed + insight.actions[0]!.skipped,
    ).toBe(insight.matched);
    const busiest = insight.days.reduce((top, day) =>
      day.skipped + day.succeeded > top.skipped + top.succeeded ? day : top,
    );
    const onDay = await backend.workflows.runs(id, {
      pageSize: 25,
      filter: { startedOn: { eq: busiest.date } },
    });
    expect(onDay.page.totalItems).toBe(
      busiest.succeeded + busiest.partially_failed + busiest.failed + busiest.skipped,
    );
    const newest = [...runs]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt) || b.id.localeCompare(a.id))
      .slice(0, 12);
    expect(workflow.recentOutcomes).toEqual(newest.reverse().map((run) => run.status));
  });

  it('takes back the audit of a write it takes back, and a failed action only its own writes', async () => {
    const backend = await tenant();
    const before = backend.store.dataset.auditEvents.size;
    const tx = new Transaction(backend.runtime, backend.runtime.actor, 'rolled-back');
    tx.audit('test.written', 'customer', 'cus_000001');
    const mark = tx.savepoint();
    tx.audit('test.later', 'customer', 'cus_000001');
    tx.rollbackTo(mark);
    expect(backend.store.dataset.auditEvents.size).toBe(before + 1);
    tx.rollback();
    expect(backend.store.dataset.auditEvents.size).toBe(before);
  });

  it('answers each trigger’s fields with the tenant’s options, and the people an action can name', async () => {
    const backend = await tenant();
    const catalog = await backend.workflows.catalog();
    expect(catalog.triggers.map((trigger) => trigger.type)).toHaveLength(9);
    const stock = catalog.triggers.find(
      (trigger) => trigger.type === 'inventory.below_reorder_point',
    )!;
    expect(
      stock.fields.find((field) => field.path === 'warehouse.code')!.options!.length,
    ).toBeGreaterThan(0);
    expect(catalog.people.some((person) => person.id.startsWith('usr_system'))).toBe(false);
    for (const trigger of catalog.triggers)
      for (const field of trigger.fields)
        expect(field.options === undefined || field.options.length > 0, field.path).toBe(true);
  });
});

function diffDaysFrom(later: string, earlier: string): number {
  return Math.round((Date.parse(earlier) - Date.parse(later)) / 86_400_000);
}

function addDaysFrom(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
