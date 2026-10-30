import {
  businessDateOf,
  notFound,
  quantityToMilli,
  type CycleCount,
  type CycleCountLine,
  type InventoryTransfer,
  type InventoryTransferLine,
  type Return,
  type ReturnLine,
  type Shipment,
  type ShipmentLine,
  type StockMovement,
  type Warehouse,
  type WarehouseLocation,
} from '../../domain';
import type { InventoryPosition } from '../projections';
import {
  fields,
  runListQuery,
  storedFilter,
  type ListQuery,
  type ListResponse,
  type ResourceDefinition,
} from '../query';
import type { ApiRuntime } from '../runtime';

// ---------------------------------------------------------------------------
// Shipments

export interface ShipmentListItem extends Shipment {
  orderNumber: string;
  customerName: string;
  warehouseCode: string;
  lineCount: number;
  unitCount: string;
}

export interface ShipmentDetail {
  shipment: ShipmentListItem;
  lines: (ShipmentLine & { skuCode: string; skuName: string; orderedQuantity: string })[];
  order: {
    id: string;
    orderNumber: string;
    status: Shipment['status'] | string;
    customerId: string;
    shippingAddress: unknown;
  };
  warehouse: Warehouse;
  invoices: { id: string; invoiceNumber?: string; total: unknown; settlement: string }[];
}

export function shipmentListItem(runtime: ApiRuntime, shipment: Shipment): ShipmentListItem {
  const { dataset } = runtime.store;
  const order = dataset.salesOrders.get(shipment.orderId);
  const lines = runtime.indexes.shipmentLinesByShipment.get(shipment.id);
  let units = 0;
  for (const line of lines) units += quantityToMilli(line.quantity);
  return {
    ...shipment,
    orderNumber: order?.orderNumber ?? shipment.orderId,
    customerName: dataset.customers.get(shipment.customerId)?.displayName ?? shipment.customerId,
    warehouseCode: dataset.warehouses.get(shipment.warehouseId)?.code ?? shipment.warehouseId,
    lineCount: lines.length,
    unitCount: String(units / 1000),
  };
}

export const shipmentResource: ResourceDefinition<ShipmentListItem> = {
  fields: fields<ShipmentListItem>({
    id: ['string', (item) => item.id],
    shipmentNumber: ['string', (item) => item.shipmentNumber],
    orderId: ['string', (item) => item.orderId],
    orderNumber: ['string', (item) => item.orderNumber],
    customerId: ['string', (item) => item.customerId],
    customerName: ['string', (item) => item.customerName],
    warehouseId: ['string', (item) => item.warehouseId],
    warehouseCode: ['string', (item) => item.warehouseCode],
    carrier: ['string', (item) => item.carrier],
    service: ['string', (item) => item.service],
    status: ['enum', (item) => item.status],
    shippedAt: ['datetime', (item) => item.shippedAt],
    estimatedDeliveryDate: ['date', (item) => item.estimatedDeliveryDate],
    deliveredAt: ['datetime', (item) => item.deliveredAt],
    exceptionCode: ['string', (item) => item.exceptionCode],
    lineCount: ['number', (item) => item.lineCount],
    createdAt: ['datetime', (item) => item.metadata.createdAt],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.shipmentNumber, item.orderNumber, item.customerName, item.trackingNumber],
  defaultSort: '-createdAt',
};

export function listShipments(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<ShipmentListItem> {
  const user = runtime.require('shipments.view');
  const warehouses = runtime.authorization.warehouseIdsFor(user.id);
  const items: ShipmentListItem[] = [];
  for (const shipment of runtime.store.dataset.shipments.values()) {
    if (warehouses !== 'all' && !warehouses.includes(shipment.warehouseId)) continue;
    items.push(shipmentListItem(runtime, shipment));
  }
  return runListQuery(items, shipmentResource, query);
}

export function getShipment(runtime: ApiRuntime, id: string): ShipmentDetail {
  const { dataset } = runtime.store;
  const shipment = dataset.shipments.get(id);
  if (!shipment) throw notFound('Shipment', id);
  runtime.require('shipments.view', { warehouseId: shipment.warehouseId });
  const order = dataset.salesOrders.get(shipment.orderId);
  if (!order) throw notFound('Order', shipment.orderId);
  const warehouse = dataset.warehouses.get(shipment.warehouseId);
  if (!warehouse) throw notFound('Warehouse', shipment.warehouseId);
  const invoiceIds = new Set<string>();
  for (const line of runtime.indexes.shipmentLinesByShipment.get(id)) {
    for (const invoiceLine of runtime.indexes.invoiceLinesByOrderLine.get(line.orderLineId))
      if (invoiceLine.shipmentLineId === line.id) invoiceIds.add(invoiceLine.invoiceId);
  }
  return {
    shipment: shipmentListItem(runtime, shipment),
    lines: runtime.indexes.shipmentLinesByShipment.get(id).map((line) => {
      const sku = dataset.skus.get(line.skuId);
      const orderLine = dataset.salesOrderLines.get(line.orderLineId);
      return {
        ...line,
        skuCode: sku?.sku ?? line.skuId,
        skuName: sku?.name ?? line.skuId,
        orderedQuantity: orderLine?.orderedQuantity ?? line.quantity,
      };
    }),
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerId: order.customerId,
      shippingAddress: order.shippingAddress,
    },
    warehouse,
    invoices: [...invoiceIds]
      .map((invoiceId) => dataset.invoices.get(invoiceId))
      .filter((invoice) => invoice !== undefined)
      .map((invoice) => ({
        id: invoice.id,
        total: invoice.total,
        settlement: invoice.settlement,
        ...(invoice.invoiceNumber ? { invoiceNumber: invoice.invoiceNumber } : {}),
      })),
  };
}

// ---------------------------------------------------------------------------
// Returns

export interface ReturnListItem extends Return {
  orderNumber: string;
  customerName: string;
  lineCount: number;
}

export interface ReturnDetail {
  return: ReturnListItem;
  lines: (ReturnLine & { skuCode: string; skuName: string })[];
  creditMemo?: { id: string; creditMemoNumber: string; total: unknown; lifecycle: string };
}

export function returnListItem(runtime: ApiRuntime, ret: Return): ReturnListItem {
  const { dataset } = runtime.store;
  return {
    ...ret,
    orderNumber: dataset.salesOrders.get(ret.orderId)?.orderNumber ?? ret.orderId,
    customerName: dataset.customers.get(ret.customerId)?.displayName ?? ret.customerId,
    lineCount: runtime.indexes.returnLinesByReturn.get(ret.id).length,
  };
}

export const returnResource: ResourceDefinition<ReturnListItem> = {
  fields: fields<ReturnListItem>({
    id: ['string', (item) => item.id],
    returnNumber: ['string', (item) => item.returnNumber],
    orderNumber: ['string', (item) => item.orderNumber],
    customerId: ['string', (item) => item.customerId],
    customerName: ['string', (item) => item.customerName],
    status: ['enum', (item) => item.status],
    requestedAt: ['datetime', (item) => item.requestedAt],
    receivingWarehouseId: ['string', (item) => item.receivingWarehouseId],
    lineCount: ['number', (item) => item.lineCount],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.returnNumber, item.orderNumber, item.customerName],
  defaultSort: '-requestedAt',
};

export function listReturns(runtime: ApiRuntime, query: ListQuery): ListResponse<ReturnListItem> {
  runtime.require('returns.view');
  const items: ReturnListItem[] = [];
  for (const ret of runtime.store.dataset.returns.values())
    items.push(returnListItem(runtime, ret));
  return runListQuery(items, returnResource, query);
}

export function getReturn(runtime: ApiRuntime, id: string): ReturnDetail {
  runtime.require('returns.view');
  const { dataset } = runtime.store;
  const ret = dataset.returns.get(id);
  if (!ret) throw notFound('Return', id);
  const memo = ret.creditMemoId ? dataset.creditMemos.get(ret.creditMemoId) : undefined;
  return {
    return: returnListItem(runtime, ret),
    lines: runtime.indexes.returnLinesByReturn.get(id).map((line) => {
      const sku = dataset.skus.get(line.skuId);
      return { ...line, skuCode: sku?.sku ?? line.skuId, skuName: sku?.name ?? line.skuId };
    }),
    ...(memo
      ? {
          creditMemo: {
            id: memo.id,
            creditMemoNumber: memo.creditMemoNumber,
            total: memo.total,
            lifecycle: memo.lifecycle,
          },
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Inventory

export interface InventoryListItem extends InventoryPosition {
  skuCode: string;
  skuName: string;
  warehouseCode: string;
  unitOfMeasure: string;
  standardCost: { currency: 'USD'; minor: number };
  onHandValue: { currency: 'USD'; minor: number };
  categoryId: string;
  categoryName: string;
  skuStatus: string;
  /** The last shipment out of the position among the movements Nexora keeps (section 75.4). */
  lastShippedOn?: string;
}

export function inventoryListItem(
  runtime: ApiRuntime,
  position: InventoryPosition,
): InventoryListItem {
  const { dataset } = runtime.store;
  const sku = dataset.skus.get(position.skuId);
  const lastShippedOn = runtime.projections.lastShipmentOn(position.skuId, position.warehouseId);
  return {
    ...position,
    skuCode: sku?.sku ?? position.skuId,
    skuName: sku?.name ?? position.skuId,
    warehouseCode: dataset.warehouses.get(position.warehouseId)?.code ?? position.warehouseId,
    unitOfMeasure: sku?.unitOfMeasure ?? 'EA',
    standardCost: { currency: 'USD', minor: sku?.standardCost.minor ?? 0 },
    onHandValue: {
      currency: 'USD',
      minor: Math.round(((sku?.standardCost.minor ?? 0) * quantityToMilli(position.onHand)) / 1000),
    },
    categoryId: sku?.categoryId ?? '',
    categoryName: sku ? (dataset.categories.get(sku.categoryId)?.name ?? '') : '',
    skuStatus: sku?.status ?? 'active',
    ...(lastShippedOn ? { lastShippedOn } : {}),
  };
}

export const inventoryResource: ResourceDefinition<InventoryListItem> = {
  fields: fields<InventoryListItem>({
    skuId: ['string', (item) => item.skuId],
    skuCode: ['string', (item) => item.skuCode],
    skuName: ['string', (item) => item.skuName],
    skuStatus: ['enum', (item) => item.skuStatus],
    warehouseId: ['string', (item) => item.warehouseId],
    warehouseCode: ['string', (item) => item.warehouseCode],
    categoryId: ['string', (item) => item.categoryId],
    categoryName: ['string', (item) => item.categoryName],
    lastShippedOn: ['date', (item) => item.lastShippedOn],
    onHand: ['quantity', (item) => item.onHand],
    available: ['quantity', (item) => item.available],
    reserved: ['quantity', (item) => item.reserved],
    inbound: ['quantity', (item) => item.inbound],
    damaged: ['quantity', (item) => item.damaged],
    quarantine: ['quantity', (item) => item.quarantine],
    backordered: ['quantity', (item) => item.backordered],
    reorderPoint: ['quantity', (item) => item.reorderPoint],
    safetyStock: ['quantity', (item) => item.safetyStock],
    belowReorderPoint: ['boolean', (item) => item.belowReorderPoint],
    belowSafetyStock: ['boolean', (item) => item.belowSafetyStock],
    reorderSuggested: ['boolean', (item) => item.reorderSuggested],
    onHandValue: ['money', (item) => item.onHandValue],
  }),
  search: (item) => [item.skuCode, item.skuName, item.warehouseCode],
  defaultSort: 'skuCode,warehouseCode',
};

export function listInventory(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<InventoryListItem> {
  const user = runtime.require('inventory.view');
  const warehouses = runtime.authorization.warehouseIdsFor(user.id);
  // A figure on the overview is a count over every position: the join waits for the positions it counts.
  const stored = storedFilter<InventoryPosition, InventoryListItem>(inventoryResource, query, [
    'skuId',
    'warehouseId',
    'onHand',
    'available',
    'reserved',
    'inbound',
    'damaged',
    'quarantine',
    'backordered',
    'reorderPoint',
    'safetyStock',
    'belowReorderPoint',
    'belowSafetyStock',
    'reorderSuggested',
  ]);
  const items: InventoryListItem[] = [];
  for (const position of runtime.projections.inventory().values()) {
    if (warehouses !== 'all' && !warehouses.includes(position.warehouseId)) continue;
    if (!stored(position)) continue;
    items.push(inventoryListItem(runtime, position));
  }
  return runListQuery(items, inventoryResource, query);
}

export function getInventoryForSku(
  runtime: ApiRuntime,
  skuId: string,
): {
  sku: { id: string; sku: string; name: string };
  positions: InventoryListItem[];
  movements: StockMovement[];
} {
  const user = runtime.require('inventory.view');
  const sku = runtime.store.dataset.skus.get(skuId);
  if (!sku) throw notFound('SKU', skuId);
  const warehouses = runtime.authorization.warehouseIdsFor(user.id);
  return {
    sku: { id: sku.id, sku: sku.sku, name: sku.name },
    positions: runtime.projections
      .inventoryForSku(skuId)
      .filter((position) => warehouses === 'all' || warehouses.includes(position.warehouseId))
      .map((position) => inventoryListItem(runtime, position)),
    movements: runtime.indexes.movementsBySku
      .get(skuId)
      .filter((movement) => warehouses === 'all' || warehouses.includes(movement.warehouseId))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, 100),
  };
}

export interface MovementListItem extends StockMovement {
  /** Business date of the movement, the day a report counts it on. */
  occurredOn: string;
  /** The SKU's category, a leaf of the tree. */
  categoryId: string;
  skuCode: string;
  skuName: string;
  warehouseCode: string;
  actorName: string;
}

export const movementResource: ResourceDefinition<MovementListItem> = {
  fields: fields<MovementListItem>({
    id: ['string', (item) => item.id],
    type: ['enum', (item) => item.type],
    skuId: ['string', (item) => item.skuId],
    skuCode: ['string', (item) => item.skuCode],
    warehouseId: ['string', (item) => item.warehouseId],
    warehouseCode: ['string', (item) => item.warehouseCode],
    occurredAt: ['datetime', (item) => item.occurredAt],
    occurredOn: ['date', (item) => businessDateOf(item.occurredAt)],
    categoryId: ['string', (item) => item.categoryId],
    sourceEntityType: ['string', (item) => item.sourceEntityType],
    sourceEntityId: ['string', (item) => item.sourceEntityId],
    actorId: ['string', (item) => item.actorId],
    onHandDelta: ['quantity', (item) => item.onHandDelta],
  }),
  search: (item) => [item.skuCode, item.skuName, item.sourceEntityId, item.reason],
  defaultSort: '-occurredAt',
};

export function listStockMovements(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<MovementListItem> {
  const user = runtime.require('inventory.view');
  const warehouses = runtime.authorization.warehouseIdsFor(user.id);
  const { dataset } = runtime.store;
  // The ledger is the largest collection in the tenant, and a page asks for a day of it at a time.
  const stored = storedFilter<StockMovement, MovementListItem>(movementResource, query, [
    'id',
    'type',
    'skuId',
    'warehouseId',
    'occurredAt',
    'sourceEntityType',
    'sourceEntityId',
    'actorId',
    'onHandDelta',
  ]);
  const items: MovementListItem[] = [];
  for (const movement of dataset.stockMovements.values()) {
    if (warehouses !== 'all' && !warehouses.includes(movement.warehouseId)) continue;
    if (!stored(movement)) continue;
    const sku = dataset.skus.get(movement.skuId);
    items.push({
      ...movement,
      occurredOn: businessDateOf(movement.occurredAt),
      categoryId: sku?.categoryId ?? '',
      skuCode: sku?.sku ?? movement.skuId,
      skuName: sku?.name ?? movement.skuId,
      warehouseCode: dataset.warehouses.get(movement.warehouseId)?.code ?? movement.warehouseId,
      actorName: dataset.users.get(movement.actorId)?.displayName ?? movement.actorId,
    });
  }
  return runListQuery(items, movementResource, query);
}

export function listWarehouses(
  runtime: ApiRuntime,
): (Warehouse & { managerName: string; locationCount: number })[] {
  runtime.require('inventory.view');
  const { dataset } = runtime.store;
  return [...dataset.warehouses.values()].map((warehouse) => ({
    ...warehouse,
    managerName: dataset.users.get(warehouse.managerId)?.displayName ?? warehouse.managerId,
    locationCount: runtime.indexes.locationsByWarehouse.get(warehouse.id).length,
  }));
}

export function listLocations(runtime: ApiRuntime, warehouseId: string): WarehouseLocation[] {
  runtime.require('inventory.view', { warehouseId });
  return runtime.indexes.locationsByWarehouse
    .get(warehouseId)
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code));
}

// ---------------------------------------------------------------------------
// Transfers and cycle counts

export interface TransferListItem extends InventoryTransfer {
  sourceWarehouseCode: string;
  destinationWarehouseCode: string;
  requestedByName: string;
  lineCount: number;
}

export const transferResource: ResourceDefinition<TransferListItem> = {
  fields: fields<TransferListItem>({
    id: ['string', (item) => item.id],
    transferNumber: ['string', (item) => item.transferNumber],
    status: ['enum', (item) => item.status],
    sourceWarehouseId: ['string', (item) => item.sourceWarehouseId],
    destinationWarehouseId: ['string', (item) => item.destinationWarehouseId],
    requestedDate: ['date', (item) => item.requestedDate],
    lineCount: ['number', (item) => item.lineCount],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.transferNumber, item.sourceWarehouseCode, item.destinationWarehouseCode],
  defaultSort: '-requestedDate',
};

export function transferListItem(
  runtime: ApiRuntime,
  transfer: InventoryTransfer,
): TransferListItem {
  const { dataset } = runtime.store;
  return {
    ...transfer,
    sourceWarehouseCode:
      dataset.warehouses.get(transfer.sourceWarehouseId)?.code ?? transfer.sourceWarehouseId,
    destinationWarehouseCode:
      dataset.warehouses.get(transfer.destinationWarehouseId)?.code ??
      transfer.destinationWarehouseId,
    requestedByName: dataset.users.get(transfer.requestedBy)?.displayName ?? transfer.requestedBy,
    lineCount: runtime.indexes.transferLinesByTransfer.get(transfer.id).length,
  };
}

export function listTransfers(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<TransferListItem> {
  const user = runtime.require('inventory.view');
  const warehouses = runtime.authorization.warehouseIdsFor(user.id);
  const items: TransferListItem[] = [];
  for (const transfer of runtime.store.dataset.transfers.values()) {
    if (
      warehouses !== 'all' &&
      !warehouses.includes(transfer.sourceWarehouseId) &&
      !warehouses.includes(transfer.destinationWarehouseId)
    )
      continue;
    items.push(transferListItem(runtime, transfer));
  }
  return runListQuery(items, transferResource, query);
}

export function getTransfer(
  runtime: ApiRuntime,
  id: string,
): {
  transfer: TransferListItem;
  lines: (InventoryTransferLine & { skuCode: string; skuName: string })[];
} {
  runtime.require('inventory.view');
  const transfer = runtime.store.dataset.transfers.get(id);
  if (!transfer) throw notFound('Transfer', id);
  return {
    transfer: transferListItem(runtime, transfer),
    lines: runtime.indexes.transferLinesByTransfer.get(id).map((line) => {
      const sku = runtime.store.dataset.skus.get(line.skuId);
      return { ...line, skuCode: sku?.sku ?? line.skuId, skuName: sku?.name ?? line.skuId };
    }),
  };
}

export interface CycleCountListItem extends CycleCount {
  warehouseCode: string;
  lineCount: number;
  varianceLineCount: number;
}

export const cycleCountResource: ResourceDefinition<CycleCountListItem> = {
  fields: fields<CycleCountListItem>({
    id: ['string', (item) => item.id],
    cycleCountNumber: ['string', (item) => item.cycleCountNumber],
    status: ['enum', (item) => item.status],
    warehouseId: ['string', (item) => item.warehouseId],
    plannedDate: ['date', (item) => item.plannedDate],
    lineCount: ['number', (item) => item.lineCount],
    varianceLineCount: ['number', (item) => item.varianceLineCount],
  }),
  search: (item) => [item.cycleCountNumber, item.warehouseCode],
  defaultSort: '-plannedDate',
};

export function cycleCountListItem(runtime: ApiRuntime, count: CycleCount): CycleCountListItem {
  const lines = runtime.indexes.cycleCountLinesByCount.get(count.id);
  return {
    ...count,
    warehouseCode:
      runtime.store.dataset.warehouses.get(count.warehouseId)?.code ?? count.warehouseId,
    lineCount: lines.length,
    varianceLineCount: lines.filter(
      (line) => line.variance !== undefined && quantityToMilli(line.variance) !== 0,
    ).length,
  };
}

export function listCycleCounts(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<CycleCountListItem> {
  const user = runtime.require('inventory.view');
  const warehouses = runtime.authorization.warehouseIdsFor(user.id);
  const items: CycleCountListItem[] = [];
  for (const count of runtime.store.dataset.cycleCounts.values()) {
    if (warehouses !== 'all' && !warehouses.includes(count.warehouseId)) continue;
    items.push(cycleCountListItem(runtime, count));
  }
  return runListQuery(items, cycleCountResource, query);
}

export function getCycleCount(
  runtime: ApiRuntime,
  id: string,
): {
  cycleCount: CycleCountListItem;
  lines: (CycleCountLine & { skuCode: string; skuName: string; locationCode: string })[];
} {
  const count = runtime.store.dataset.cycleCounts.get(id);
  if (!count) throw notFound('Cycle count', id);
  runtime.require('inventory.view', { warehouseId: count.warehouseId });
  return {
    cycleCount: cycleCountListItem(runtime, count),
    lines: runtime.indexes.cycleCountLinesByCount.get(id).map((line) => {
      const sku = runtime.store.dataset.skus.get(line.skuId);
      return {
        ...line,
        skuCode: sku?.sku ?? line.skuId,
        skuName: sku?.name ?? line.skuId,
        locationCode:
          runtime.store.dataset.warehouseLocations.get(line.locationId)?.code ?? line.locationId,
      };
    }),
  };
}
