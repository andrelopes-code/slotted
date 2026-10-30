import {
  businessDateOf,
  diffDays,
  money,
  notFound,
  quantityToMilli,
  usdMinor,
  type Money,
  type ApprovalRequest,
  type GoodsReceipt,
  type GoodsReceiptLine,
  type PurchaseOrder,
  type PurchaseOrderLine,
  type Supplier,
  type SupplierPerformance,
  type SupplierSkuMapping,
} from '../../domain';
import {
  fields,
  runListQuery,
  type ListQuery,
  type ListResponse,
  type ResourceDefinition,
} from '../query';
import type { ApiRuntime } from '../runtime';

export interface SupplierListItem extends Supplier {
  performance: SupplierPerformance;
  skuCount: number;
  city?: string;
  region?: string;
}

/**
 * Section 55: what is paid to a supplier is a cost. A reader without
 * `cost.view` is given it written down to nought, as `getSku` writes a
 * supplier's unit cost — never the figure.
 */
const hidesCost = (runtime: ApiRuntime): boolean => !runtime.can('cost.view');
const nought = (value: Money): Money => money(0, value.currency);

/**
 * Section 65.7: the unit cost of the most recent accepted goods-receipt line
 * for the supplier and the SKU — what `submit` measures a line's variance
 * against. Undefined where nothing was accepted from the supplier.
 */
export function lastAcceptedUnitCost(
  runtime: ApiRuntime,
  supplierId: string,
  skuId: string,
): Money | undefined {
  let latest: { at: string; cost: Money } | undefined;
  for (const po of runtime.indexes.purchaseOrdersBySupplier.get(supplierId)) {
    for (const line of runtime.indexes.poLinesByPo.get(po.id)) {
      if (line.skuId !== skuId || quantityToMilli(line.receivedAcceptedQuantity) <= 0) continue;
      for (const receiptLine of runtime.indexes.receiptLinesByPoLine.get(line.id)) {
        const receipt = runtime.store.dataset.goodsReceipts.get(receiptLine.goodsReceiptId);
        if (receipt && (!latest || receipt.receivedAt > latest.at))
          latest = { at: receipt.receivedAt, cost: line.unitCost };
      }
    }
  }
  return latest?.cost;
}

export function supplierListItem(runtime: ApiRuntime, supplier: Supplier): SupplierListItem {
  const address = runtime.indexes.addressesByOwner.get(supplier.id)[0];
  const performance = runtime.projections.supplierPerformance(supplier.id);
  return {
    ...supplier,
    performance: hidesCost(runtime)
      ? { ...performance, annualSpendUsd: nought(performance.annualSpendUsd) }
      : performance,
    skuCount: runtime.indexes.mappingsBySupplier.get(supplier.id).length,
    ...(address ? { city: address.city, region: address.region } : {}),
  };
}

export const supplierResource: ResourceDefinition<SupplierListItem> = {
  fields: fields<SupplierListItem>({
    id: ['string', (item) => item.id],
    supplierNumber: ['string', (item) => item.supplierNumber],
    displayName: ['string', (item) => item.displayName],
    status: ['enum', (item) => item.status],
    relationshipTier: ['enum', (item) => item.relationshipTier],
    category: ['string', (item) => item.category],
    paymentTermsCode: ['enum', (item) => item.paymentTermsCode],
    regionCode: ['enum', (item) => item.regionCode],
    region: ['string', (item) => item.region],
    skuCount: ['number', (item) => item.skuCount],
    onTimeDeliveryBps: ['number', (item) => item.performance.onTimeDeliveryBps],
    qualityScore: ['number', (item) => item.performance.qualityScore],
    averageLeadTimeDays: ['number', (item) => item.performance.averageLeadTimeDays],
    openPurchaseOrderCount: ['number', (item) => item.performance.openPurchaseOrderCount],
    annualSpendUsd: ['money', (item) => item.performance.annualSpendUsd],
    tags: ['array', (item) => item.tags],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [
    item.displayName,
    item.legalName,
    item.supplierNumber,
    item.primaryContactName,
  ],
  defaultSort: 'displayName',
};

export function listSuppliers(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<SupplierListItem> {
  runtime.require('suppliers.view');
  const items: SupplierListItem[] = [];
  for (const supplier of runtime.store.dataset.suppliers.values())
    items.push(supplierListItem(runtime, supplier));
  return runListQuery(items, supplierResource, query);
}

export interface SupplierDetail {
  supplier: SupplierListItem;
  mappings: (SupplierSkuMapping & {
    skuCode: string;
    skuName: string;
    /** The unit cost last accepted from this supplier for the SKU; absent where none was, or without `cost.view`. */
    lastAcceptedUnitCost?: Money;
  })[];
  recentPurchaseOrders: PurchaseOrderListItem[];
}

export function getSupplier(runtime: ApiRuntime, id: string): SupplierDetail {
  runtime.require('suppliers.view');
  const supplier = runtime.store.dataset.suppliers.get(id);
  if (!supplier) throw notFound('Supplier', id);
  return {
    supplier: supplierListItem(runtime, supplier),
    mappings: runtime.indexes.mappingsBySupplier.get(id).map((mapping) => {
      const sku = runtime.store.dataset.skus.get(mapping.skuId);
      const last = hidesCost(runtime)
        ? undefined
        : lastAcceptedUnitCost(runtime, id, mapping.skuId);
      return {
        ...mapping,
        skuCode: sku?.sku ?? mapping.skuId,
        skuName: sku?.name ?? mapping.skuId,
        ...(hidesCost(runtime) ? { unitCost: nought(mapping.unitCost) } : {}),
        ...(last ? { lastAcceptedUnitCost: last } : {}),
      };
    }),
    recentPurchaseOrders: runtime.indexes.purchaseOrdersBySupplier
      .get(id)
      .sort((a, b) => b.createdBusinessDate.localeCompare(a.createdBusinessDate))
      .slice(0, 10)
      .map((po) => purchaseOrderListItem(runtime, po)),
  };
}

export interface PurchaseOrderListItem extends PurchaseOrder {
  supplierName: string;
  buyerName: string;
  warehouseCode: string;
  lineCount: number;
  receivedShareBps: number;
  daysLate: number;
  /** Business date of the receipt that completed the order; absent until it is received in full. */
  receivedOn?: string;
}

/** The business date an order was received in full: its last receipt, once nothing is left open. */
export function purchaseOrderReceivedOn(
  runtime: ApiRuntime,
  po: PurchaseOrder,
): string | undefined {
  if (po.status !== 'received' && po.status !== 'closed') return undefined;
  let last: string | undefined;
  for (const receipt of runtime.indexes.receiptsByPo.get(po.id))
    if (last === undefined || receipt.receivedAt > last) last = receipt.receivedAt;
  return last === undefined ? undefined : businessDateOf(last);
}

export function purchaseOrderListItem(
  runtime: ApiRuntime,
  po: PurchaseOrder,
): PurchaseOrderListItem {
  const { dataset } = runtime.store;
  const lines = runtime.indexes.poLinesByPo.get(po.id);
  let ordered = 0;
  let received = 0;
  for (const line of lines) {
    ordered += quantityToMilli(line.orderedQuantity);
    received +=
      quantityToMilli(line.receivedAcceptedQuantity) +
      quantityToMilli(line.receivedDamagedQuantity) +
      quantityToMilli(line.rejectedQuantity);
  }
  const open =
    po.status === 'sent' || po.status === 'acknowledged' || po.status === 'partially_received';
  const receivedOn = purchaseOrderReceivedOn(runtime, po);
  return {
    ...po,
    ...(receivedOn ? { receivedOn } : {}),
    ...(hidesCost(runtime)
      ? {
          subtotal: nought(po.subtotal),
          taxTotal: nought(po.taxTotal),
          freight: nought(po.freight),
          total: nought(po.total),
        }
      : {}),
    supplierName: dataset.suppliers.get(po.supplierId)?.displayName ?? po.supplierId,
    buyerName: dataset.users.get(po.buyerId)?.displayName ?? po.buyerId,
    warehouseCode:
      dataset.warehouses.get(po.destinationWarehouseId)?.code ?? po.destinationWarehouseId,
    lineCount: lines.length,
    receivedShareBps: ordered === 0 ? 0 : Math.round((received / ordered) * 10_000),
    daysLate: open ? Math.max(0, diffDays(runtime.store.today, po.expectedDate)) : 0,
  };
}

export const purchaseOrderResource: ResourceDefinition<PurchaseOrderListItem> = {
  fields: fields<PurchaseOrderListItem>({
    id: ['string', (item) => item.id],
    purchaseOrderNumber: ['string', (item) => item.purchaseOrderNumber],
    supplierId: ['string', (item) => item.supplierId],
    supplierName: ['string', (item) => item.supplierName],
    buyerId: ['string', (item) => item.buyerId],
    buyerName: ['string', (item) => item.buyerName],
    warehouseId: ['string', (item) => item.destinationWarehouseId],
    warehouseCode: ['string', (item) => item.warehouseCode],
    currency: ['enum', (item) => item.currency],
    status: ['enum', (item) => item.status],
    exceptionFlags: ['array', (item) => item.exceptionFlags],
    createdBusinessDate: ['date', (item) => item.createdBusinessDate],
    expectedDate: ['date', (item) => item.expectedDate],
    receivedOn: ['date', (item) => item.receivedOn],
    // Compared in US dollars, so an order in reais and one in dollars sort by what they are worth.
    total: ['money', (item) => money(usdMinor(item.total, item.fxRateToUsd), 'USD')],
    lineCount: ['number', (item) => item.lineCount],
    receivedShareBps: ['number', (item) => item.receivedShareBps],
    daysLate: ['number', (item) => item.daysLate],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.purchaseOrderNumber, item.supplierName, item.buyerName],
  defaultSort: '-createdBusinessDate',
};

export function listPurchaseOrders(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<PurchaseOrderListItem> {
  runtime.require('purchase_orders.view');
  const items: PurchaseOrderListItem[] = [];
  // Section 55.3: a reader scoped to warehouses lists the orders bound for them.
  for (const po of runtime.store.dataset.purchaseOrders.values())
    if (runtime.can('purchase_orders.view', { warehouseId: po.destinationWarehouseId }))
      items.push(purchaseOrderListItem(runtime, po));
  return runListQuery(items, purchaseOrderResource, query);
}

export interface PurchaseOrderDetail {
  purchaseOrder: PurchaseOrderListItem;
  lines: (PurchaseOrderLine & { skuCode: string; skuName: string; openQuantity: string })[];
  supplier: Supplier;
  receipts: (GoodsReceipt & { lineCount: number; receivedByName: string })[];
  approval?: ApprovalRequest;
}

export function getPurchaseOrder(runtime: ApiRuntime, id: string): PurchaseOrderDetail {
  runtime.require('purchase_orders.view');
  const { dataset } = runtime.store;
  const po = dataset.purchaseOrders.get(id);
  if (!po) throw notFound('Purchase order', id);
  runtime.require('purchase_orders.view', { warehouseId: po.destinationWarehouseId });
  const supplier = dataset.suppliers.get(po.supplierId);
  if (!supplier) throw notFound('Supplier', po.supplierId);
  const approval = po.approvalRequestId
    ? dataset.approvalRequests.get(po.approvalRequestId)
    : undefined;
  return {
    purchaseOrder: purchaseOrderListItem(runtime, po),
    lines: runtime.indexes.poLinesByPo
      .get(id)
      .slice()
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .map((line) => {
        const sku = dataset.skus.get(line.skuId);
        const open =
          quantityToMilli(line.orderedQuantity) -
          quantityToMilli(line.receivedAcceptedQuantity) -
          quantityToMilli(line.receivedDamagedQuantity) -
          quantityToMilli(line.rejectedQuantity);
        return {
          ...line,
          ...(hidesCost(runtime)
            ? { unitCost: nought(line.unitCost), lineTotal: nought(line.lineTotal) }
            : {}),
          skuCode: sku?.sku ?? line.skuId,
          skuName: sku?.name ?? line.description,
          openQuantity: String(Math.max(0, open) / 1000),
        };
      }),
    supplier,
    receipts: runtime.indexes.receiptsByPo.get(id).map((receipt) => ({
      ...receipt,
      lineCount: runtime.indexes.receiptLinesByReceipt.get(receipt.id).length,
      receivedByName: dataset.users.get(receipt.receivedBy)?.displayName ?? receipt.receivedBy,
    })),
    ...(approval
      ? {
          approval:
            hidesCost(runtime) && approval.amount
              ? { ...approval, amount: nought(approval.amount) }
              : approval,
        }
      : {}),
  };
}

export function getGoodsReceipt(
  runtime: ApiRuntime,
  id: string,
): {
  receipt: GoodsReceipt & {
    supplierName: string;
    purchaseOrderNumber: string;
    warehouseCode: string;
  };
  lines: (GoodsReceiptLine & { skuCode: string; skuName: string })[];
} {
  runtime.require('receipts.view');
  const { dataset } = runtime.store;
  const receipt = dataset.goodsReceipts.get(id);
  if (!receipt) throw notFound('Goods receipt', id);
  // Section 55.3: `receipts.view` is granted per warehouse, and a receipt stands in one.
  runtime.require('receipts.view', { warehouseId: receipt.warehouseId });
  return {
    receipt: {
      ...receipt,
      supplierName: dataset.suppliers.get(receipt.supplierId)?.displayName ?? receipt.supplierId,
      purchaseOrderNumber:
        dataset.purchaseOrders.get(receipt.purchaseOrderId)?.purchaseOrderNumber ??
        receipt.purchaseOrderId,
      warehouseCode: dataset.warehouses.get(receipt.warehouseId)?.code ?? receipt.warehouseId,
    },
    lines: runtime.indexes.receiptLinesByReceipt.get(id).map((line) => {
      const sku = dataset.skus.get(line.skuId);
      return {
        ...line,
        ...(hidesCost(runtime) ? { unitCost: nought(line.unitCost) } : {}),
        skuCode: sku?.sku ?? line.skuId,
        skuName: sku?.name ?? line.skuId,
      };
    }),
  };
}
