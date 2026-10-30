import {
  milliToQuantity,
  quantityFitsPrecision,
  quantityToMilli,
  type AdjustmentReasonCode,
  type CycleCount,
  type CycleCountLine,
  type InventoryTransfer,
  type InventoryTransferLine,
  type StockMovement,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import {
  getCycleCount,
  getTransfer,
  inventoryListItem,
  type CycleCountListItem,
  type InventoryListItem,
  type TransferListItem,
} from '../resources/operations';
import { createApprovalRequest, type ApprovalDecisionHooks } from './approvals';
import {
  domainError,
  finalize,
  load,
  metadata,
  open,
  transition,
  trimmed,
  Validator,
} from './helpers';

const ADJUSTMENT_REASONS: AdjustmentReasonCode[] = [
  'count_correction',
  'damage',
  'found_stock',
  'data_correction',
  'other',
];

export function createInventoryCommands(runtime: ApiRuntime) {
  const movement = (
    tx: Transaction,
    input: Omit<StockMovement, 'id' | 'organizationId' | 'occurredAt' | 'actorId'>,
  ): StockMovement => {
    const record: StockMovement = {
      id: runtime.store.nextId('stockMovement'),
      organizationId: runtime.store.dataset.organization.id,
      occurredAt: tx.occurredAt,
      actorId: tx.actor.id,
      ...input,
    };
    tx.create('stockMovements', record);
    return record;
  };

  /** Section 60.7 — manual adjustment with reason and note thresholds. */
  const adjust = (
    input: {
      skuId: string;
      warehouseId: string;
      locationId?: string;
      quantityDelta: string;
      reason: AdjustmentReasonCode;
      note?: string;
    },
    options?: MutationOptions,
  ): Promise<InventoryListItem> =>
    runtime.command('POST /inventory/adjustments', options, input, (tx) => {
      runtime.require('inventory.adjust', { warehouseId: input.warehouseId });
      const sku = load(runtime, 'skus', input.skuId, 'SKU');
      const warehouse = load(runtime, 'warehouses', input.warehouseId, 'Warehouse');
      const validator = new Validator().oneOf('reason', input.reason, ADJUSTMENT_REASONS);
      validator.check(
        quantityFitsPrecision(input.quantityDelta.replace('-', ''), sku.quantityPrecision),
        'quantityDelta',
        'QUANTITY_PRECISION_EXCEEDED',
        `${sku.sku} allows ${sku.quantityPrecision} decimal places`,
      );
      const delta = quantityToMilli(input.quantityDelta);
      validator.check(
        delta !== 0,
        'quantityDelta',
        'INVALID_VALUE',
        'quantityDelta cannot be zero',
      );
      const absolute = Math.abs(delta);
      const valueMinor = Math.round((sku.standardCost.minor * absolute) / 1000);
      if ((absolute >= 10_000 || valueMinor >= 100_000) && !trimmed(input.note))
        validator.errors.push({
          field: 'note',
          code: 'ADJUSTMENT_NOTE_REQUIRED',
          message: 'An explanatory note is required for adjustments of 10 units or $1,000 or more',
        });
      validator.throwIfAny();
      if (warehouse.status === 'closed')
        throw domainError('WAREHOUSE_CLOSED', `${warehouse.code} is closed`, 409);
      if (input.locationId) {
        const location = load(runtime, 'warehouseLocations', input.locationId, 'Location');
        if (location.status === 'blocked')
          throw domainError('LOCATION_BLOCKED', `${location.code} is blocked`, 409);
      }
      const position = runtime.projections.inventoryAt(sku.id, warehouse.id);
      if (delta < 0 && quantityToMilli(position.sellableOnHand) + delta < 0)
        throw domainError(
          'INSUFFICIENT_AVAILABILITY',
          `Adjustment would take ${sku.sku} below zero at ${warehouse.code}`,
          409,
        );
      const isDamage = input.reason === 'damage' && delta < 0;
      movement(tx, {
        type: isDamage ? 'damage' : delta > 0 ? 'adjustment_in' : 'adjustment_out',
        skuId: sku.id,
        warehouseId: warehouse.id,
        onHandDelta: isDamage ? '0' : milliToQuantity(delta),
        damagedDelta: isDamage ? milliToQuantity(absolute) : '0',
        quarantineDelta: '0',
        sourceEntityType: 'manual_adjustment',
        sourceEntityId: tx.correlationId,
        reason: `${input.reason}${trimmed(input.note) ? `: ${trimmed(input.note)}` : ''}`,
        ...(input.locationId ? { locationId: input.locationId } : {}),
      });
      tx.audit('inventory.adjusted', 'inventory_balance', `${sku.id}:${warehouse.id}`, {
        changedFields: ['onHand'],
        after: { quantityDelta: input.quantityDelta, reason: input.reason },
      });
      tx.activityEvent({
        type: 'inventory.adjusted',
        subjectType: 'sku',
        subjectId: sku.id,
        subjectLabel: sku.sku,
        summary: `${sku.sku} adjusted by ${input.quantityDelta} at ${warehouse.code} (${input.reason})`,
      });
      return inventoryListItem(runtime, runtime.projections.inventoryAt(sku.id, warehouse.id));
    });

  // ---------------------------------------------------------------------------
  // Transfers (section 61)

  const transfers = {
    create: (
      input: {
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        lines: { skuId: string; quantity: string }[];
        notes?: string;
      },
      options?: MutationOptions,
    ) =>
      runtime.command('POST /transfers', options, input, (tx) => {
        runtime.require('inventory.transfer', { warehouseId: input.sourceWarehouseId });
        if (input.sourceWarehouseId === input.destinationWarehouseId)
          throw domainError(
            'TRANSFER_SAME_WAREHOUSE',
            'Source and destination warehouses must differ',
          );
        load(runtime, 'warehouses', input.sourceWarehouseId, 'Warehouse');
        load(runtime, 'warehouses', input.destinationWarehouseId, 'Warehouse');
        if (!input.lines || input.lines.length === 0)
          throw domainError('VALIDATION_FAILED', 'A transfer needs at least one line');
        const id = runtime.store.nextId('transfer');
        const transfer: InventoryTransfer = {
          id,
          organizationId: runtime.store.dataset.organization.id,
          transferNumber: runtime.store.nextBusinessNumber('transfer'),
          sourceWarehouseId: input.sourceWarehouseId,
          destinationWarehouseId: input.destinationWarehouseId,
          status: 'draft',
          requestedBy: tx.actor.id,
          requestedDate: runtime.store.today,
          metadata: metadata(tx, id),
          ...(trimmed(input.notes) ? { notes: trimmed(input.notes) as string } : {}),
        };
        tx.create('transfers', transfer);
        for (const [index, line] of input.lines.entries()) {
          const sku = load(runtime, 'skus', line.skuId, 'SKU');
          if (quantityToMilli(line.quantity) <= 0)
            throw domainError('VALIDATION_FAILED', `Quantity for ${sku.sku} must be positive`);
          tx.create('transferLines', {
            id: runtime.store.nextId('transferLine'),
            organizationId: transfer.organizationId,
            transferId: id,
            lineNumber: index + 1,
            skuId: sku.id,
            requestedQuantity: line.quantity,
            shippedQuantity: '0',
            receivedQuantity: '0',
            damagedQuantity: '0',
          });
        }
        tx.audit('transfer.created', 'inventory_transfer', id, { nextVersion: 1 });
        return getTransfer(runtime, id);
      }),

    ready: (id: string, options?: MutationOptions) =>
      runtime.command('POST /transfers/:id/ready', options, { id }, (tx) => {
        const transfer = load(runtime, 'transfers', id, 'Transfer');
        runtime.require('inventory.transfer', { warehouseId: transfer.sourceWarehouseId });
        if (transfer.status !== 'draft')
          throw transition('Transfer', transfer.status, 'be marked ready');
        open(tx, 'transfers', id, 'Transfer', options);
        for (const line of runtime.indexes.transferLinesByTransfer.get(id)) {
          const position = runtime.projections.inventoryAt(line.skuId, transfer.sourceWarehouseId);
          if (quantityToMilli(position.available) < quantityToMilli(line.requestedQuantity))
            throw domainError(
              'INSUFFICIENT_AVAILABILITY',
              `Only ${position.available} available for ${runtime.store.dataset.skus.get(line.skuId)?.sku ?? line.skuId} at the source warehouse`,
              409,
            );
        }
        transfer.status = 'ready';
        finalize(tx, 'transfers', transfer, 'transfer.ready', 'inventory_transfer', ['status']);
        return getTransfer(runtime, id);
      }),

    ship: (id: string, options?: MutationOptions) =>
      runtime.command('POST /transfers/:id/ship', options, { id }, (tx) => {
        const transfer = load(runtime, 'transfers', id, 'Transfer');
        runtime.require('inventory.transfer', { warehouseId: transfer.sourceWarehouseId });
        if (transfer.status !== 'ready')
          throw transition('Transfer', transfer.status, 'be shipped');
        open(tx, 'transfers', id, 'Transfer', options);
        for (const line of runtime.indexes.transferLinesByTransfer.get(id)) {
          tx.touch('transferLines', line).shippedQuantity = line.requestedQuantity;
          tx.dirty('transferLines', line);
          movement(tx, {
            type: 'transfer_out',
            skuId: line.skuId,
            warehouseId: transfer.sourceWarehouseId,
            onHandDelta: milliToQuantity(-quantityToMilli(line.requestedQuantity)),
            damagedDelta: '0',
            quarantineDelta: '0',
            sourceEntityType: 'transfer',
            sourceEntityId: id,
          });
        }
        transfer.status = 'in_transit';
        transfer.shippedAt = tx.occurredAt;
        finalize(tx, 'transfers', transfer, 'transfer.shipped', 'inventory_transfer', [
          'status',
          'shippedAt',
        ]);
        return getTransfer(runtime, id);
      }),

    receive: (
      id: string,
      input: { received?: Record<string, { quantity: string; damaged?: string }> } = {},
      options?: MutationOptions,
    ) =>
      runtime.command('POST /transfers/:id/receive', options, { id, input }, (tx) => {
        const transfer = load(runtime, 'transfers', id, 'Transfer');
        runtime.require('inventory.transfer', { warehouseId: transfer.destinationWarehouseId });
        if (transfer.status !== 'in_transit' && transfer.status !== 'partially_received')
          throw transition('Transfer', transfer.status, 'be received');
        open(tx, 'transfers', id, 'Transfer', options);
        let complete = true;
        for (const line of runtime.indexes.transferLinesByTransfer.get(id)) {
          const remaining =
            quantityToMilli(line.shippedQuantity) - quantityToMilli(line.receivedQuantity);
          const entry = input.received?.[line.id];
          const quantity = entry ? quantityToMilli(entry.quantity) : remaining;
          const damaged = entry?.damaged ? quantityToMilli(entry.damaged) : 0;
          if (quantity < 0 || quantity > remaining)
            throw domainError(
              'VALIDATION_FAILED',
              `Received quantity for line ${line.lineNumber} must be between 0 and ${milliToQuantity(remaining)}`,
            );
          if (quantity === 0) {
            if (remaining > 0) complete = false;
            continue;
          }
          tx.touch('transferLines', line);
          line.receivedQuantity = milliToQuantity(
            quantityToMilli(line.receivedQuantity) + quantity,
          );
          line.damagedQuantity = milliToQuantity(quantityToMilli(line.damagedQuantity) + damaged);
          tx.dirty('transferLines', line);
          if (quantity < remaining) complete = false;
          movement(tx, {
            type: 'transfer_in',
            skuId: line.skuId,
            warehouseId: transfer.destinationWarehouseId,
            onHandDelta: milliToQuantity(quantity),
            damagedDelta: milliToQuantity(damaged),
            quarantineDelta: '0',
            sourceEntityType: 'transfer',
            sourceEntityId: id,
          });
        }
        transfer.status = complete ? 'received' : 'partially_received';
        if (complete) transfer.receivedAt = tx.occurredAt;
        finalize(
          tx,
          'transfers',
          transfer,
          complete ? 'transfer.received' : 'transfer.partially_received',
          'inventory_transfer',
          ['status'],
        );
        return getTransfer(runtime, id);
      }),

    cancel: (id: string, options?: MutationOptions) =>
      runtime.command('POST /transfers/:id/cancel', options, { id }, (tx) => {
        const transfer = load(runtime, 'transfers', id, 'Transfer');
        runtime.require('inventory.transfer', { warehouseId: transfer.sourceWarehouseId });
        if (transfer.status !== 'draft' && transfer.status !== 'ready')
          throw transition('Transfer', transfer.status, 'be cancelled after shipping');
        open(tx, 'transfers', id, 'Transfer', options);
        transfer.status = 'cancelled';
        finalize(tx, 'transfers', transfer, 'transfer.cancelled', 'inventory_transfer', ['status']);
        return getTransfer(runtime, id);
      }),
  };

  // ---------------------------------------------------------------------------
  // Cycle counts (section 62)

  const completeCount = (tx: Transaction, count: CycleCount): void => {
    for (const line of runtime.indexes.cycleCountLinesByCount.get(count.id)) {
      const variance = line.variance ? quantityToMilli(line.variance) : 0;
      if (variance === 0) continue;
      movement(tx, {
        type: 'cycle_count_adjustment',
        skuId: line.skuId,
        warehouseId: count.warehouseId,
        locationId: line.locationId,
        onHandDelta: milliToQuantity(variance),
        damagedDelta: '0',
        quarantineDelta: '0',
        sourceEntityType: 'cycle_count',
        sourceEntityId: count.id,
        reason: line.note ?? 'Cycle count variance',
      });
    }
    count.status = 'completed';
    count.completedAt = tx.occurredAt;
  };

  const cycleCountHooks: ApprovalDecisionHooks = {
    onApproved: (tx, request) => {
      const count = load(runtime, 'cycleCounts', request.targetId, 'Cycle count');
      tx.touch('cycleCounts', count);
      if (count.status === 'submitted') completeCount(tx, count);
      finalize(tx, 'cycleCounts', count, 'cycle_count.completed', 'cycle_count', ['status']);
    },
    onRejected: (tx, request) => {
      const count = load(runtime, 'cycleCounts', request.targetId, 'Cycle count');
      tx.touch('cycleCounts', count);
      count.status = 'in_progress';
      delete count.approvalRequestId;
      finalize(tx, 'cycleCounts', count, 'cycle_count.rejected', 'cycle_count', ['status']);
    },
    onChangesRequested: (tx, request) => {
      const count = load(runtime, 'cycleCounts', request.targetId, 'Cycle count');
      tx.touch('cycleCounts', count);
      count.status = 'in_progress';
      delete count.approvalRequestId;
      finalize(tx, 'cycleCounts', count, 'cycle_count.changes_requested', 'cycle_count', [
        'status',
      ]);
    },
  };

  const cycleCounts = {
    create: (
      input: {
        warehouseId: string;
        plannedDate: string;
        skuIds: string[];
        assignedToIds?: string[];
      },
      options?: MutationOptions,
    ): Promise<ReturnType<typeof getCycleCount>> =>
      runtime.command('POST /cycle-counts', options, input, (tx) => {
        runtime.require('inventory.cycle_count', { warehouseId: input.warehouseId });
        const warehouse = load(runtime, 'warehouses', input.warehouseId, 'Warehouse');
        if (!input.skuIds || input.skuIds.length === 0)
          throw domainError('VALIDATION_FAILED', 'A cycle count needs at least one SKU');
        const id = runtime.store.nextId('cycleCount');
        const count: CycleCount = {
          id,
          organizationId: warehouse.organizationId,
          cycleCountNumber: runtime.store.nextBusinessNumber('cycleCount'),
          warehouseId: warehouse.id,
          status: 'planned',
          assignedToIds: input.assignedToIds ?? [tx.actor.id],
          plannedDate: input.plannedDate,
          metadata: metadata(tx, id),
        };
        tx.create('cycleCounts', count);
        const locations = runtime.indexes.locationsByWarehouse
          .get(warehouse.id)
          .filter((location) => location.type === 'storage');
        for (const [index, skuId] of input.skuIds.entries()) {
          load(runtime, 'skus', skuId, 'SKU');
          const locationId = locations[index % Math.max(1, locations.length)]?.id ?? '';
          tx.create('cycleCountLines', {
            id: runtime.store.nextId('cycleCountLine'),
            organizationId: warehouse.organizationId,
            cycleCountId: id,
            skuId,
            locationId,
            systemOnHand: '0',
          });
        }
        tx.audit('cycle_count.created', 'cycle_count', id, { nextVersion: 1 });
        return getCycleCount(runtime, id);
      }),

    start: (id: string, options?: MutationOptions) =>
      runtime.command('POST /cycle-counts/:id/start', options, { id }, (tx) => {
        const count = load(runtime, 'cycleCounts', id, 'Cycle count');
        runtime.require('inventory.cycle_count', { warehouseId: count.warehouseId });
        if (count.status !== 'planned') throw transition('Cycle count', count.status, 'be started');
        open(tx, 'cycleCounts', id, 'Cycle count', options);
        for (const line of runtime.indexes.cycleCountLinesByCount.get(id)) {
          tx.touch('cycleCountLines', line).systemOnHand = runtime.projections.inventoryAt(
            line.skuId,
            count.warehouseId,
          ).onHand;
          tx.dirty('cycleCountLines', line);
        }
        count.status = 'in_progress';
        count.startedAt = tx.occurredAt;
        finalize(tx, 'cycleCounts', count, 'cycle_count.started', 'cycle_count', ['status']);
        return getCycleCount(runtime, id);
      }),

    submit: (
      id: string,
      input: { counted: Record<string, { quantity: string; note?: string }> },
      options?: MutationOptions,
    ) =>
      runtime.command('POST /cycle-counts/:id/submit', options, { id, input }, (tx) => {
        const count = load(runtime, 'cycleCounts', id, 'Cycle count');
        runtime.require('inventory.cycle_count', { warehouseId: count.warehouseId });
        if (count.status !== 'in_progress')
          throw transition('Cycle count', count.status, 'be submitted');
        open(tx, 'cycleCounts', id, 'Cycle count', options);
        let impactMinor = 0;
        for (const line of runtime.indexes.cycleCountLinesByCount.get(id)) {
          const entry = input.counted[line.id];
          if (!entry)
            throw domainError('VALIDATION_FAILED', `Counted quantity missing for line ${line.id}`);
          const counted = quantityToMilli(entry.quantity);
          const variance = counted - quantityToMilli(line.systemOnHand);
          tx.touch('cycleCountLines', line);
          line.countedOnHand = entry.quantity;
          line.variance = milliToQuantity(variance);
          if (trimmed(entry.note)) line.note = trimmed(entry.note) as string;
          tx.dirty('cycleCountLines', line);
          const sku = runtime.store.dataset.skus.get(line.skuId);
          impactMinor += Math.abs(Math.round(((sku?.standardCost.minor ?? 0) * variance) / 1000));
        }
        count.status = 'submitted';
        count.submittedAt = tx.occurredAt;
        if (impactMinor >= 250_000) {
          const request = createApprovalRequest(tx, {
            targetType: 'cycle_count',
            targetId: id,
            targetNumber: count.cycleCountNumber,
            evaluation: {
              required: true,
              policyCode: 'cycle_count.v1',
              reasons: [
                `variance impact ${(impactMinor / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} at standard cost`,
              ],
              steps: [
                { sequence: 1, requiredRole: 'warehouse_manager', reason: 'variance above $2,500' },
              ],
            },
            requestedBy: tx.actor.id,
            amount: { currency: 'USD', minor: impactMinor },
          });
          count.approvalRequestId = request.id;
        } else completeCount(tx, count);
        const completed = (count.status as CycleCount['status']) === 'completed';
        finalize(
          tx,
          'cycleCounts',
          count,
          completed ? 'cycle_count.completed' : 'cycle_count.submitted',
          'cycle_count',
          ['status'],
        );
        return getCycleCount(runtime, id);
      }),

    complete: (id: string, options?: MutationOptions) =>
      runtime.command('POST /cycle-counts/:id/complete', options, { id }, (tx) => {
        const count = load(runtime, 'cycleCounts', id, 'Cycle count');
        runtime.require('inventory.cycle_count', { warehouseId: count.warehouseId });
        if (count.status !== 'submitted')
          throw transition('Cycle count', count.status, 'be completed');
        if (count.approvalRequestId) {
          const request = runtime.store.dataset.approvalRequests.get(count.approvalRequestId);
          if (request && request.status !== 'approved')
            throw domainError(
              'APPROVAL_REQUIRED',
              `${count.cycleCountNumber} requires Warehouse Manager approval before completion`,
              409,
            );
        }
        open(tx, 'cycleCounts', id, 'Cycle count', options);
        completeCount(tx, count);
        finalize(tx, 'cycleCounts', count, 'cycle_count.completed', 'cycle_count', ['status']);
        return getCycleCount(runtime, id);
      }),

    cancel: (id: string, options?: MutationOptions) =>
      runtime.command('POST /cycle-counts/:id/cancel', options, { id }, (tx) => {
        const count = load(runtime, 'cycleCounts', id, 'Cycle count');
        runtime.require('inventory.cycle_count', { warehouseId: count.warehouseId });
        if (count.status === 'completed' || count.status === 'cancelled')
          throw transition('Cycle count', count.status, 'be cancelled');
        open(tx, 'cycleCounts', id, 'Cycle count', options);
        count.status = 'cancelled';
        finalize(tx, 'cycleCounts', count, 'cycle_count.cancelled', 'cycle_count', ['status']);
        return getCycleCount(runtime, id);
      }),
  };

  return { adjust, transfers, cycleCounts, hooks: { cycle_count: cycleCountHooks }, movement };
}

export type InventoryCommands = ReturnType<typeof createInventoryCommands>;
export type { CycleCountLine, CycleCountListItem, InventoryTransferLine, TransferListItem };
