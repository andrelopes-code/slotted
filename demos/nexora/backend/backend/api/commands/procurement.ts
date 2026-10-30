import {
  addBusinessDays,
  compareDates,
  evaluatePurchaseOrderApproval,
  milliToQuantity,
  quantityToMilli,
  FX_RATES_TO_USD,
  addMoney,
  fromUsd,
  money,
  ratioBps,
  regionByCode,
  usdMinor,
  type GoodsReceipt,
  type RegionCode,
  type PaymentTermsCode,
  type PurchaseOrder,
  type PurchaseOrderLine,
  type Supplier,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import {
  getGoodsReceipt,
  getPurchaseOrder,
  lastAcceptedUnitCost,
  supplierListItem,
  type PurchaseOrderDetail,
  type SupplierListItem,
} from '../resources/procurement';
import { cancelApproval, createApprovalRequest, type ApprovalDecisionHooks } from './approvals';
import {
  dollars,
  domainError,
  finalize,
  load,
  metadata,
  open,
  transition,
  trimmed,
  Validator,
} from './helpers';
import type { InventoryCommands } from './inventory';

export interface PurchaseOrderLineInput {
  skuId: string;
  quantity: string;
  unitCostMinor?: number;
  expectedDate?: string;
}

export interface PurchaseOrderInput {
  supplierId: string;
  destinationWarehouseId: string;
  lines: PurchaseOrderLineInput[];
  expectedDate?: string;
  freightMinor?: number;
  notes?: string;
}

export function createProcurementCommands(runtime: ApiRuntime, inventory: InventoryCommands) {
  const suppliers = {
    create: (
      input: {
        displayName: string;
        legalName?: string;
        category: string;
        paymentTermsCode?: PaymentTermsCode;
        relationshipTier?: Supplier['relationshipTier'];
        primaryContactName?: string;
        primaryContactEmail?: string;
        tags?: string[];
        /** Defaults to 'US'. */
        regionCode?: RegionCode;
      },
      options?: MutationOptions,
    ): Promise<SupplierListItem> =>
      runtime.command('POST /suppliers', options, input, (tx) => {
        runtime.require('suppliers.manage');
        new Validator()
          .required('displayName', input.displayName)
          .required('category', input.category)
          .throwIfAny();
        const id = runtime.store.nextId('supplier');
        const supplier: Supplier = {
          id,
          organizationId: runtime.store.dataset.organization.id,
          supplierNumber: runtime.store.nextBusinessNumber('supplier'),
          regionCode: input.regionCode ?? 'US',
          legalName: trimmed(input.legalName) ?? input.displayName.trim(),
          displayName: input.displayName.trim(),
          status: 'active',
          relationshipTier: input.relationshipTier ?? 'standard',
          category: input.category.trim(),
          paymentTermsCode: input.paymentTermsCode ?? 'NET_30',
          supportedCurrencies: [regionByCode(input.regionCode ?? 'US').currency],
          tags: input.tags ?? [],
          metadata: metadata(tx, id),
          ...(trimmed(input.primaryContactName)
            ? { primaryContactName: trimmed(input.primaryContactName) as string }
            : {}),
          ...(trimmed(input.primaryContactEmail)
            ? { primaryContactEmail: trimmed(input.primaryContactEmail) as string }
            : {}),
        };
        tx.create('suppliers', supplier);
        tx.audit('supplier.created', 'supplier', id, { nextVersion: 1 });
        return supplierListItem(runtime, supplier);
      }),

    update: (
      id: string,
      input: Partial<
        Pick<
          Supplier,
          | 'displayName'
          | 'legalName'
          | 'category'
          | 'paymentTermsCode'
          | 'relationshipTier'
          | 'status'
          | 'primaryContactName'
          | 'primaryContactEmail'
          | 'preferredShippingTerms'
          | 'tags'
        >
      >,
      options?: MutationOptions,
    ): Promise<SupplierListItem> =>
      runtime.command('PATCH /suppliers/:id', options, { id, input }, (tx) => {
        runtime.require('suppliers.manage');
        const supplier = open(tx, 'suppliers', id, 'Supplier', options);
        if (input.status === 'inactive') {
          const openPos = runtime.indexes.purchaseOrdersBySupplier
            .get(id)
            .filter(
              (po) =>
                po.status === 'sent' ||
                po.status === 'acknowledged' ||
                po.status === 'partially_received' ||
                po.status === 'approved' ||
                po.status === 'pending_approval',
            );
          if (openPos.length > 0)
            throw domainError(
              'SUPPLIER_HAS_OPEN_POS',
              `${supplier.displayName} has ${openPos.length} open purchase orders`,
              409,
            );
        }
        const changed: string[] = [];
        for (const key of [
          'displayName',
          'legalName',
          'category',
          'paymentTermsCode',
          'relationshipTier',
          'status',
          'primaryContactName',
          'primaryContactEmail',
          'preferredShippingTerms',
          'tags',
        ] as const) {
          const value = input[key];
          if (value === undefined || value === supplier[key]) continue;
          (supplier as unknown as Record<string, unknown>)[key] =
            typeof value === 'string' ? value.trim() : value;
          changed.push(key);
        }
        finalize(tx, 'suppliers', supplier, 'supplier.updated', 'supplier', changed);
        return supplierListItem(runtime, supplier);
      }),
  };

  const buildLines = (
    tx: Transaction,
    po: PurchaseOrder,
    inputs: PurchaseOrderLineInput[],
  ): { subtotal: number; maxVarianceBps: number } => {
    let subtotal = 0;
    let maxVarianceBps = 0;
    for (const [index, input] of inputs.entries()) {
      const sku = load(runtime, 'skus', input.skuId, 'SKU');
      if (sku.status === 'discontinued')
        throw domainError('SKU_DISCONTINUED', `${sku.sku} is discontinued`);
      if (quantityToMilli(input.quantity) <= 0)
        throw domainError('VALIDATION_FAILED', `Quantity for ${sku.sku} must be positive`);
      const mapping = runtime.indexes.mappingsBySku
        .get(sku.id)
        .find((candidate) => candidate.supplierId === po.supplierId);
      const unitCost =
        input.unitCostMinor ??
        (mapping?.currency === po.currency ? mapping.unitCost.minor : undefined) ??
        fromUsd(sku.standardCost, po.currency).minor;
      const previous = lastAcceptedCost(po.supplierId, sku.id);
      if (previous)
        maxVarianceBps = Math.max(maxVarianceBps, ratioBps(unitCost - previous, previous));
      const lineTotal = Math.round((unitCost * quantityToMilli(input.quantity)) / 1000);
      subtotal += lineTotal;
      const line: PurchaseOrderLine = {
        id: runtime.store.nextId('purchaseOrderLine'),
        organizationId: po.organizationId,
        purchaseOrderId: po.id,
        lineNumber: index + 1,
        skuId: sku.id,
        supplierSku: mapping?.supplierSku ?? sku.manufacturerPartNumber ?? sku.sku,
        description: sku.name,
        orderedQuantity: input.quantity,
        receivedAcceptedQuantity: '0',
        receivedDamagedQuantity: '0',
        rejectedQuantity: '0',
        unitCost: money(unitCost, po.currency),
        taxRateBps: 0,
        lineTotal: money(lineTotal, po.currency),
        expectedDate: input.expectedDate ?? po.expectedDate,
      };
      tx.create('purchaseOrderLines', line);
    }
    return { subtotal, maxVarianceBps };
  };

  const lastAcceptedCost = (supplierId: string, skuId: string): number | undefined =>
    lastAcceptedUnitCost(runtime, supplierId, skuId)?.minor;

  const recalcTotals = (po: PurchaseOrder, subtotalMinor: number, freightMinor: number): void => {
    po.subtotal = money(subtotalMinor, po.currency);
    po.taxTotal = money(0, po.currency);
    po.freight = money(freightMinor, po.currency);
    po.total = money(subtotalMinor + freightMinor, po.currency);
  };

  const poHooks: ApprovalDecisionHooks = {
    onApproved: (tx, request) => {
      const po = load(runtime, 'purchaseOrders', request.targetId, 'Purchase order');
      tx.touch('purchaseOrders', po);
      if (po.status === 'pending_approval') po.status = 'approved';
      finalize(tx, 'purchaseOrders', po, 'purchase_order.approved', 'purchase_order', ['status']);
    },
    onRejected: (tx, request, reason) => {
      const po = load(runtime, 'purchaseOrders', request.targetId, 'Purchase order');
      tx.touch('purchaseOrders', po);
      po.status = 'draft';
      delete po.approvalRequestId;
      po.notes = `${po.notes ? `${po.notes}\n` : ''}Approval rejected: ${reason}`;
      finalize(tx, 'purchaseOrders', po, 'purchase_order.rejected', 'purchase_order', ['status']);
    },
    onChangesRequested: (tx, request, reason) => {
      const po = load(runtime, 'purchaseOrders', request.targetId, 'Purchase order');
      tx.touch('purchaseOrders', po);
      po.status = 'draft';
      delete po.approvalRequestId;
      po.notes = `${po.notes ? `${po.notes}\n` : ''}Changes requested: ${reason}`;
      finalize(tx, 'purchaseOrders', po, 'purchase_order.changes_requested', 'purchase_order', [
        'status',
      ]);
    },
  };

  /** Section 65.6 "Create" — the interactive command and a workflow's purchase-order draft. */
  const createPurchaseOrder = (tx: Transaction, input: PurchaseOrderInput): PurchaseOrderDetail => {
    const actor = tx.require('purchase_orders.create');
    const supplier = load(runtime, 'suppliers', input.supplierId, 'Supplier');
    if (supplier.status !== 'active')
      throw domainError(
        supplier.status === 'on_hold' ? 'SUPPLIER_ON_HOLD' : 'SUPPLIER_INACTIVE',
        `${supplier.displayName} is ${supplier.status} and cannot receive purchase orders`,
        409,
      );
    const warehouse = load(runtime, 'warehouses', input.destinationWarehouseId, 'Warehouse');
    if (warehouse.status === 'closed')
      throw domainError('WAREHOUSE_CLOSED', `${warehouse.code} is closed`, 409);
    const poCurrency = supplier.supportedCurrencies[0] ?? 'USD';
    if (!input.lines || input.lines.length === 0)
      throw domainError('VALIDATION_FAILED', 'A purchase order needs at least one line');
    const id = runtime.store.nextId('purchaseOrder');
    const today = runtime.store.today;
    const po: PurchaseOrder = {
      id,
      organizationId: supplier.organizationId,
      purchaseOrderNumber: runtime.store.nextBusinessNumber('purchaseOrder'),
      supplierId: supplier.id,
      buyerId: actor.id,
      destinationWarehouseId: warehouse.id,
      status: 'draft',
      exceptionFlags: [],
      createdBusinessDate: today,
      expectedDate: input.expectedDate ?? addBusinessDays(today, 10),
      currency: poCurrency,
      fxRateToUsd: FX_RATES_TO_USD[poCurrency],
      subtotal: money(0, poCurrency),
      taxTotal: money(0, poCurrency),
      freight: money(input.freightMinor ?? 0, poCurrency),
      total: money(0, poCurrency),
      metadata: metadata(tx, id),
      ...(trimmed(input.notes) ? { notes: trimmed(input.notes) as string } : {}),
    };
    tx.create('purchaseOrders', po);
    const { subtotal } = buildLines(tx, po, input.lines);
    recalcTotals(po, subtotal, input.freightMinor ?? 0);
    tx.dirty('purchaseOrders', po);
    tx.audit('purchase_order.created', 'purchase_order', id, { nextVersion: 1 });
    tx.activityEvent({
      type: 'purchase_order.created',
      subjectType: 'purchase_order',
      subjectId: id,
      subjectLabel: po.purchaseOrderNumber,
      summary: `Purchase order ${po.purchaseOrderNumber} drafted for ${supplier.displayName} (${dollars(po.total)})`,
    });
    return getPurchaseOrder(runtime, id);
  };

  const purchaseOrders = {
    create: (input: PurchaseOrderInput, options?: MutationOptions): Promise<PurchaseOrderDetail> =>
      runtime.command('POST /purchase-orders', options, input, (tx) =>
        createPurchaseOrder(tx, input),
      ),

    update: (
      id: string,
      input: Partial<PurchaseOrderInput>,
      options?: MutationOptions,
    ): Promise<PurchaseOrderDetail> =>
      runtime.command('PATCH /purchase-orders/:id', options, { id, input }, (tx) => {
        runtime.require('purchase_orders.edit');
        const po = load(runtime, 'purchaseOrders', id, 'Purchase order');
        if (po.status !== 'draft' && po.status !== 'approved')
          throw transition('Purchase order', po.status, 'be edited');
        open(tx, 'purchaseOrders', id, 'Purchase order', options);
        const changed: string[] = [];
        if (input.expectedDate) {
          po.expectedDate = input.expectedDate;
          changed.push('expectedDate');
        }
        if (input.notes !== undefined) {
          po.notes = trimmed(input.notes) ?? '';
          changed.push('notes');
        }
        if (input.destinationWarehouseId) {
          const warehouse = load(runtime, 'warehouses', input.destinationWarehouseId, 'Warehouse');
          if (warehouse.status === 'closed')
            throw domainError('WAREHOUSE_CLOSED', `${warehouse.code} is closed`, 409);
          po.destinationWarehouseId = warehouse.id;
          changed.push('destinationWarehouseId');
        }
        if (input.lines || input.freightMinor !== undefined) {
          if (input.lines) {
            for (const line of runtime.indexes.poLinesByPo.get(id))
              tx.remove('purchaseOrderLines', line.id);
            const { subtotal } = buildLines(tx, po, input.lines);
            recalcTotals(po, subtotal, input.freightMinor ?? po.freight.minor);
            changed.push('lines');
          } else recalcTotals(po, po.subtotal.minor, input.freightMinor ?? po.freight.minor);
          if (po.status === 'approved') {
            cancelApproval(tx, po.approvalRequestId, 'Purchase order edited after approval');
            delete po.approvalRequestId;
            po.status = 'draft';
            changed.push('status');
          }
        }
        finalize(tx, 'purchaseOrders', po, 'purchase_order.updated', 'purchase_order', changed);
        return getPurchaseOrder(runtime, id);
      }),

    submit: (id: string, options?: MutationOptions): Promise<PurchaseOrderDetail> =>
      runtime.command('POST /purchase-orders/:id/submit', options, { id }, (tx) => {
        runtime.require('purchase_orders.submit');
        const po = load(runtime, 'purchaseOrders', id, 'Purchase order');
        if (po.status !== 'draft') throw transition('Purchase order', po.status, 'be submitted');
        const supplier = load(runtime, 'suppliers', po.supplierId, 'Supplier');
        if (supplier.status !== 'active')
          throw domainError(
            supplier.status === 'on_hold' ? 'SUPPLIER_ON_HOLD' : 'SUPPLIER_INACTIVE',
            `${supplier.displayName} is ${supplier.status}`,
            409,
          );
        open(tx, 'purchaseOrders', id, 'Purchase order', options);
        let maxVariance = 0;
        for (const line of runtime.indexes.poLinesByPo.get(id)) {
          const previous = lastAcceptedCost(po.supplierId, line.skuId);
          if (previous)
            maxVariance = Math.max(maxVariance, ratioBps(line.unitCost.minor - previous, previous));
        }
        const evaluation = evaluatePurchaseOrderApproval({
          approvalValueUsdMinor: usdMinor(addMoney(po.subtotal, po.freight), po.fxRateToUsd),
          supplierConditional: supplier.relationshipTier === 'conditional',
          maxCostVarianceBps: maxVariance,
        });
        if (evaluation.required) {
          const request = createApprovalRequest(tx, {
            targetType: 'purchase_order',
            targetId: id,
            targetNumber: po.purchaseOrderNumber,
            evaluation,
            requestedBy: tx.actor.id,
            amount: addMoney(po.subtotal, po.freight),
          });
          po.status = 'pending_approval';
          po.approvalRequestId = request.id;
        } else po.status = 'approved';
        finalize(tx, 'purchaseOrders', po, 'purchase_order.submitted', 'purchase_order', [
          'status',
        ]);
        return getPurchaseOrder(runtime, id);
      }),

    send: (id: string, options?: MutationOptions): Promise<PurchaseOrderDetail> =>
      runtime.command('POST /purchase-orders/:id/send', options, { id }, (tx) => {
        runtime.require('purchase_orders.send');
        const po = open(tx, 'purchaseOrders', id, 'Purchase order', options);
        if (po.status !== 'approved') throw transition('Purchase order', po.status, 'be sent');
        po.status = 'sent';
        po.sentAt = tx.occurredAt;
        finalize(tx, 'purchaseOrders', po, 'purchase_order.sent', 'purchase_order', [
          'status',
          'sentAt',
        ]);
        tx.activityEvent({
          type: 'purchase_order.sent',
          subjectType: 'purchase_order',
          subjectId: id,
          subjectLabel: po.purchaseOrderNumber,
          summary: `Purchase order ${po.purchaseOrderNumber} sent to ${runtime.store.dataset.suppliers.get(po.supplierId)?.displayName ?? 'supplier'}`,
        });
        return getPurchaseOrder(runtime, id);
      }),

    acknowledge: (
      id: string,
      input: { expectedDate?: string } = {},
      options?: MutationOptions,
    ): Promise<PurchaseOrderDetail> =>
      runtime.command('POST /purchase-orders/:id/acknowledge', options, { id, input }, (tx) => {
        runtime.require('purchase_orders.edit');
        const po = open(tx, 'purchaseOrders', id, 'Purchase order', options);
        if (po.status !== 'sent') throw transition('Purchase order', po.status, 'be acknowledged');
        po.status = 'acknowledged';
        po.supplierAcknowledgedAt = tx.occurredAt;
        if (input.expectedDate) {
          po.expectedDate = input.expectedDate;
          po.exceptionFlags = po.exceptionFlags.filter((flag) => flag !== 'delayed');
          if (compareDates(input.expectedDate, runtime.store.today) < 0)
            po.exceptionFlags.push('delayed');
        }
        finalize(tx, 'purchaseOrders', po, 'purchase_order.acknowledged', 'purchase_order', [
          'status',
          'supplierAcknowledgedAt',
        ]);
        return getPurchaseOrder(runtime, id);
      }),

    cancel: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<PurchaseOrderDetail> =>
      runtime.command('POST /purchase-orders/:id/cancel', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        runtime.require('purchase_orders.cancel');
        const po = open(tx, 'purchaseOrders', id, 'Purchase order', options);
        if (po.status === 'received' || po.status === 'closed' || po.status === 'cancelled')
          throw transition('Purchase order', po.status, 'be cancelled');
        if (
          runtime.indexes.poLinesByPo
            .get(id)
            .some(
              (line) =>
                quantityToMilli(line.receivedAcceptedQuantity) +
                  quantityToMilli(line.receivedDamagedQuantity) >
                0,
            )
        )
          throw domainError(
            'PO_QUANTITY_BELOW_RECEIVED',
            'A partially received purchase order must be closed short instead of cancelled',
            409,
          );
        cancelApproval(tx, po.approvalRequestId, 'Purchase order cancelled');
        po.status = 'cancelled';
        po.cancelledAt = tx.occurredAt;
        po.notes = `${po.notes ? `${po.notes}\n` : ''}Cancelled: ${input.reason.trim()}`;
        finalize(tx, 'purchaseOrders', po, 'purchase_order.cancelled', 'purchase_order', [
          'status',
          'cancelledAt',
        ]);
        return getPurchaseOrder(runtime, id);
      }),

    closeShort: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<PurchaseOrderDetail> =>
      runtime.command('POST /purchase-orders/:id/close-short', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        runtime.require('purchase_orders.approve');
        const po = open(tx, 'purchaseOrders', id, 'Purchase order', options);
        if (
          po.status !== 'partially_received' &&
          po.status !== 'sent' &&
          po.status !== 'acknowledged'
        )
          throw transition('Purchase order', po.status, 'be closed short');
        for (const line of runtime.indexes.poLinesByPo.get(id)) {
          const received =
            quantityToMilli(line.receivedAcceptedQuantity) +
            quantityToMilli(line.receivedDamagedQuantity) +
            quantityToMilli(line.rejectedQuantity);
          if (received < quantityToMilli(line.orderedQuantity)) {
            tx.touch('purchaseOrderLines', line).orderedQuantity = milliToQuantity(received);
            tx.dirty('purchaseOrderLines', line);
          }
        }
        po.status = 'closed';
        po.closedAt = tx.occurredAt;
        po.exceptionFlags = po.exceptionFlags.filter((flag) => flag !== 'delayed');
        po.notes = `${po.notes ? `${po.notes}\n` : ''}Closed short: ${input.reason.trim()}`;
        finalize(tx, 'purchaseOrders', po, 'purchase_order.closed_short', 'purchase_order', [
          'status',
          'closedAt',
        ]);
        return getPurchaseOrder(runtime, id);
      }),

    /** Section 65.7 — goods receipt with tolerance, damage and rejection handling. */
    receive: (
      id: string,
      input: {
        lines: Record<
          string,
          {
            accepted: string;
            damaged?: string;
            rejected?: string;
            locationId?: string;
            note?: string;
          }
        >;
        notes?: string;
        overReceiptReason?: string;
      },
      options?: MutationOptions,
    ): Promise<ReturnType<typeof getGoodsReceipt>> =>
      runtime.command('POST /goods-receipts', options, { id, input }, (tx) => {
        const po = load(runtime, 'purchaseOrders', id, 'Purchase order');
        runtime.require('receipts.create', { warehouseId: po.destinationWarehouseId });
        if (
          po.status !== 'sent' &&
          po.status !== 'acknowledged' &&
          po.status !== 'partially_received'
        )
          throw transition('Purchase order', po.status, 'be received');
        open(tx, 'purchaseOrders', id, 'Purchase order', options);
        const receiptId = runtime.store.nextId('goodsReceipt');
        const receipt: GoodsReceipt = {
          id: receiptId,
          organizationId: po.organizationId,
          receiptNumber: runtime.store.nextBusinessNumber('goodsReceipt'),
          purchaseOrderId: id,
          supplierId: po.supplierId,
          warehouseId: po.destinationWarehouseId,
          receivedBy: tx.actor.id,
          receivedAt: tx.occurredAt,
          metadata: metadata(tx, receiptId),
          ...(trimmed(input.notes) ? { notes: trimmed(input.notes) as string } : {}),
        };
        tx.create('goodsReceipts', receipt);
        let overTolerance = false;
        let any = false;
        for (const line of runtime.indexes.poLinesByPo.get(id)) {
          const entry = input.lines[line.id];
          if (!entry) continue;
          const accepted = quantityToMilli(entry.accepted);
          const damaged = entry.damaged ? quantityToMilli(entry.damaged) : 0;
          const rejected = entry.rejected ? quantityToMilli(entry.rejected) : 0;
          if (accepted + damaged + rejected <= 0) continue;
          any = true;
          const ordered = quantityToMilli(line.orderedQuantity);
          const already =
            quantityToMilli(line.receivedAcceptedQuantity) +
            quantityToMilli(line.receivedDamagedQuantity) +
            quantityToMilli(line.rejectedQuantity);
          if (already + accepted + damaged + rejected > ordered * 1.05) {
            overTolerance = true;
            if (!runtime.can('purchase_orders.approve') || !trimmed(input.overReceiptReason))
              throw domainError(
                'OVER_RECEIPT_TOLERANCE',
                `Receipt exceeds the 5% over-receipt tolerance on ${line.description}; purchase_orders.approve and a reason are required`,
                409,
              );
          }
          tx.touch('purchaseOrderLines', line);
          line.receivedAcceptedQuantity = milliToQuantity(
            quantityToMilli(line.receivedAcceptedQuantity) + accepted,
          );
          line.receivedDamagedQuantity = milliToQuantity(
            quantityToMilli(line.receivedDamagedQuantity) + damaged,
          );
          line.rejectedQuantity = milliToQuantity(
            quantityToMilli(line.rejectedQuantity) + rejected,
          );
          tx.dirty('purchaseOrderLines', line);
          tx.create('goodsReceiptLines', {
            id: runtime.store.nextId('goodsReceiptLine'),
            organizationId: po.organizationId,
            goodsReceiptId: receiptId,
            purchaseOrderLineId: line.id,
            skuId: line.skuId,
            acceptedQuantity: milliToQuantity(accepted),
            damagedQuantity: milliToQuantity(damaged),
            rejectedQuantity: milliToQuantity(rejected),
            unitCost: line.unitCost,
            ...(entry.locationId ? { locationId: entry.locationId } : {}),
            ...(trimmed(entry.note) ? { note: trimmed(entry.note) as string } : {}),
          });
          if (accepted + damaged > 0) {
            inventory.movement(tx, {
              type: 'receipt',
              skuId: line.skuId,
              warehouseId: po.destinationWarehouseId,
              onHandDelta: milliToQuantity(accepted + damaged),
              damagedDelta: '0',
              quarantineDelta: '0',
              sourceEntityType: 'goods_receipt',
              sourceEntityId: receiptId,
              ...(entry.locationId ? { locationId: entry.locationId } : {}),
            });
            if (damaged > 0)
              inventory.movement(tx, {
                type: 'damage',
                skuId: line.skuId,
                warehouseId: po.destinationWarehouseId,
                onHandDelta: '0',
                damagedDelta: milliToQuantity(damaged),
                quarantineDelta: '0',
                sourceEntityType: 'goods_receipt',
                sourceEntityId: receiptId,
                reason: 'Damaged on receipt',
              });
          }
        }
        if (!any)
          throw domainError(
            'RECEIPT_EMPTY',
            'A goods receipt needs at least one received quantity',
          );
        if (overTolerance) receipt.overReceiptReason = trimmed(input.overReceiptReason) as string;
        const complete = runtime.indexes.poLinesByPo
          .get(id)
          .every(
            (line) =>
              quantityToMilli(line.receivedAcceptedQuantity) +
                quantityToMilli(line.receivedDamagedQuantity) +
                quantityToMilli(line.rejectedQuantity) >=
              quantityToMilli(line.orderedQuantity) * 0.95,
          );
        po.status = complete ? 'received' : 'partially_received';
        if (complete) po.exceptionFlags = po.exceptionFlags.filter((flag) => flag !== 'delayed');
        finalize(
          tx,
          'purchaseOrders',
          po,
          complete ? 'purchase_order.received' : 'purchase_order.partially_received',
          'purchase_order',
          ['status'],
        );
        tx.audit('goods_receipt.created', 'goods_receipt', receiptId, { nextVersion: 1 });
        tx.activityEvent({
          type: 'purchase_order.received',
          subjectType: 'purchase_order',
          subjectId: id,
          subjectLabel: po.purchaseOrderNumber,
          summary: `Goods receipt ${receipt.receiptNumber} posted against ${po.purchaseOrderNumber}${complete ? ' (complete)' : ''}`,
        });
        // Backorder relief: notify owners of orders waiting on the received SKUs.
        for (const line of runtime.indexes.poLinesByPo.get(id)) {
          const position = runtime.projections.inventoryAt(line.skuId, po.destinationWarehouseId);
          if (quantityToMilli(position.backordered) > 0) {
            for (const orderLine of runtime.indexes.linesBySkuWarehouse.get(
              `${line.skuId}:${po.destinationWarehouseId}`,
            )) {
              const order = runtime.store.dataset.salesOrders.get(orderLine.orderId);
              if (!order || order.status !== 'confirmed' || order.allocationStatus === 'allocated')
                continue;
              tx.notify(
                order.ownerId,
                'info',
                `Stock received for ${order.orderNumber}`,
                `${line.description} is available to allocate at ${runtime.store.dataset.warehouses.get(po.destinationWarehouseId)?.code ?? ''}.`,
                { type: 'sales_order', id: order.id },
              );
            }
          }
        }
        return getGoodsReceipt(runtime, receiptId);
      }),
  };

  return {
    suppliers,
    purchaseOrders,
    services: { createPurchaseOrder },
    hooks: { purchase_order: poHooks },
  };
}

export type ProcurementCommands = ReturnType<typeof createProcurementCommands>;
