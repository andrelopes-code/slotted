import {
  addMoney,
  businessDateOf,
  diffDays,
  notFound,
  money,
  roundHalfUp,
  usdMinor,
  type ApprovalRequest,
  type Contact,
  type CurrencyCode,
  type Customer,
  type CustomerFinancialSummary,
  type InventoryReservation,
  type Invoice,
  type Money,
  type Quote,
  type QuoteLine,
  type Return,
  type SalesOrder,
  type SalesOrderLine,
  type Shipment,
  type SupportTicket,
} from '../../domain';
import { yearlyNumber } from '../../data/seed/orders';
import type { InventoryPosition } from '../projections';
import {
  fields,
  runListQuery,
  type ListQuery,
  type ListResponse,
  type ResourceDefinition,
} from '../query';
import type { ApiRuntime } from '../runtime';

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerSegment: Customer['segment'];
  regionCode: Customer['regionCode'];
  currency: CurrencyCode;
  ownerId: string;
  ownerName: string;
  salesTeamId: string;
  orderDate: string;
  requestedDeliveryDate?: string;
  defaultWarehouseId: string;
  status: SalesOrder['status'];
  approvalStatus: SalesOrder['approvalStatus'];
  allocationStatus: SalesOrder['allocationStatus'];
  fulfillmentStatus: SalesOrder['fulfillmentStatus'];
  invoiceStatus: SalesOrder['invoiceStatus'];
  paymentStatus: SalesOrder['paymentStatus'];
  riskFlags: SalesOrder['riskFlags'];
  subtotal: Money;
  total: Money;
  /** Section 72.4's booked value: net merchandise plus freight, excluding tax, in USD at the order's rate. */
  netUsd: Money;
  grossMarginBps: number;
  lineCount: number;
  /** The SKUs the order's lines name; empty for the historical tier, which keeps no lines. */
  skuIds: string[];
  /** Days from the order date to the shipment that completed it; absent until it ships complete. */
  cycleDays?: number;
  customerPoNumber?: string;
  sourceQuoteId?: string;
  updatedAt: string;
  version: number;
  /** True for read-only records from the historical tier (section 75.4). */
  historical: boolean;
}

export interface OrderLineView extends SalesOrderLine {
  skuName: string;
  openQuantity: string;
  backorderedQuantity: string;
  available: string;
}

export interface OrderDetail {
  order: SalesOrder & {
    historical: boolean;
    customerName: string;
    ownerName: string;
    contactName?: string;
    warehouseCode: string;
  };
  lines: OrderLineView[];
  customer: Customer;
  customerSummary: CustomerFinancialSummary;
  contact?: Contact;
  quote?: Quote;
  approval?: ApprovalRequest;
  reservations: InventoryReservation[];
  shipments: (Shipment & { lineCount: number })[];
  invoices: Invoice[];
  returns: Return[];
  tickets: Pick<SupportTicket, 'id' | 'ticketNumber' | 'subject' | 'status' | 'priority'>[];
  inventory: InventoryPosition[];
}

const HISTORICAL_STATUS: Record<
  string,
  {
    status: SalesOrder['status'];
    fulfillment: SalesOrder['fulfillmentStatus'];
    invoice: SalesOrder['invoiceStatus'];
    payment: SalesOrder['paymentStatus'];
    allocation: SalesOrder['allocationStatus'];
  }
> = {
  normal: {
    status: 'closed',
    fulfillment: 'fulfilled',
    invoice: 'invoiced',
    payment: 'paid',
    allocation: 'allocated',
  },
  cancelled: {
    status: 'cancelled',
    fulfillment: 'unfulfilled',
    invoice: 'not_invoiced',
    payment: 'not_invoiced',
    allocation: 'unallocated',
  },
};

export class SalesReadModels {
  private historicalRows: OrderListItem[] | undefined;

  constructor(private readonly runtime: ApiRuntime) {
    runtime.store.subscribe((collection) => {
      if (collection === 'customers' || collection === 'users') this.historicalRows = undefined;
    });
  }

  private names(
    customerId: string,
    ownerId: string,
  ): {
    customerName: string;
    customerSegment: Customer['segment'];
    regionCode: Customer['regionCode'];
    ownerName: string;
  } {
    const { dataset } = this.runtime.store;
    const customer = dataset.customers.get(customerId);
    return {
      customerName: customer?.displayName ?? customerId,
      customerSegment: customer?.segment ?? 'smb',
      regionCode: customer?.regionCode ?? 'US',
      ownerName: dataset.users.get(ownerId)?.displayName ?? ownerId,
    };
  }

  /** The days an order took from its date to the shipment that completed it (section 16 "order cycle time"). */
  cycleDaysOf(order: SalesOrder): number | undefined {
    if (
      order.fulfillmentStatus === 'unfulfilled' ||
      order.fulfillmentStatus === 'partially_fulfilled'
    )
      return undefined;
    let last: string | undefined;
    for (const shipment of this.runtime.indexes.shipmentsByOrder.get(order.id))
      if (shipment.shippedAt && (last === undefined || shipment.shippedAt > last))
        last = shipment.shippedAt;
    return last === undefined ? undefined : diffDays(businessDateOf(last), order.orderDate);
  }

  orderListItem(order: SalesOrder): OrderListItem {
    const lines = this.runtime.indexes.linesByOrder.get(order.id);
    const cycleDays = this.cycleDaysOf(order);
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      ...this.names(order.customerId, order.ownerId),
      currency: order.currency,
      ownerId: order.ownerId,
      salesTeamId: order.salesTeamId,
      orderDate: order.orderDate,
      defaultWarehouseId: order.defaultWarehouseId,
      status: order.status,
      approvalStatus: order.approvalStatus,
      allocationStatus: order.allocationStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      invoiceStatus: order.invoiceStatus,
      paymentStatus: order.paymentStatus,
      riskFlags: order.riskFlags,
      subtotal: order.subtotal,
      total: order.total,
      netUsd: money(usdMinor(addMoney(order.subtotal, order.freight), order.fxRateToUsd), 'USD'),
      grossMarginBps: order.grossMarginBps,
      lineCount: lines.length,
      skuIds: [...new Set(lines.map((line) => line.skuId))],
      updatedAt: order.metadata.updatedAt,
      version: order.metadata.version,
      historical: false,
      ...(order.requestedDeliveryDate
        ? { requestedDeliveryDate: order.requestedDeliveryDate }
        : {}),
      ...(order.customerPoNumber ? { customerPoNumber: order.customerPoNumber } : {}),
      ...(order.sourceQuoteId ? { sourceQuoteId: order.sourceQuoteId } : {}),
      ...(cycleDays !== undefined ? { cycleDays } : {}),
    };
  }

  /** Immutable rows for the historical tier, built once. */
  historicalOrderRows(): OrderListItem[] {
    if (this.historicalRows) return this.historicalRows;
    const { store } = this.runtime;
    const environment = store.seed.sales.environment;
    const rows: OrderListItem[] = [];
    for (const summary of store.history.summaries) {
      const skeleton = store.history.skeletons[summary.index];
      if (!skeleton) continue;
      const customer = store.dataset.customers.get(summary.customerId);
      const year = Number(summary.orderDate.slice(0, 4));
      const derived = HISTORICAL_STATUS[
        summary.kind === 'cancelled' ? 'cancelled' : 'normal'
      ] as (typeof HISTORICAL_STATUS)[string];
      const ownerId = customer?.accountOwnerId ?? '';
      rows.push({
        id: store.historicalOrderId(summary.index),
        orderNumber: yearlyNumber(
          environment,
          'salesOrder',
          year,
          summary.index - (environment.firstIndexOfYear.get(year) ?? 0) + 1,
        ),
        customerId: summary.customerId,
        ...this.names(summary.customerId, ownerId),
        currency: summary.currency,
        ownerId,
        salesTeamId: customer?.salesTeamId ?? '',
        orderDate: summary.orderDate,
        defaultWarehouseId: skeleton.warehouseId,
        status: derived.status,
        approvalStatus:
          roundHalfUp(
            (summary.subtotalMinor + summary.freightMinor) * Number(summary.fxRateToUsd),
          ) >= 5_000_000
            ? 'approved'
            : 'not_required',
        allocationStatus: derived.allocation,
        fulfillmentStatus: derived.fulfillment,
        invoiceStatus: derived.invoice,
        paymentStatus: derived.payment,
        riskFlags: [],
        subtotal: money(summary.subtotalMinor, summary.currency),
        total: money(summary.totalMinor, summary.currency),
        netUsd: money(
          roundHalfUp((summary.subtotalMinor + summary.freightMinor) * Number(summary.fxRateToUsd)),
          'USD',
        ),
        skuIds: [],
        grossMarginBps:
          summary.subtotalMinor === 0
            ? 0
            : Math.round(
                ((summary.subtotalMinor - summary.costMinor) / summary.subtotalMinor) * 10_000,
              ),
        lineCount: summary.lineCount,
        updatedAt: `${summary.orderDate}T12:00:00Z`,
        version: 1,
        historical: true,
      });
    }
    this.historicalRows = rows;
    return rows;
  }

  *allOrderRows(): Iterable<OrderListItem> {
    for (const order of this.runtime.store.dataset.salesOrders.values())
      yield this.orderListItem(order);
    yield* this.historicalOrderRows();
  }
}

export const orderResource: ResourceDefinition<OrderListItem> = {
  fields: fields<OrderListItem>({
    id: ['string', (item) => item.id],
    orderNumber: ['string', (item) => item.orderNumber],
    customerId: ['string', (item) => item.customerId],
    customerName: ['string', (item) => item.customerName],
    customerSegment: ['enum', (item) => item.customerSegment],
    regionCode: ['enum', (item) => item.regionCode],
    currency: ['enum', (item) => item.currency],
    ownerId: ['string', (item) => item.ownerId],
    ownerName: ['string', (item) => item.ownerName],
    salesTeamId: ['string', (item) => item.salesTeamId],
    orderDate: ['date', (item) => item.orderDate],
    requestedDeliveryDate: ['date', (item) => item.requestedDeliveryDate],
    warehouseId: ['string', (item) => item.defaultWarehouseId],
    status: ['enum', (item) => item.status],
    approvalStatus: ['enum', (item) => item.approvalStatus],
    allocationStatus: ['enum', (item) => item.allocationStatus],
    fulfillmentStatus: ['enum', (item) => item.fulfillmentStatus],
    invoiceStatus: ['enum', (item) => item.invoiceStatus],
    paymentStatus: ['enum', (item) => item.paymentStatus],
    riskFlags: ['array', (item) => item.riskFlags],
    total: ['money', (item) => item.total],
    totalMinor: ['number', (item) => item.total.minor],
    subtotal: ['money', (item) => item.subtotal],
    netUsd: ['money', (item) => item.netUsd],
    grossMarginBps: ['number', (item) => item.grossMarginBps],
    lineCount: ['number', (item) => item.lineCount],
    skuIds: ['array', (item) => item.skuIds],
    cycleDays: ['number', (item) => item.cycleDays],
    customerPoNumber: ['string', (item) => item.customerPoNumber],
    historical: ['boolean', (item) => item.historical],
    updatedAt: ['datetime', (item) => item.updatedAt],
  }),
  search: (item) => [item.orderNumber, item.customerName, item.customerPoNumber],
  defaultSort: '-orderDate,-orderNumber',
};

export function listOrders(
  runtime: ApiRuntime,
  models: SalesReadModels,
  query: ListQuery,
): ListResponse<OrderListItem> {
  runtime.require('orders.view');
  return runListQuery(models.allOrderRows(), orderResource, query, {
    historicalTier: runtime.store.history.summaries.length,
  });
}

export function orderLineView(runtime: ApiRuntime, line: SalesOrderLine): OrderLineView {
  const sku = runtime.store.dataset.skus.get(line.skuId);
  const position = runtime.projections.inventoryAt(line.skuId, line.preferredWarehouseId);
  const toMilli = (value: string): number => Math.round(Number(value) * 1000);
  const open =
    toMilli(line.orderedQuantity) -
    toMilli(line.cancelledQuantity) -
    toMilli(line.fulfilledQuantity);
  const backordered = Math.max(0, open - toMilli(line.reservedQuantity));
  const render = (milli: number): string => String(milli / 1000);
  return {
    ...line,
    skuName: sku?.name ?? line.description,
    openQuantity: render(open),
    backorderedQuantity: render(backordered),
    available: position.available,
  };
}

export function getOrder(runtime: ApiRuntime, models: SalesReadModels, id: string): OrderDetail {
  runtime.require('orders.view');
  const { store, indexes } = runtime;
  let order = store.dataset.salesOrders.get(id);
  let historical = false;
  let graphLines: SalesOrderLine[] | undefined;
  let graphShipments: Shipment[] | undefined;
  let graphInvoices: Invoice[] | undefined;
  let graphReservations: InventoryReservation[] | undefined;
  let graphReturns: Return[] | undefined;
  let graphQuote: Quote | undefined;
  let graphApproval: ApprovalRequest | undefined;
  let shipmentLineCount = (shipmentId: string): number =>
    indexes.shipmentLinesByShipment.get(shipmentId).length;
  if (!order) {
    const graph = store.isHistoricalOrderId(id) ? store.expandHistoricalOrderById(id) : undefined;
    if (!graph) throw notFound('Order', id);
    order = graph.order;
    historical = true;
    graphLines = graph.lines;
    graphShipments = graph.shipments;
    graphInvoices = graph.invoices;
    graphReservations = graph.reservations;
    graphReturns = graph.returns;
    graphQuote = graph.quote;
    graphApproval = graph.approval;
    shipmentLineCount = (shipmentId) =>
      graph.shipmentLines.filter((line) => line.shipmentId === shipmentId).length;
  }
  const customer = store.dataset.customers.get(order.customerId);
  if (!customer) throw notFound('Customer', order.customerId);
  const lines = (graphLines ?? indexes.linesByOrder.get(order.id))
    .slice()
    .sort((a, b) => a.lineNumber - b.lineNumber);
  const contact = store.dataset.contacts.get(order.contactId);
  const warehouse = store.dataset.warehouses.get(order.defaultWarehouseId);
  const quote =
    graphQuote ?? (order.sourceQuoteId ? store.dataset.quotes.get(order.sourceQuoteId) : undefined);
  const approval =
    graphApproval ??
    (order.approvalRequestId
      ? store.dataset.approvalRequests.get(order.approvalRequestId)
      : undefined);
  const inventory = new Map<string, InventoryPosition>();
  for (const line of lines)
    inventory.set(
      `${line.skuId}:${line.preferredWarehouseId}`,
      runtime.projections.inventoryAt(line.skuId, line.preferredWarehouseId),
    );
  void models;
  return {
    order: {
      ...order,
      historical,
      customerName: customer.displayName,
      ownerName: store.dataset.users.get(order.ownerId)?.displayName ?? order.ownerId,
      warehouseCode: warehouse?.code ?? order.defaultWarehouseId,
      ...(contact ? { contactName: contact.displayName } : {}),
    },
    lines: lines.map((line) => orderLineView(runtime, line)),
    customer,
    customerSummary: runtime.projections.customerSummary(customer.id),
    reservations: graphReservations ?? indexes.reservationsByOrder.get(order.id),
    shipments: (graphShipments ?? indexes.shipmentsByOrder.get(order.id)).map((shipment) => ({
      ...shipment,
      lineCount: shipmentLineCount(shipment.id),
    })),
    invoices: graphInvoices ?? indexes.invoicesByOrder.get(order.id),
    returns: graphReturns ?? indexes.returnsByOrder.get(order.id),
    tickets: indexes.ticketsByOrder.get(order.id).map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
    })),
    inventory: [...inventory.values()],
    ...(contact ? { contact } : {}),
    ...(quote ? { quote } : {}),
    ...(approval ? { approval } : {}),
  };
}

// ---------------------------------------------------------------------------
// Quotes

export interface QuoteListItem extends Quote {
  customerName: string;
  customerSegment: Customer['segment'];
  regionCode: Customer['regionCode'];
  ownerName: string;
  lineCount: number;
  daysToExpiry: number;
}

export interface QuoteDetail {
  quote: QuoteListItem;
  lines: (QuoteLine & { skuName: string })[];
  customer: Customer;
  contact?: Contact;
  approval?: ApprovalRequest;
  convertedOrder?: Pick<SalesOrder, 'id' | 'orderNumber' | 'status' | 'total'>;
}

export function quoteListItem(runtime: ApiRuntime, quote: Quote): QuoteListItem {
  const { dataset } = runtime.store;
  const today = runtime.store.today;
  const days = Math.round((Date.parse(quote.expirationDate) - Date.parse(today)) / 86_400_000);
  const customer = dataset.customers.get(quote.customerId);
  return {
    ...quote,
    customerName: customer?.displayName ?? quote.customerId,
    customerSegment: customer?.segment ?? 'smb',
    regionCode: customer?.regionCode ?? 'US',
    ownerName: dataset.users.get(quote.ownerId)?.displayName ?? quote.ownerId,
    lineCount: runtime.indexes.quoteLinesByQuote.get(quote.id).length,
    daysToExpiry: days,
  };
}

export const quoteResource: ResourceDefinition<QuoteListItem> = {
  fields: fields<QuoteListItem>({
    id: ['string', (item) => item.id],
    quoteNumber: ['string', (item) => item.quoteNumber],
    customerId: ['string', (item) => item.customerId],
    customerName: ['string', (item) => item.customerName],
    customerSegment: ['enum', (item) => item.customerSegment],
    regionCode: ['enum', (item) => item.regionCode],
    ownerId: ['string', (item) => item.ownerId],
    ownerName: ['string', (item) => item.ownerName],
    currency: ['enum', (item) => item.currency],
    status: ['enum', (item) => item.status],
    createdBusinessDate: ['date', (item) => item.createdBusinessDate],
    expirationDate: ['date', (item) => item.expirationDate],
    daysToExpiry: ['number', (item) => item.daysToExpiry],
    total: ['money', (item) => item.total],
    grossMarginBps: ['number', (item) => item.grossMarginBps],
    lineCount: ['number', (item) => item.lineCount],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.quoteNumber, item.customerName],
  defaultSort: '-createdBusinessDate',
};

export function listQuotes(runtime: ApiRuntime, query: ListQuery): ListResponse<QuoteListItem> {
  runtime.require('quotes.view');
  const items: QuoteListItem[] = [];
  for (const quote of runtime.store.dataset.quotes.values())
    items.push(quoteListItem(runtime, quote));
  return runListQuery(items, quoteResource, query);
}

export function getQuote(runtime: ApiRuntime, id: string): QuoteDetail {
  runtime.require('quotes.view');
  const { dataset } = runtime.store;
  const quote = dataset.quotes.get(id);
  if (!quote) throw notFound('Quote', id);
  const customer = dataset.customers.get(quote.customerId);
  if (!customer) throw notFound('Customer', quote.customerId);
  const contact = dataset.contacts.get(quote.contactId);
  const approval = quote.approvalRequestId
    ? dataset.approvalRequests.get(quote.approvalRequestId)
    : undefined;
  const converted = quote.convertedOrderId
    ? dataset.salesOrders.get(quote.convertedOrderId)
    : undefined;
  return {
    quote: quoteListItem(runtime, quote),
    lines: runtime.indexes.quoteLinesByQuote
      .get(id)
      .slice()
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .map((line) => ({
        ...line,
        skuName: dataset.skus.get(line.skuId)?.name ?? line.description,
      })),
    customer,
    ...(contact ? { contact } : {}),
    ...(approval ? { approval } : {}),
    ...(converted
      ? {
          convertedOrder: {
            id: converted.id,
            orderNumber: converted.orderNumber,
            status: converted.status,
            total: converted.total,
          },
        }
      : {}),
  };
}
