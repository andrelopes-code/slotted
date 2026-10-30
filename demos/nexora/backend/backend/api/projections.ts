import {
  addDays,
  allocationStatusOf,
  businessDateOf,
  compareDates,
  diffDays,
  fulfillmentStatusOf,
  invoiceStatusOf,
  milliToQuantity,
  paymentStatusOf,
  quantityToMilli,
  ratioBps,
  roundHalfUp,
  startOfMonth,
  addMoney,
  money,
  usd,
  usdMinor,
  type Customer,
  type CustomerFinancialSummary,
  type CustomerHealth,
  type FinanceOverview,
  type InventoryBalance,
  type Invoice,
  type Money,
  type SalesOrder,
  type Sku,
  type StockMovement,
  type SupplierPerformance,
} from '../domain';
import type { Indexes } from './indexes';
import type { Store } from './store';

export interface InventoryPosition extends InventoryBalance {
  sellableOnHand: string;
  /** min_max policies: available + inbound (section 57.4). */
  inventoryPosition: string;
  belowReorderPoint: boolean;
  belowSafetyStock: boolean;
  reorderSuggested: boolean;
  suggestedQuantity: string;
  /** Open sales demand (ordered − cancelled − fulfilled) not covered by reservations. */
  backordered: string;
}

/**
 * Projections (sections 56.3, 60.2, 65.7, 66.6, 72). Every function reads the
 * store and returns fresh values; callers cache through `ProjectionCache`.
 */
export class Projections {
  private inventoryCache: Map<string, InventoryPosition> | undefined;
  private summaryCache = new Map<string, CustomerFinancialSummary>();
  private historyByCustomer:
    | Map<
        string,
        {
          lifetimeNet: number;
          lifetimeCost: number;
          orders12: number;
          value12: number;
          orders: number;
        }
      >
    | undefined;
  private supplierCache = new Map<string, SupplierPerformance>();
  private lastShipmentCache: Map<string, string> | undefined;

  constructor(
    private readonly store: Store,
    private readonly indexes: Indexes,
  ) {
    store.subscribe((collection, entity, kind) => {
      switch (collection) {
        case 'reservations':
        case 'stockMovements': {
          const record = entity as { skuId?: string; warehouseId?: string } | undefined;
          if (collection === 'stockMovements') this.noteShipment(entity as StockMovement, kind);
          if (record?.skuId && record.warehouseId)
            this.refreshInventoryKey(`${record.skuId}:${record.warehouseId}`);
          else this.inventoryCache = undefined;
          break;
        }
        case 'salesOrderLines': {
          const line = entity as { skuId?: string; preferredWarehouseId?: string } | undefined;
          if (line?.skuId && line.preferredWarehouseId)
            this.refreshInventoryKey(`${line.skuId}:${line.preferredWarehouseId}`);
          else this.inventoryCache = undefined;
          break;
        }
        case 'purchaseOrderLines': {
          const line = entity as { skuId?: string; purchaseOrderId?: string } | undefined;
          const po = line?.purchaseOrderId
            ? this.store.dataset.purchaseOrders.get(line.purchaseOrderId)
            : undefined;
          if (line?.skuId && po)
            this.refreshInventoryKey(`${line.skuId}:${po.destinationWarehouseId}`);
          else this.inventoryCache = undefined;
          break;
        }
        case 'purchaseOrders':
        case 'transfers':
        case 'transferLines':
        case 'skus':
        case 'salesOrders':
          if (kind !== 'invalidate' || collection !== 'salesOrders')
            this.inventoryCache = undefined;
          break;
        default:
          break;
      }
      if (
        [
          'invoices',
          'payments',
          'paymentAllocations',
          'creditMemos',
          'creditMemoApplications',
          'salesOrders',
          'tickets',
          'customers',
        ].includes(collection)
      )
        this.summaryCache.clear();
      if (
        ['purchaseOrders', 'goodsReceiptLines', 'purchaseOrderLines', 'goodsReceipts'].includes(
          collection,
        )
      )
        this.supplierCache.clear();
    });
  }

  /** A shipment written keeps the last-shipment date current; anything else read again from nothing. */
  private noteShipment(
    movement: StockMovement | undefined,
    kind: 'put' | 'delete' | 'invalidate',
  ): void {
    if (!this.lastShipmentCache) return;
    if (kind !== 'put' || !movement) {
      this.lastShipmentCache = undefined;
      return;
    }
    if (movement.type !== 'shipment') return;
    const key = `${movement.skuId}:${movement.warehouseId}`;
    const date = businessDateOf(movement.occurredAt);
    const known = this.lastShipmentCache.get(key);
    if (known === undefined || compareDates(date, known) > 0) this.lastShipmentCache.set(key, date);
  }

  /**
   * The business date of the last shipment out of a position, among the movements Nexora keeps
   * (section 75.4): absent when nothing shipped from it since the operational window opened.
   */
  lastShipmentOn(skuId: string, warehouseId: string): string | undefined {
    if (!this.lastShipmentCache) {
      const cache = new Map<string, string>();
      // The business day of an instant depends on its hour alone: one conversion per hour, not per movement.
      const byHour = new Map<string, string>();
      for (const movement of this.store.dataset.stockMovements.values()) {
        if (movement.type !== 'shipment') continue;
        const key = `${movement.skuId}:${movement.warehouseId}`;
        const hour = movement.occurredAt.slice(0, 13);
        let date = byHour.get(hour);
        if (date === undefined) {
          date = businessDateOf(`${hour}:00:00Z`);
          byHour.set(hour, date);
        }
        const known = cache.get(key);
        if (known === undefined || compareDates(date, known) > 0) cache.set(key, date);
      }
      this.lastShipmentCache = cache;
    }
    return this.lastShipmentCache.get(`${skuId}:${warehouseId}`);
  }

  /** Recomputes one sku:warehouse position from indexes (incremental cache maintenance). */
  private refreshInventoryKey(key: string): void {
    if (!this.inventoryCache) return;
    const [skuId, warehouseId] = key.split(':') as [string, string];
    const position = this.computePosition(skuId, warehouseId);
    if (position) this.inventoryCache.set(key, position);
    else this.inventoryCache.delete(key);
  }

  private computePosition(skuId: string, warehouseId: string): InventoryPosition | undefined {
    const key = `${skuId}:${warehouseId}`;
    let onHand = 0;
    let damaged = 0;
    let quarantine = 0;
    let reserved = 0;
    let inbound = 0;
    let demand = 0;
    let any = false;
    for (const movement of this.indexes.movementsBySkuWarehouse.get(key)) {
      any = true;
      onHand += quantityToMilli(movement.onHandDelta);
      damaged += quantityToMilli(movement.damagedDelta);
      quarantine += quantityToMilli(movement.quarantineDelta);
    }
    for (const reservation of this.indexes.reservationsBySkuWarehouse.get(key)) {
      if (reservation.status !== 'active') continue;
      any = true;
      reserved +=
        quantityToMilli(reservation.quantity) - quantityToMilli(reservation.consumedQuantity);
    }
    for (const line of this.indexes.poLinesBySku.get(skuId)) {
      const po = this.store.dataset.purchaseOrders.get(line.purchaseOrderId);
      if (!po || po.destinationWarehouseId !== warehouseId) continue;
      if (
        po.status !== 'sent' &&
        po.status !== 'acknowledged' &&
        po.status !== 'partially_received'
      )
        continue;
      const open =
        quantityToMilli(line.orderedQuantity) -
        quantityToMilli(line.receivedAcceptedQuantity) -
        quantityToMilli(line.receivedDamagedQuantity) -
        quantityToMilli(line.rejectedQuantity);
      if (open > 0) {
        any = true;
        inbound += open;
      }
    }
    for (const line of this.indexes.transferLinesBySku.get(skuId)) {
      const transfer = this.store.dataset.transfers.get(line.transferId);
      if (!transfer || transfer.destinationWarehouseId !== warehouseId) continue;
      if (transfer.status !== 'in_transit' && transfer.status !== 'partially_received') continue;
      const open = quantityToMilli(line.shippedQuantity) - quantityToMilli(line.receivedQuantity);
      if (open > 0) {
        any = true;
        inbound += open;
      }
    }
    for (const line of this.indexes.linesBySkuWarehouse.get(key)) {
      const order = this.store.dataset.salesOrders.get(line.orderId);
      if (!order || (order.status !== 'confirmed' && order.status !== 'on_hold')) continue;
      const open =
        quantityToMilli(line.orderedQuantity) -
        quantityToMilli(line.cancelledQuantity) -
        quantityToMilli(line.fulfilledQuantity);
      const uncovered = open - quantityToMilli(line.reservedQuantity);
      if (uncovered > 0) {
        any = true;
        demand += uncovered;
      }
    }
    if (!any) return undefined;
    return this.describePosition(skuId, warehouseId, {
      onHand,
      damaged,
      quarantine,
      reserved,
      inbound,
      demand,
    });
  }

  private describePosition(
    skuId: string,
    warehouseId: string,
    entry: {
      onHand: number;
      damaged: number;
      quarantine: number;
      reserved: number;
      inbound: number;
      demand: number;
    },
  ): InventoryPosition {
    const { dataset } = this.store;
    const sku = dataset.skus.get(skuId);
    const precision = sku?.quantityPrecision ?? 0;
    const sellable = entry.onHand - entry.damaged - entry.quarantine;
    const available = Math.max(0, sellable - entry.reserved);
    const reorderPoint = sku?.reorderPolicy.reorderPoint
      ? quantityToMilli(sku.reorderPolicy.reorderPoint)
      : 0;
    const safetyStock = sku?.reorderPolicy.safetyStock
      ? quantityToMilli(sku.reorderPolicy.safetyStock)
      : 0;
    const maxStock = sku?.reorderPolicy.maxStock ? quantityToMilli(sku.reorderPolicy.maxStock) : 0;
    const inventoryPosition = available + entry.inbound;
    const minMax = sku?.reorderPolicy.mode === 'min_max';
    const reorderSuggested = minMax && inventoryPosition <= reorderPoint;
    return {
      organizationId: dataset.organization.id,
      skuId,
      warehouseId,
      onHand: milliToQuantity(entry.onHand, precision),
      damaged: milliToQuantity(entry.damaged, precision),
      quarantine: milliToQuantity(entry.quarantine, precision),
      reserved: milliToQuantity(entry.reserved, precision),
      available: milliToQuantity(available, precision),
      inbound: milliToQuantity(entry.inbound, precision),
      safetyStock: milliToQuantity(safetyStock, precision),
      reorderPoint: milliToQuantity(reorderPoint, precision),
      projectedAt: this.store.now,
      sellableOnHand: milliToQuantity(sellable, precision),
      inventoryPosition: milliToQuantity(inventoryPosition, precision),
      belowReorderPoint: minMax && available <= reorderPoint,
      belowSafetyStock: minMax && available < safetyStock,
      reorderSuggested,
      suggestedQuantity: milliToQuantity(
        reorderSuggested ? Math.max(0, maxStock - inventoryPosition) : 0,
        precision,
      ),
      backordered: milliToQuantity(entry.demand, precision),
    };
  }

  // ---------------------------------------------------------------------------
  // Inventory (section 60)

  private buildInventory(): Map<string, InventoryPosition> {
    const { dataset } = this.store;
    const positions = new Map<
      string,
      {
        onHand: number;
        damaged: number;
        quarantine: number;
        reserved: number;
        inbound: number;
        demand: number;
      }
    >();
    const position = (key: string) => {
      let entry = positions.get(key);
      if (!entry) {
        entry = { onHand: 0, damaged: 0, quarantine: 0, reserved: 0, inbound: 0, demand: 0 };
        positions.set(key, entry);
      }
      return entry;
    };
    for (const movement of dataset.stockMovements.values()) {
      const entry = position(`${movement.skuId}:${movement.warehouseId}`);
      entry.onHand += quantityToMilli(movement.onHandDelta);
      entry.damaged += quantityToMilli(movement.damagedDelta);
      entry.quarantine += quantityToMilli(movement.quarantineDelta);
    }
    for (const reservation of dataset.reservations.values()) {
      if (reservation.status !== 'active') continue;
      position(`${reservation.skuId}:${reservation.warehouseId}`).reserved +=
        quantityToMilli(reservation.quantity) - quantityToMilli(reservation.consumedQuantity);
    }
    for (const po of dataset.purchaseOrders.values()) {
      if (
        po.status !== 'sent' &&
        po.status !== 'acknowledged' &&
        po.status !== 'partially_received'
      )
        continue;
      for (const line of this.indexes.poLinesByPo.get(po.id)) {
        const open =
          quantityToMilli(line.orderedQuantity) -
          quantityToMilli(line.receivedAcceptedQuantity) -
          quantityToMilli(line.receivedDamagedQuantity) -
          quantityToMilli(line.rejectedQuantity);
        if (open > 0) position(`${line.skuId}:${po.destinationWarehouseId}`).inbound += open;
      }
    }
    for (const transfer of dataset.transfers.values()) {
      if (transfer.status !== 'in_transit' && transfer.status !== 'partially_received') continue;
      for (const line of this.indexes.transferLinesByTransfer.get(transfer.id)) {
        const open = quantityToMilli(line.shippedQuantity) - quantityToMilli(line.receivedQuantity);
        if (open > 0) position(`${line.skuId}:${transfer.destinationWarehouseId}`).inbound += open;
      }
    }
    for (const order of dataset.salesOrders.values()) {
      if (order.status !== 'confirmed' && order.status !== 'on_hold') continue;
      for (const line of this.indexes.linesByOrder.get(order.id)) {
        const open =
          quantityToMilli(line.orderedQuantity) -
          quantityToMilli(line.cancelledQuantity) -
          quantityToMilli(line.fulfilledQuantity);
        const uncovered = open - quantityToMilli(line.reservedQuantity);
        if (uncovered > 0)
          position(`${line.skuId}:${line.preferredWarehouseId}`).demand += uncovered;
      }
    }
    const result = new Map<string, InventoryPosition>();
    for (const [key, entry] of positions) {
      const [skuId, warehouseId] = key.split(':') as [string, string];
      result.set(key, this.describePosition(skuId, warehouseId, entry));
    }
    return result;
  }

  inventory(): Map<string, InventoryPosition> {
    if (!this.inventoryCache) this.inventoryCache = this.buildInventory();
    return this.inventoryCache;
  }

  inventoryAt(skuId: string, warehouseId: string): InventoryPosition {
    const found = this.inventory().get(`${skuId}:${warehouseId}`);
    if (found) return found;
    const sku = this.store.dataset.skus.get(skuId);
    const precision = sku?.quantityPrecision ?? 0;
    const zero = milliToQuantity(0, precision);
    return {
      organizationId: this.store.dataset.organization.id,
      skuId,
      warehouseId,
      onHand: zero,
      damaged: zero,
      quarantine: zero,
      reserved: zero,
      available: zero,
      inbound: zero,
      safetyStock: sku?.reorderPolicy.safetyStock ?? zero,
      reorderPoint: sku?.reorderPolicy.reorderPoint ?? zero,
      projectedAt: this.store.now,
      sellableOnHand: zero,
      inventoryPosition: zero,
      belowReorderPoint: sku?.reorderPolicy.mode === 'min_max',
      belowSafetyStock:
        sku?.reorderPolicy.mode === 'min_max' &&
        quantityToMilli(sku.reorderPolicy.safetyStock ?? '0') > 0,
      reorderSuggested: sku?.reorderPolicy.mode === 'min_max',
      suggestedQuantity: sku?.reorderPolicy.maxStock ?? zero,
      backordered: zero,
    };
  }

  /** Warehouse-level positions for one SKU. */
  inventoryForSku(skuId: string): InventoryPosition[] {
    const result: InventoryPosition[] = [];
    for (const warehouse of this.store.dataset.warehouses.values()) {
      const found = this.inventory().get(`${skuId}:${warehouse.id}`);
      if (found) result.push(found);
    }
    return result;
  }

  /** Section 72.8 inventory value at standard cost, USD. */
  inventoryValue(): Money {
    let minor = 0;
    for (const position of this.inventory().values()) {
      const sku = this.store.dataset.skus.get(position.skuId);
      if (!sku) continue;
      const physical = quantityToMilli(position.onHand);
      minor += roundHalfUp((sku.standardCost.minor * physical) / 1000);
    }
    return usd(minor);
  }

  // ---------------------------------------------------------------------------
  // Orders (section 59.1) and invoices (section 66.6)

  /** Recomputes the derived dimensions of an order from its lines and invoices. */
  recalculateOrder(order: SalesOrder): void {
    const lines = this.indexes.linesByOrder.get(order.id);
    for (const line of lines) {
      let reserved = 0;
      for (const reservation of this.indexes.reservationsByLine.get(line.id)) {
        if (reservation.status === 'active')
          reserved +=
            quantityToMilli(reservation.quantity) - quantityToMilli(reservation.consumedQuantity);
      }
      const next = milliToQuantity(reserved);
      if (next !== line.reservedQuantity) {
        line.reservedQuantity = next;
        this.store.invalidate('salesOrderLines', line);
      }
    }
    order.allocationStatus = allocationStatusOf(lines);
    order.fulfillmentStatus = fulfillmentStatusOf(lines);
    order.invoiceStatus = invoiceStatusOf(lines);
    order.paymentStatus = paymentStatusOf(this.indexes.invoicesByOrder.get(order.id));
    const shortage = lines.some(
      (line) =>
        quantityToMilli(line.orderedQuantity) -
          quantityToMilli(line.cancelledQuantity) -
          quantityToMilli(line.fulfilledQuantity) -
          quantityToMilli(line.reservedQuantity) >
        0,
    );
    const flags = new Set(order.riskFlags);
    if (shortage && (order.status === 'confirmed' || order.status === 'on_hold'))
      flags.add('inventory_shortage');
    else flags.delete('inventory_shortage');
    if (
      order.requestedDeliveryDate &&
      shortage &&
      compareDates(order.requestedDeliveryDate, this.store.today) < 0
    )
      flags.add('requested_date_at_risk');
    else flags.delete('requested_date_at_risk');
    order.riskFlags = [...flags];
  }

  /** Recomputes paid/outstanding/settlement/collection for an invoice. */
  recalculateInvoice(invoice: Invoice): void {
    let paid = 0;
    for (const allocation of this.indexes.allocationsByInvoice.get(invoice.id))
      if (allocation.status === 'active') paid += allocation.amount.minor;
    for (const application of this.indexes.applicationsByInvoice.get(invoice.id))
      if (application.status === 'active') paid += application.amount.minor;
    invoice.paidAmount = { currency: invoice.currency, minor: paid };
    const outstanding = Math.max(0, invoice.total.minor - paid - invoice.writtenOffAmount.minor);
    invoice.outstanding = { currency: invoice.currency, minor: outstanding };
    invoice.settlement = outstanding === 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'unpaid';
    if (invoice.collectionState !== 'disputed') {
      invoice.collectionState =
        invoice.lifecycle === 'open' &&
        outstanding > 0 &&
        compareDates(this.store.today, invoice.dueDate) > 0
          ? 'overdue'
          : 'current';
    }
  }

  /** Re-evaluates overdue state for every open invoice (demo clock changes). */
  /** Re-derives each open invoice's collection state; answers the invoices that became overdue. */
  refreshCollectionStates(): Invoice[] {
    const becameOverdue: Invoice[] = [];
    for (const invoice of this.store.dataset.invoices.values()) {
      if (invoice.lifecycle !== 'open' || invoice.collectionState === 'disputed') continue;
      const overdue =
        invoice.outstanding.minor > 0 && compareDates(this.store.today, invoice.dueDate) > 0;
      if (overdue && invoice.collectionState !== 'overdue') becameOverdue.push(invoice);
      invoice.collectionState = overdue ? 'overdue' : 'current';
    }
    this.summaryCache.clear();
    return becameOverdue;
  }

  // ---------------------------------------------------------------------------
  // Customers (section 56.3)

  private historyAggregates(): Map<
    string,
    { lifetimeNet: number; lifetimeCost: number; orders12: number; value12: number; orders: number }
  > {
    if (this.historyByCustomer) return this.historyByCustomer;
    const map = new Map<
      string,
      {
        lifetimeNet: number;
        lifetimeCost: number;
        orders12: number;
        value12: number;
        orders: number;
      }
    >();
    const cutoff = addDays(this.store.today, -365);
    for (const summary of this.store.history.summaries) {
      if (summary.kind === 'cancelled' || summary.kind === 'draft') continue;
      let entry = map.get(summary.customerId);
      if (!entry) {
        entry = { lifetimeNet: 0, lifetimeCost: 0, orders12: 0, value12: 0, orders: 0 };
        map.set(summary.customerId, entry);
      }
      entry.lifetimeNet += summary.subtotalMinor + summary.freightMinor;
      entry.lifetimeCost += summary.costMinor;
      entry.orders += 1;
      if (compareDates(summary.orderDate, cutoff) >= 0) {
        entry.orders12 += 1;
        entry.value12 += summary.subtotalMinor + summary.freightMinor;
      }
    }
    this.historyByCustomer = map;
    return map;
  }

  customerSummary(customerId: string): CustomerFinancialSummary {
    const cached = this.summaryCache.get(customerId);
    if (cached) return cached;
    const today = this.store.today;
    const cutoff = addDays(today, -365);
    let gross = 0;
    let overdue = 0;
    let openInvoices = 0;
    let overdueInvoices = 0;
    let lifetimeNet = 0;
    for (const invoice of this.indexes.invoicesByCustomer.get(customerId)) {
      if (invoice.lifecycle === 'open') {
        if (invoice.outstanding.minor > 0) {
          gross += invoice.outstanding.minor;
          openInvoices += 1;
          if (invoice.collectionState === 'overdue') {
            overdue += invoice.outstanding.minor;
            overdueInvoices += 1;
          }
        }
      }
      if (invoice.lifecycle === 'open' || invoice.lifecycle === 'written_off')
        lifetimeNet += invoice.subtotal.minor + invoice.freight.minor;
    }
    let unapplied = 0;
    for (const payment of this.indexes.paymentsByCustomer.get(customerId))
      if (payment.status === 'posted') unapplied += payment.unappliedAmount.minor;
    for (const memo of this.indexes.creditMemosByCustomer.get(customerId)) {
      if (memo.lifecycle === 'open') {
        unapplied += memo.unappliedAmount.minor;
        lifetimeNet -= memo.subtotal.minor;
      }
    }
    let openOrderExposure = 0;
    let openOrders = 0;
    let orders12 = 0;
    let value12 = 0;
    for (const order of this.indexes.ordersByCustomer.get(customerId)) {
      if (
        (order.status === 'confirmed' || order.status === 'on_hold') &&
        (order.approvalStatus === 'approved' || order.approvalStatus === 'not_required')
      ) {
        openOrders += 1;
        let invoiced = 0;
        for (const invoice of this.indexes.invoicesByOrder.get(order.id))
          if (invoice.lifecycle !== 'voided') invoiced += invoice.total.minor;
        openOrderExposure += Math.max(0, order.total.minor - invoiced);
      }
      if (
        order.status !== 'cancelled' &&
        order.status !== 'draft' &&
        compareDates(order.orderDate, cutoff) >= 0
      ) {
        orders12 += 1;
        value12 += order.subtotal.minor + order.freight.minor;
      }
    }
    const history = this.historyAggregates().get(customerId);
    if (history) {
      lifetimeNet += history.lifetimeNet;
      orders12 += history.orders12;
      value12 += history.value12;
    }
    let openTickets = 0;
    for (const ticket of this.indexes.ticketsByCustomer.get(customerId))
      if (ticket.status !== 'closed' && ticket.status !== 'resolved') openTickets += 1;
    const customer = this.store.dataset.customers.get(customerId);
    const currency = customer?.preferredCurrency ?? 'USD';
    const cash = (minor: number): Money => money(minor, currency);
    const creditExposure = gross + openOrderExposure;
    const creditLimit = customer?.creditLimit.minor ?? 0;
    const summary: CustomerFinancialSummary = {
      customerId,
      grossReceivables: cash(gross),
      unappliedCredit: cash(unapplied),
      netReceivables: cash(Math.max(0, gross - unapplied)),
      openOrderExposure: cash(openOrderExposure),
      creditExposure: cash(creditExposure),
      creditUtilizationBps:
        creditLimit === 0
          ? creditExposure > 0
            ? 10_000
            : 0
          : ratioBps(creditExposure, creditLimit),
      overdueReceivables: cash(overdue),
      lifetimeRevenue: cash(lifetimeNet),
      ordersLast12Months: orders12,
      averageOrderValueLast12Months: cash(orders12 === 0 ? 0 : roundHalfUp(value12 / orders12)),
      openInvoiceCount: openInvoices,
      overdueInvoiceCount: overdueInvoices,
      openOrderCount: openOrders,
      openTicketCount: openTickets,
      projectedAt: this.store.now,
    };
    this.summaryCache.set(customerId, summary);
    return summary;
  }

  /** Section 72.12 — account health from receivables, escalations and delays. */
  computeHealth(customer: Customer): CustomerHealth {
    const summary = this.customerSummary(customer.id);
    const limit = customer.creditLimit.minor;
    const overdueShare = limit === 0 ? 0 : summary.overdueReceivables.minor / limit;
    const today = this.store.today;
    let urgentEscalationOld = false;
    let csatSum = 0;
    let csatCount = 0;
    for (const ticket of this.indexes.ticketsByCustomer.get(customer.id)) {
      if (
        (ticket.priority === 'urgent' || ticket.priority === 'high') &&
        ticket.status === 'escalated' &&
        diffDays(today, ticket.metadata.createdAt.slice(0, 10)) > 2
      )
        urgentEscalationOld = true;
      if (
        ticket.satisfactionScore !== undefined &&
        diffDays(today, ticket.metadata.createdAt.slice(0, 10)) <= 90
      ) {
        csatSum += ticket.satisfactionScore;
        csatCount += 1;
      }
    }
    let delayedOrders30 = 0;
    let delayedActive = 0;
    for (const order of this.indexes.ordersByCustomer.get(customer.id)) {
      if (order.status === 'cancelled' || order.status === 'draft') continue;
      const delayed =
        order.riskFlags.includes('requested_date_at_risk') ||
        (order.status === 'confirmed' &&
          order.fulfillmentStatus !== 'fulfilled' &&
          diffDays(today, order.orderDate) > 14);
      if (!delayed) continue;
      if (order.status === 'confirmed' || order.status === 'on_hold') delayedActive += 1;
      if (diffDays(today, order.orderDate) <= 30) delayedOrders30 += 1;
    }
    if (overdueShare > 0.25 || urgentEscalationOld || delayedOrders30 >= 2) return 'at_risk';
    if (overdueShare > 0.1 || delayedActive >= 1 || (csatCount > 0 && csatSum / csatCount < 3.5))
      return 'watch';
    return 'healthy';
  }

  // ---------------------------------------------------------------------------
  // Suppliers (sections 65.7 and 72.10)

  supplierPerformance(supplierId: string): SupplierPerformance {
    const cached = this.supplierCache.get(supplierId);
    if (cached) return cached;
    const today = this.store.today;
    const cutoff = addDays(today, -365);
    let onTime = 0;
    let completed = 0;
    let received = 0;
    let defective = 0;
    let leadSum = 0;
    let leadCount = 0;
    let open = 0;
    let spend = 0;
    for (const po of this.indexes.purchaseOrdersBySupplier.get(supplierId)) {
      if (
        po.status === 'sent' ||
        po.status === 'acknowledged' ||
        po.status === 'partially_received'
      )
        open += 1;
      if (po.status === 'cancelled' || po.status === 'draft') continue;
      if (compareDates(po.createdBusinessDate, cutoff) >= 0)
        spend += usdMinor(po.total, po.fxRateToUsd);
      for (const line of this.indexes.poLinesByPo.get(po.id)) {
        const ordered = quantityToMilli(line.orderedQuantity);
        const accepted = quantityToMilli(line.receivedAcceptedQuantity);
        const damaged = quantityToMilli(line.receivedDamagedQuantity);
        const rejected = quantityToMilli(line.rejectedQuantity);
        received += accepted + damaged + rejected;
        defective += damaged + rejected;
        if (accepted >= ordered * 0.95) {
          completed += 1;
          // Section 72.10: the line is on time when the receipt that satisfies it arrives by its
          // expected date — the receipt whose accepted quantity reaches the line, not the first.
          const receipts = this.indexes.receiptLinesByPoLine
            .get(line.id)
            .map((receiptLine) => ({
              accepted: quantityToMilli(receiptLine.acceptedQuantity),
              at: this.store.dataset.goodsReceipts.get(receiptLine.goodsReceiptId)?.receivedAt,
            }))
            .filter((entry): entry is { accepted: number; at: string } => entry.at !== undefined)
            .sort((a, b) => a.at.localeCompare(b.at));
          let cumulative = 0;
          const completing = receipts.find(
            (entry) => (cumulative += entry.accepted) >= ordered * 0.95,
          );
          if (completing) {
            const receivedDate = businessDateOf(completing.at);
            if (compareDates(receivedDate, line.expectedDate) <= 0) onTime += 1;
            leadSum += diffDays(receivedDate, po.createdBusinessDate);
            leadCount += 1;
          }
        }
      }
    }
    const defectRateBps = received === 0 ? 0 : ratioBps(defective, received);
    const performance: SupplierPerformance = {
      supplierId,
      onTimeDeliveryBps: completed === 0 ? 0 : ratioBps(onTime, completed),
      completedLines: completed,
      onTimeLines: onTime,
      qualityScore: Math.max(0, 100 - defectRateBps / 100),
      defectRateBps,
      averageLeadTimeDays: leadCount === 0 ? 0 : Math.round(leadSum / leadCount),
      openPurchaseOrderCount: open,
      annualSpendUsd: usd(spend),
      projectedAt: this.store.now,
    };
    this.supplierCache.set(supplierId, performance);
    return performance;
  }

  // ---------------------------------------------------------------------------
  // Finance overview (section 72)

  financeOverview(): FinanceOverview {
    const { dataset } = this.store;
    const today = this.store.today;
    let receivables = 0;
    let overdue = 0;
    let openCount = 0;
    let overdueCount = 0;
    let disputedCount = 0;
    let dueSoon = 0;
    let disputed = 0;
    let revenue30 = 0;
    let revenue90 = 0;
    const aging = new Map<
      FinanceOverview['aging'][number]['bucket'],
      { amount: number; count: number }
    >([
      ['current', { amount: 0, count: 0 }],
      ['1-30', { amount: 0, count: 0 }],
      ['31-60', { amount: 0, count: 0 }],
      ['61-90', { amount: 0, count: 0 }],
      ['90+', { amount: 0, count: 0 }],
    ]);
    const overdueByCustomer = new Map<string, number>();
    const cutoff30 = addDays(today, -30);
    const cutoff90 = addDays(today, -90);
    for (const invoice of dataset.invoices.values()) {
      if (invoice.lifecycle === 'open' || invoice.lifecycle === 'written_off') {
        if (compareDates(invoice.issueDate, cutoff90) >= 0) {
          const net = usdMinor(addMoney(invoice.subtotal, invoice.freight), invoice.fxRateToUsd);
          revenue90 += net;
          if (compareDates(invoice.issueDate, cutoff30) >= 0) revenue30 += net;
        }
      }
      if (invoice.lifecycle !== 'open' || invoice.outstanding.minor <= 0) continue;
      const outstandingUsd = usdMinor(invoice.outstanding, invoice.fxRateToUsd);
      receivables += outstandingUsd;
      openCount += 1;
      if (invoice.collectionState === 'disputed') {
        disputedCount += 1;
        disputed += outstandingUsd;
      }
      const daysPastDue = diffDays(today, invoice.dueDate);
      if (daysPastDue >= -5 && daysPastDue <= 0) dueSoon += 1;
      const bucket =
        daysPastDue <= 0
          ? 'current'
          : daysPastDue <= 30
            ? '1-30'
            : daysPastDue <= 60
              ? '31-60'
              : daysPastDue <= 90
                ? '61-90'
                : '90+';
      const entry = aging.get(bucket) as { amount: number; count: number };
      entry.amount += outstandingUsd;
      entry.count += 1;
      if (invoice.collectionState === 'overdue') {
        overdue += outstandingUsd;
        overdueCount += 1;
        overdueByCustomer.set(
          invoice.customerId,
          (overdueByCustomer.get(invoice.customerId) ?? 0) + outstandingUsd,
        );
      }
    }
    for (const memo of dataset.creditMemos.values()) {
      if (memo.lifecycle === 'voided' || memo.lifecycle === 'draft') continue;
      if (compareDates(memo.issueDate, cutoff90) >= 0) {
        const net = usdMinor(memo.subtotal);
        revenue90 -= net;
        if (compareDates(memo.issueDate, cutoff30) >= 0) revenue30 -= net;
      }
    }
    let unapplied = 0;
    for (const payment of dataset.payments.values())
      if (payment.status === 'posted')
        unapplied += usdMinor(payment.unappliedAmount, payment.fxRateToUsd);
    for (const memo of dataset.creditMemos.values())
      if (memo.lifecycle === 'open') unapplied += usdMinor(memo.unappliedAmount);
    // Section 13: cash collected this month, and the payment trend as the last eight weeks of it.
    // Cash is what posted payments brought in on their received date; a reversed payment brought nothing.
    const monthStart = startOfMonth(today);
    const weekCount = 8;
    const firstWeek = addDays(today, -(weekCount * 7 - 1));
    const weeks = Array.from({ length: weekCount }, (_, index) => ({
      weekStart: addDays(firstWeek, index * 7),
      amount: 0,
      count: 0,
    }));
    let cashThisMonth = 0;
    let cashThisMonthCount = 0;
    for (const payment of dataset.payments.values()) {
      if (payment.status !== 'posted' || compareDates(payment.receivedDate, today) > 0) continue;
      const amount = usdMinor(payment.amount, payment.fxRateToUsd);
      if (compareDates(payment.receivedDate, monthStart) >= 0) {
        cashThisMonth += amount;
        cashThisMonthCount += 1;
      }
      const offset = diffDays(payment.receivedDate, firstWeek);
      if (offset < 0) continue;
      const week = weeks[Math.floor(offset / 7)];
      if (week) {
        week.amount += amount;
        week.count += 1;
      }
    }
    // Section 75.4: invoices and payments are kept from the operational window on.
    const keptFrom = this.store.seed.context.operationalStart;
    const dsoKept = compareDates(keptFrom, cutoff90) <= 0;
    let unmatched = 0;
    for (const transaction of dataset.bankTransactions.values())
      if (
        transaction.status === 'unmatched' ||
        transaction.status === 'suggested' ||
        transaction.status === 'needs_review'
      )
        unmatched += 1;
    let pendingApprovals = 0;
    for (const request of dataset.approvalRequests.values())
      if (request.status === 'pending') pendingApprovals += 1;
    const topOverdue = [...overdueByCustomer.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([customerId, amount]) => ({
        customerId,
        displayName: dataset.customers.get(customerId)?.displayName ?? customerId,
        overdue: usd(amount),
      }));
    return {
      asOf: this.store.now,
      receivables: usd(receivables),
      overdueReceivables: usd(overdue),
      unappliedCredit: usd(unapplied),
      invoicedRevenueTrailing30Days: usd(revenue30),
      invoicedRevenueTrailing90Days: usd(revenue90),
      dsoDays: !dsoKept || revenue90 <= 0 ? null : Math.round((receivables / revenue90) * 90),
      ...(!dsoKept
        ? { dsoUndefined: 'not-kept' as const }
        : revenue90 <= 0
          ? { dsoUndefined: 'no-revenue' as const }
          : {}),
      keptFrom,
      openInvoiceCount: openCount,
      overdueInvoiceCount: overdueCount,
      disputedInvoiceCount: disputedCount,
      disputedReceivables: usd(disputed),
      cashCollectedMonthToDate: usd(cashThisMonth),
      paymentsReceivedMonthToDate: cashThisMonthCount,
      cashCollectedByWeek: weeks.map((week) => ({
        weekStart: week.weekStart,
        amount: usd(week.amount),
        count: week.count,
        kept: compareDates(week.weekStart, keptFrom) >= 0,
      })),
      invoicesDueWithin5Days: dueSoon,
      unmatchedBankTransactions: unmatched,
      pendingApprovals,
      aging: [...aging.entries()].map(([bucket, entry]) => ({
        bucket,
        amount: usd(entry.amount),
        count: entry.count,
      })),
      topOverdueCustomers: topOverdue,
    };
  }

  /** Reorder suggestions for a SKU across warehouses (section 57.4). */
  reorderSuggestions(sku: Sku): InventoryPosition[] {
    return this.inventoryForSku(sku.id).filter((position) => position.reorderSuggested);
  }
}
