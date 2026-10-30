import {
  addDays,
  compareDates,
  diffDays,
  monthKey,
  quantityToMilli,
  addMoney,
  roundHalfUp,
  subtractMoney,
  usd,
  usdMinor,
  type Money,
} from '../../domain';
import type { OrderSummary } from '../../data/seed/orders';
import type { ApiRuntime } from '../runtime';
import { supportMetrics } from './support';

export interface MonthlyPoint {
  month: string;
  /** Section 72.2; null for a month before invoices are kept (section 75.4). */
  invoicedRevenue: Money | null;
  grossMargin: Money;
  bookedValue: Money;
  orders: number;
}

export interface DashboardKpi {
  label: string;
  value: number | string | null;
  format: 'money' | 'number' | 'percent' | 'days' | 'text';
  /** Change versus the previous comparable period, in basis points when applicable. */
  deltaBps?: number;
  hint?: string;
}

export interface ExecutiveDashboard {
  asOf: string;
  period: { from: string; to: string };
  kpis: DashboardKpi[];
  monthly: MonthlyPoint[];
  ordersByStatus: Record<string, number>;
  accountHealth: Record<'healthy' | 'watch' | 'at_risk', number>;
  topCustomers: {
    customerId: string;
    displayName: string;
    segment: string;
    revenue: Money;
    orders: number;
  }[];
  topProducts: { skuId: string; sku: string; name: string; units: string; revenue: Money }[];
  revenueBySegment: { segment: string; revenue: Money; share: number }[];
  alerts: {
    kind: string;
    count: number;
    severity: 'info' | 'warning' | 'critical';
    label: string;
  }[];
  pipeline: {
    openQuotes: number;
    openQuoteValue: Money;
    pendingApprovals: number;
    backorderedLines: number;
    delayedPurchaseOrders: number;
    lowStockSkus: number;
  };
}

/** Section 34.1 / 72 — executive dashboard. Every number reconciles with records. */
export function executiveDashboard(runtime: ApiRuntime): ExecutiveDashboard {
  runtime.require('analytics.view');
  const { store, indexes, projections } = runtime;
  const today = store.today;
  const keptFrom = store.seed.context.operationalStart;
  // Thirty days to today and the thirty before them: the reports' default period and its comparison.
  const from30 = addDays(today, -29);
  const from60 = addDays(today, -59);
  const from365 = addDays(today, -365);

  // Monthly series over the logical history: materialized invoices plus history summaries.
  const months = new Map<
    string,
    { revenue: number; margin: number; booked: number; orders: number }
  >();
  const bucket = (month: string) => {
    let entry = months.get(month);
    if (!entry) {
      entry = { revenue: 0, margin: 0, booked: 0, orders: 0 };
      months.set(month, entry);
    }
    return entry;
  };
  // Consolidated figures are USD at each document's rate (section 53.7).
  const summaryUsd = (minor: number, summary: OrderSummary): number =>
    roundHalfUp(minor * Number(summary.fxRateToUsd));
  // A historical order is booked value by its date; its invoice is not kept, so it is no revenue (section 75.4).
  for (const summary of store.history.summaries) {
    if (summary.kind === 'cancelled' || summary.kind === 'draft') continue;
    const entry = bucket(monthKey(summary.orderDate));
    entry.booked += summaryUsd(summary.subtotalMinor + summary.freightMinor, summary);
    entry.orders += 1;
  }
  for (const invoice of store.dataset.invoices.values()) {
    if (invoice.lifecycle !== 'open' && invoice.lifecycle !== 'written_off') continue;
    const entry = bucket(monthKey(invoice.issueDate));
    entry.revenue += usdMinor(addMoney(invoice.subtotal, invoice.freight), invoice.fxRateToUsd);
    entry.margin += usdMinor(
      subtractMoney(invoice.subtotal, invoice.costTotal),
      invoice.fxRateToUsd,
    );
  }
  for (const memo of store.dataset.creditMemos.values()) {
    if (memo.lifecycle === 'draft' || memo.lifecycle === 'voided') continue;
    bucket(monthKey(memo.issueDate)).revenue -= usdMinor(memo.subtotal);
  }
  const ordersByStatus: Record<string, number> = {};
  let bookedLast30 = 0;
  let bookedPrev30 = 0;
  let ordersLast30 = 0;
  let ordersPrev30 = 0;
  const revenueByCustomer = new Map<string, { revenue: number; orders: number }>();
  const revenueBySegment = new Map<string, number>();
  for (const order of store.dataset.salesOrders.values()) {
    ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;
    if (
      order.status === 'cancelled' ||
      order.status === 'draft' ||
      order.status === 'pending_approval'
    )
      continue;
    const entry = bucket(monthKey(order.orderDate));
    const net = usdMinor(addMoney(order.subtotal, order.freight), order.fxRateToUsd);
    entry.booked += net;
    entry.orders += 1;
    if (compareDates(order.orderDate, from30) >= 0) {
      bookedLast30 += net;
      ordersLast30 += 1;
    } else if (compareDates(order.orderDate, from60) >= 0) {
      bookedPrev30 += net;
      ordersPrev30 += 1;
    }
    if (compareDates(order.orderDate, from365) >= 0) {
      const customerEntry = revenueByCustomer.get(order.customerId) ?? { revenue: 0, orders: 0 };
      customerEntry.revenue += net;
      customerEntry.orders += 1;
      revenueByCustomer.set(order.customerId, customerEntry);
      const segment = store.dataset.customers.get(order.customerId)?.segment ?? 'smb';
      revenueBySegment.set(segment, (revenueBySegment.get(segment) ?? 0) + net);
    }
  }
  for (const summary of store.history.summaries) {
    if (summary.kind === 'cancelled' || summary.kind === 'draft') continue;
    if (compareDates(summary.orderDate, from365) < 0) continue;
    const net = summaryUsd(summary.subtotalMinor + summary.freightMinor, summary);
    const customerEntry = revenueByCustomer.get(summary.customerId) ?? { revenue: 0, orders: 0 };
    customerEntry.revenue += net;
    customerEntry.orders += 1;
    revenueByCustomer.set(summary.customerId, customerEntry);
    const segment = store.dataset.customers.get(summary.customerId)?.segment ?? 'smb';
    revenueBySegment.set(segment, (revenueBySegment.get(segment) ?? 0) + net);
  }

  const monthly: MonthlyPoint[] = [...months.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-24)
    .map(([month, entry]) => ({
      month,
      invoicedRevenue: month < monthKey(keptFrom) ? null : usd(entry.revenue),
      grossMargin: month < monthKey(keptFrom) ? usd(0) : usd(entry.margin),
      bookedValue: usd(entry.booked),
      orders: entry.orders,
    }));

  const finance = projections.financeOverview();
  let revenue30 = 0;
  let merchandise30 = 0;
  let margin30 = 0;
  let revenuePrev30 = 0;
  for (const invoice of store.dataset.invoices.values()) {
    if (invoice.lifecycle !== 'open' && invoice.lifecycle !== 'written_off') continue;
    if (compareDates(invoice.issueDate, from30) >= 0) {
      revenue30 += usdMinor(addMoney(invoice.subtotal, invoice.freight), invoice.fxRateToUsd);
      merchandise30 += usdMinor(invoice.subtotal, invoice.fxRateToUsd);
      margin30 += usdMinor(subtractMoney(invoice.subtotal, invoice.costTotal), invoice.fxRateToUsd);
    } else if (compareDates(invoice.issueDate, from60) >= 0)
      revenuePrev30 += usdMinor(addMoney(invoice.subtotal, invoice.freight), invoice.fxRateToUsd);
  }
  // Section 72.2: credit memos opened in the same days come off the period's revenue.
  for (const memo of store.dataset.creditMemos.values()) {
    if (memo.lifecycle === 'draft' || memo.lifecycle === 'voided') continue;
    if (compareDates(memo.issueDate, from30) >= 0) revenue30 -= usdMinor(memo.subtotal);
    else if (compareDates(memo.issueDate, from60) >= 0) revenuePrev30 -= usdMinor(memo.subtotal);
  }
  const inventoryValue = projections.inventoryValue();
  let shippedCost12 = 0;
  for (const invoice of store.dataset.invoices.values()) {
    if (
      (invoice.lifecycle === 'open' || invoice.lifecycle === 'written_off') &&
      compareDates(invoice.issueDate, from365) >= 0
    )
      shippedCost12 += usdMinor(invoice.costTotal, invoice.fxRateToUsd);
  }
  let historyCost12 = 0;
  for (const summary of store.history.summaries)
    if (summary.kind !== 'cancelled' && compareDates(summary.orderDate, from365) >= 0)
      historyCost12 += summaryUsd(summary.costMinor, summary);
  const turns =
    inventoryValue.minor === 0
      ? null
      : Math.round(((shippedCost12 + historyCost12) / inventoryValue.minor) * 10) / 10;

  const health: ExecutiveDashboard['accountHealth'] = { healthy: 0, watch: 0, at_risk: 0 };
  for (const customer of store.dataset.customers.values())
    if (customer.status === 'active') health[customer.health] += 1;

  let onTimeLines = 0;
  let completedLines = 0;
  for (const supplier of store.dataset.suppliers.values()) {
    const performance = projections.supplierPerformance(supplier.id);
    if (performance.openPurchaseOrderCount === 0 && performance.annualSpendUsd.minor === 0)
      continue;
    // Section 72.10 counts lines, not suppliers: a supplier of one line weighs one line.
    completedLines += performance.completedLines;
    onTimeLines += performance.onTimeLines;
  }
  const support = supportMetrics(runtime);

  const topCustomers = [...revenueByCustomer.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([customerId, entry]) => {
      const customer = store.dataset.customers.get(customerId);
      return {
        customerId,
        displayName: customer?.displayName ?? customerId,
        segment: customer?.segment ?? 'smb',
        revenue: usd(entry.revenue),
        orders: entry.orders,
      };
    });

  const productTotals = new Map<string, { units: number; revenue: number }>();
  for (const line of store.dataset.salesOrderLines.values()) {
    const order = store.dataset.salesOrders.get(line.orderId);
    if (
      !order ||
      order.status === 'cancelled' ||
      order.status === 'draft' ||
      compareDates(order.orderDate, from30) < 0
    )
      continue;
    const entry = productTotals.get(line.skuId) ?? { units: 0, revenue: 0 };
    entry.units += quantityToMilli(line.orderedQuantity) - quantityToMilli(line.cancelledQuantity);
    entry.revenue += usdMinor(line.netAmount, order.fxRateToUsd);
    productTotals.set(line.skuId, entry);
  }
  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([skuId, entry]) => {
      const sku = store.dataset.skus.get(skuId);
      return {
        skuId,
        sku: sku?.sku ?? skuId,
        name: sku?.name ?? skuId,
        units: String(entry.units / 1000),
        revenue: usd(entry.revenue),
      };
    });
  const segmentTotal = [...revenueBySegment.values()].reduce((sum, value) => sum + value, 0);
  const segments = [...revenueBySegment.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([segment, revenue]) => ({
      segment,
      revenue: usd(revenue),
      share: segmentTotal === 0 ? 0 : Math.round((revenue / segmentTotal) * 1000) / 10,
    }));

  let openQuotes = 0;
  let openQuoteValue = 0;
  for (const quote of store.dataset.quotes.values()) {
    if (
      quote.status === 'sent' ||
      quote.status === 'viewed' ||
      quote.status === 'approved' ||
      quote.status === 'pending_approval' ||
      quote.status === 'draft'
    ) {
      openQuotes += 1;
      openQuoteValue += usdMinor(quote.total, quote.fxRateToUsd);
    }
  }
  let backorderedLines = 0;
  for (const order of store.dataset.salesOrders.values()) {
    if (order.status !== 'confirmed' && order.status !== 'on_hold') continue;
    for (const line of indexes.linesByOrder.get(order.id)) {
      const open =
        quantityToMilli(line.orderedQuantity) -
        quantityToMilli(line.cancelledQuantity) -
        quantityToMilli(line.fulfilledQuantity);
      if (open - quantityToMilli(line.reservedQuantity) > 0) backorderedLines += 1;
    }
  }
  let delayedPurchaseOrders = 0;
  for (const po of store.dataset.purchaseOrders.values())
    if (po.exceptionFlags.includes('delayed')) delayedPurchaseOrders += 1;
  let lowStockSkus = 0;
  const lowStockSeen = new Set<string>();
  for (const position of projections.inventory().values()) {
    if (position.belowSafetyStock && !lowStockSeen.has(position.skuId)) {
      lowStockSeen.add(position.skuId);
      lowStockSkus += 1;
    }
  }
  let pendingApprovals = 0;
  for (const request of store.dataset.approvalRequests.values())
    if (request.status === 'pending') pendingApprovals += 1;
  let exceptions = 0;
  for (const shipment of store.dataset.shipments.values())
    if (shipment.status === 'exception') exceptions += 1;

  const deltaBps = (current: number, previous: number): number | undefined =>
    previous === 0 ? undefined : Math.round(((current - previous) / previous) * 10_000);
  const kpis: DashboardKpi[] = [
    {
      label: 'Invoiced revenue (30d)',
      value: revenue30,
      format: 'money',
      hint: 'Net merchandise plus freight, excluding tax; opened invoices minus credit memos.',
      ...(deltaBps(revenue30, revenuePrev30) !== undefined
        ? { deltaBps: deltaBps(revenue30, revenuePrev30) as number }
        : {}),
    },
    {
      label: 'Gross margin (30d)',
      // Section 72.3: over net merchandise; freight and tax are no part of it.
      value: merchandise30 === 0 ? 0 : Math.round((margin30 / merchandise30) * 10_000),
      format: 'percent',
      hint: 'Invoiced net merchandise minus snapshotted cost.',
    },
    {
      label: 'Orders confirmed (30d)',
      value: ordersLast30,
      format: 'number',
      ...(deltaBps(ordersLast30, ordersPrev30) !== undefined
        ? { deltaBps: deltaBps(ordersLast30, ordersPrev30) as number }
        : {}),
    },
    {
      label: 'Booked order value (30d)',
      value: bookedLast30,
      format: 'money',
      ...(deltaBps(bookedLast30, bookedPrev30) !== undefined
        ? { deltaBps: deltaBps(bookedLast30, bookedPrev30) as number }
        : {}),
    },
    {
      label: 'Average order value (30d)',
      value: ordersLast30 === 0 ? 0 : Math.round(bookedLast30 / ordersLast30),
      format: 'money',
    },
    { label: 'Receivables', value: finance.receivables.minor, format: 'money' },
    {
      label: 'Overdue receivables',
      value: finance.overdueReceivables.minor,
      format: 'money',
      hint: `${finance.overdueInvoiceCount} invoices`,
    },
    {
      label: 'DSO',
      value: finance.dsoDays,
      format: 'days',
      hint: 'Receivables ÷ trailing 90-day invoiced revenue × 90.',
    },
    {
      label: 'Inventory value',
      value: inventoryValue.minor,
      format: 'money',
      hint: 'Physical on-hand at standard cost.',
    },
    { label: 'Inventory turns (12m)', value: turns, format: 'number' },
    {
      label: 'Supplier on-time delivery',
      value: completedLines === 0 ? 0 : Math.round((onTimeLines / completedLines) * 10_000),
      format: 'percent',
      hint: 'On-time completed lines over completed lines, every supplier.',
    },
    { label: 'Support first-response SLA', value: support.firstResponseSlaBps, format: 'percent' },
  ];
  const alerts: ExecutiveDashboard['alerts'] = [
    {
      kind: 'approvals',
      count: pendingApprovals,
      severity: pendingApprovals > 15 ? 'warning' : 'info',
      label: 'Approvals waiting',
    },
    {
      kind: 'backorders',
      count: backorderedLines,
      severity: backorderedLines > 40 ? 'critical' : backorderedLines > 10 ? 'warning' : 'info',
      label: 'Backordered order lines',
    },
    {
      kind: 'delayed_pos',
      count: delayedPurchaseOrders,
      severity: delayedPurchaseOrders > 20 ? 'warning' : 'info',
      label: 'Delayed purchase orders',
    },
    {
      kind: 'low_stock',
      count: lowStockSkus,
      severity: lowStockSkus > 40 ? 'critical' : lowStockSkus > 10 ? 'warning' : 'info',
      label: 'SKUs below safety stock',
    },
    {
      kind: 'shipment_exceptions',
      count: exceptions,
      severity: exceptions > 10 ? 'warning' : 'info',
      label: 'Shipment exceptions',
    },
    {
      kind: 'sla_breaches',
      count: support.breachedResolution,
      severity:
        support.breachedResolution > 10
          ? 'critical'
          : support.breachedResolution > 0
            ? 'warning'
            : 'info',
      label: 'Tickets past resolution SLA',
    },
    {
      kind: 'overdue_invoices',
      count: finance.overdueInvoiceCount,
      severity: finance.overdueInvoiceCount > 200 ? 'warning' : 'info',
      label: 'Overdue invoices',
    },
  ];
  return {
    asOf: store.now,
    period: { from: from30, to: today },
    kpis,
    monthly,
    ordersByStatus,
    accountHealth: health,
    topCustomers,
    topProducts,
    revenueBySegment: segments,
    alerts,
    pipeline: {
      openQuotes,
      openQuoteValue: usd(openQuoteValue),
      pendingApprovals,
      backorderedLines,
      delayedPurchaseOrders,
      lowStockSkus,
    },
  };
}

export { diffDays };
