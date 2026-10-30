import {
  addDays,
  milliToQuantity,
  quantityToMilli,
  money,
  type CreditMemo,
  type Return,
  type ReturnLine,
  type SalesOrder,
  type Shipment,
  type ShipmentLine,
  type StockMovement,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import {
  getReturn,
  getShipment,
  type ReturnDetail,
  type ShipmentDetail,
} from '../resources/operations';
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
import type { SalesCommands } from './sales';

export interface CreateShipmentInput {
  orderId: string;
  warehouseId?: string;
  carrier?: string;
  service?: string;
  /** Quantities by order line id; defaults to every reservable open quantity. */
  lines?: Record<string, string>;
  estimatedDeliveryDate?: string;
}

export function createFulfillmentCommands(runtime: ApiRuntime, sales: SalesCommands) {
  const shipmentLines = (id: string): ShipmentLine[] =>
    runtime.indexes.shipmentLinesByShipment.get(id);

  const openReservationFor = (lineId: string, warehouseId: string): number => {
    let remaining = 0;
    for (const reservation of runtime.indexes.reservationsByLine.get(lineId)) {
      if (reservation.status !== 'active' || reservation.warehouseId !== warehouseId) continue;
      remaining +=
        quantityToMilli(reservation.quantity) - quantityToMilli(reservation.consumedQuantity);
    }
    // Quantity already assigned to other unshipped shipments consumes reservation availability.
    for (const other of runtime.indexes.shipmentLinesByOrderLine.get(lineId)) {
      const shipment = runtime.store.dataset.shipments.get(other.shipmentId);
      if (!shipment || shipment.shippedAt || shipment.status === 'cancelled') continue;
      remaining -= quantityToMilli(other.quantity);
    }
    return Math.max(0, remaining);
  };

  const shipments = {
    /** Section 63.4 — creates a pending shipment backed by active reservations. */
    create: (input: CreateShipmentInput, options?: MutationOptions): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments', options, input, (tx) => {
        const order = load(runtime, 'salesOrders', input.orderId, 'Order');
        const warehouseId = input.warehouseId ?? order.defaultWarehouseId;
        runtime.require('shipments.create', { warehouseId });
        if (order.status !== 'confirmed') throw transition('Order', order.status, 'be shipped');
        const warehouse = load(runtime, 'warehouses', warehouseId, 'Warehouse');
        if (warehouse.status === 'closed')
          throw domainError('WAREHOUSE_CLOSED', `${warehouse.code} is closed`, 409);
        const lines = runtime.indexes.linesByOrder.get(order.id);
        const planned: { line: (typeof lines)[number]; milli: number }[] = [];
        for (const line of lines) {
          if (line.preferredWarehouseId !== warehouseId && !input.lines?.[line.id]) continue;
          const available = openReservationFor(line.id, warehouseId);
          const requested =
            input.lines?.[line.id] !== undefined
              ? quantityToMilli(input.lines[line.id] as string)
              : available;
          if (requested <= 0) continue;
          if (requested > available)
            throw domainError(
              'INSUFFICIENT_AVAILABILITY',
              `${line.skuCode}: only ${milliToQuantity(available)} reserved unit(s) can be shipped from ${warehouse.code}`,
              409,
              { lineId: line.id, reserved: milliToQuantity(available) },
            );
          planned.push({ line, milli: requested });
        }
        if (planned.length === 0)
          throw domainError('VALIDATION_FAILED', 'No reserved quantity is available to ship');
        const id = runtime.store.nextId('shipment');
        const shipment: Shipment = {
          id,
          organizationId: order.organizationId,
          shipmentNumber: runtime.store.nextBusinessNumber('shipment'),
          orderId: order.id,
          customerId: order.customerId,
          warehouseId,
          carrier: trimmed(input.carrier) ?? 'UPS',
          service: trimmed(input.service) ?? 'Ground',
          status: 'pending',
          estimatedDeliveryDate: input.estimatedDeliveryDate ?? addDays(runtime.store.today, 4),
          metadata: metadata(tx, id),
        };
        tx.create('shipments', shipment);
        for (const entry of planned) {
          const reservations = runtime.indexes.reservationsByLine
            .get(entry.line.id)
            .filter(
              (reservation) =>
                reservation.status === 'active' && reservation.warehouseId === warehouseId,
            );
          tx.create('shipmentLines', {
            id: runtime.store.nextId('shipmentLine'),
            organizationId: order.organizationId,
            shipmentId: id,
            orderLineId: entry.line.id,
            skuId: entry.line.skuId,
            quantity: milliToQuantity(entry.milli),
            reservationIds: reservations.map((reservation) => reservation.id),
            pickedQuantity: '0',
            packedQuantity: '0',
          });
        }
        tx.audit('shipment.created', 'shipment', id, { nextVersion: 1 });
        tx.activityEvent({
          type: 'shipment.created',
          subjectType: 'shipment',
          subjectId: id,
          subjectLabel: shipment.shipmentNumber,
          customerId: order.customerId,
          orderId: order.id,
          summary: `Shipment ${shipment.shipmentNumber} created for ${order.orderNumber} at ${warehouse.code}`,
        });
        return getShipment(runtime, id);
      }),

    startPicking: (id: string, options?: MutationOptions): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments/:id/start-picking', options, { id }, (tx) => {
        const shipment = load(runtime, 'shipments', id, 'Shipment');
        runtime.require('shipments.pick', { warehouseId: shipment.warehouseId });
        if (shipment.status !== 'pending')
          throw transition('Shipment', shipment.status, 'start picking');
        open(tx, 'shipments', id, 'Shipment', options);
        shipment.status = 'picking';
        finalize(tx, 'shipments', shipment, 'shipment.picking', 'shipment', ['status']);
        return getShipment(runtime, id);
      }),

    pack: (
      id: string,
      input: { picked?: Record<string, string> } = {},
      options?: MutationOptions,
    ): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments/:id/pack', options, { id, input }, (tx) => {
        const shipment = load(runtime, 'shipments', id, 'Shipment');
        runtime.require('shipments.pack', { warehouseId: shipment.warehouseId });
        if (shipment.status !== 'picking')
          throw transition('Shipment', shipment.status, 'be packed');
        open(tx, 'shipments', id, 'Shipment', options);
        for (const line of shipmentLines(id)) {
          const picked = input.picked?.[line.id] ?? line.quantity;
          if (quantityToMilli(picked) !== quantityToMilli(line.quantity))
            throw domainError(
              'VALIDATION_FAILED',
              `All shipment lines must be fully picked before packing (${line.skuId})`,
            );
          tx.touch('shipmentLines', line);
          line.pickedQuantity = picked;
          line.packedQuantity = picked;
          tx.dirty('shipmentLines', line);
        }
        shipment.status = 'packed';
        finalize(tx, 'shipments', shipment, 'shipment.packed', 'shipment', ['status']);
        return getShipment(runtime, id);
      }),

    ready: (
      id: string,
      input: { trackingNumber?: string } = {},
      options?: MutationOptions,
    ): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments/:id/ready', options, { id, input }, (tx) => {
        const shipment = load(runtime, 'shipments', id, 'Shipment');
        runtime.require('shipments.pack', { warehouseId: shipment.warehouseId });
        if (shipment.status !== 'packed')
          throw transition('Shipment', shipment.status, 'be marked ready');
        open(tx, 'shipments', id, 'Shipment', options);
        shipment.status = 'ready_to_ship';
        if (trimmed(input.trackingNumber))
          shipment.trackingNumber = trimmed(input.trackingNumber) as string;
        finalize(tx, 'shipments', shipment, 'shipment.ready', 'shipment', ['status']);
        return getShipment(runtime, id);
      }),

    /** Section 63.4 "Ship" — consumes reservations, moves stock and advances the order. */
    ship: (
      id: string,
      input: { trackingNumber?: string } = {},
      options?: MutationOptions,
    ): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments/:id/ship', options, { id, input }, (tx) => {
        const shipment = load(runtime, 'shipments', id, 'Shipment');
        runtime.require('shipments.ship', { warehouseId: shipment.warehouseId });
        if (shipment.status !== 'ready_to_ship')
          throw transition('Shipment', shipment.status, 'be shipped');
        const order = load(runtime, 'salesOrders', shipment.orderId, 'Order');
        if (order.status === 'on_hold')
          throw domainError(
            'ORDER_ON_HOLD',
            `Order ${order.orderNumber} is on hold; release it before shipping`,
            409,
          );
        open(tx, 'shipments', id, 'Shipment', options);
        tx.touch('salesOrders', order);
        for (const line of shipmentLines(id)) {
          const orderLine = load(runtime, 'salesOrderLines', line.orderLineId, 'Order line');
          let remaining = quantityToMilli(line.quantity);
          const reservations = runtime.indexes.reservationsByLine
            .get(orderLine.id)
            .filter(
              (reservation) =>
                reservation.status === 'active' && reservation.warehouseId === shipment.warehouseId,
            );
          for (const reservation of reservations) {
            const available =
              quantityToMilli(reservation.quantity) - quantityToMilli(reservation.consumedQuantity);
            const consume = Math.min(available, remaining);
            if (consume <= 0) continue;
            tx.touch('reservations', reservation);
            reservation.consumedQuantity = milliToQuantity(
              quantityToMilli(reservation.consumedQuantity) + consume,
            );
            if (
              quantityToMilli(reservation.consumedQuantity) >= quantityToMilli(reservation.quantity)
            )
              reservation.status = 'consumed';
            tx.dirty('reservations', reservation);
            remaining -= consume;
          }
          if (remaining > 0)
            throw domainError(
              'RESERVATION_CONSUMED',
              `Reservation for ${orderLine.skuCode} no longer covers the shipment quantity`,
              409,
            );
          const ordered =
            quantityToMilli(orderLine.orderedQuantity) -
            quantityToMilli(orderLine.cancelledQuantity);
          const fulfilled =
            quantityToMilli(orderLine.fulfilledQuantity) + quantityToMilli(line.quantity);
          if (fulfilled > ordered)
            throw domainError(
              'VALIDATION_FAILED',
              `Shipping ${line.quantity} would exceed the ordered quantity on ${orderLine.skuCode}`,
            );
          tx.touch('salesOrderLines', orderLine).fulfilledQuantity = milliToQuantity(fulfilled);
          tx.dirty('salesOrderLines', orderLine);
          const movement: StockMovement = {
            id: runtime.store.nextId('stockMovement'),
            organizationId: shipment.organizationId,
            type: 'shipment',
            skuId: line.skuId,
            warehouseId: shipment.warehouseId,
            onHandDelta: milliToQuantity(-quantityToMilli(line.quantity)),
            damagedDelta: '0',
            quarantineDelta: '0',
            sourceEntityType: 'shipment',
            sourceEntityId: id,
            occurredAt: tx.occurredAt,
            actorId: tx.actor.id,
          };
          tx.create('stockMovements', movement);
        }
        shipment.status = 'shipped';
        shipment.shippedAt = tx.occurredAt;
        if (trimmed(input.trackingNumber))
          shipment.trackingNumber = trimmed(input.trackingNumber) as string;
        if (!shipment.trackingNumber)
          shipment.trackingNumber = `1Z${id.slice(-6).toUpperCase()}${Date.parse(tx.occurredAt).toString().slice(-8)}`;
        finalize(tx, 'shipments', shipment, 'shipment.shipped', 'shipment', [
          'status',
          'shippedAt',
        ]);
        runtime.projections.recalculateOrder(order);
        sales.closeIfEligible(tx, order);
        finalize(tx, 'salesOrders', order, 'order.fulfillment_updated', 'sales_order', [
          'fulfillmentStatus',
        ]);
        tx.activityEvent({
          type: 'shipment.shipped',
          subjectType: 'shipment',
          subjectId: id,
          subjectLabel: shipment.shipmentNumber,
          customerId: order.customerId,
          orderId: order.id,
          summary: `Shipment ${shipment.shipmentNumber} shipped via ${shipment.carrier} ${shipment.service}`,
        });
        tx.notify(
          order.ownerId,
          'success',
          `${order.orderNumber} shipped`,
          `${shipment.shipmentNumber} left ${runtime.store.dataset.warehouses.get(shipment.warehouseId)?.code ?? shipment.warehouseId}.`,
          { type: 'shipment', id },
        );
        return getShipment(runtime, id);
      }),

    markInTransit: (id: string, options?: MutationOptions): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments/:id/in-transit', options, { id }, (tx) => {
        const shipment = load(runtime, 'shipments', id, 'Shipment');
        runtime.require('shipments.view', { warehouseId: shipment.warehouseId });
        if (shipment.status !== 'shipped')
          throw transition('Shipment', shipment.status, 'be marked in transit');
        open(tx, 'shipments', id, 'Shipment', options);
        shipment.status = 'in_transit';
        finalize(tx, 'shipments', shipment, 'shipment.in_transit', 'shipment', ['status']);
        return getShipment(runtime, id);
      }),

    deliver: (id: string, options?: MutationOptions): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments/:id/deliver', options, { id }, (tx) => {
        const shipment = load(runtime, 'shipments', id, 'Shipment');
        runtime.require('shipments.mark_delivered', { warehouseId: shipment.warehouseId });
        if (
          shipment.status !== 'shipped' &&
          shipment.status !== 'in_transit' &&
          shipment.status !== 'exception'
        )
          throw transition('Shipment', shipment.status, 'be delivered');
        open(tx, 'shipments', id, 'Shipment', options);
        shipment.status = 'delivered';
        shipment.deliveredAt = tx.occurredAt;
        delete shipment.exceptionCode;
        delete shipment.exceptionMessage;
        finalize(tx, 'shipments', shipment, 'shipment.delivered', 'shipment', [
          'status',
          'deliveredAt',
        ]);
        const order = runtime.store.dataset.salesOrders.get(shipment.orderId);
        tx.activityEvent({
          type: 'shipment.delivered',
          subjectType: 'shipment',
          subjectId: id,
          subjectLabel: shipment.shipmentNumber,
          customerId: shipment.customerId,
          orderId: shipment.orderId,
          summary: `Shipment ${shipment.shipmentNumber} delivered${order ? ` (${order.orderNumber})` : ''}`,
        });
        return getShipment(runtime, id);
      }),

    exception: (
      id: string,
      input: { code: string; message: string },
      options?: MutationOptions,
    ): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments/:id/exception', options, { id, input }, (tx) => {
        new Validator()
          .required('code', input.code)
          .required('message', input.message)
          .throwIfAny();
        const shipment = load(runtime, 'shipments', id, 'Shipment');
        runtime.require('shipments.view', { warehouseId: shipment.warehouseId });
        if (shipment.status !== 'shipped' && shipment.status !== 'in_transit')
          throw transition('Shipment', shipment.status, 'record an exception');
        open(tx, 'shipments', id, 'Shipment', options);
        shipment.status = 'exception';
        shipment.exceptionCode = input.code.trim().toUpperCase();
        shipment.exceptionMessage = input.message.trim();
        finalize(tx, 'shipments', shipment, 'shipment.exception', 'shipment', [
          'status',
          'exceptionCode',
        ]);
        const order = runtime.store.dataset.salesOrders.get(shipment.orderId);
        tx.activityEvent({
          type: 'shipment.exception',
          subjectType: 'shipment',
          subjectId: id,
          subjectLabel: shipment.shipmentNumber,
          customerId: shipment.customerId,
          orderId: shipment.orderId,
          summary: `Shipment ${shipment.shipmentNumber}: ${shipment.exceptionMessage}`,
        });
        if (order)
          tx.notify(
            order.ownerId,
            'warning',
            `${shipment.shipmentNumber} reported an exception`,
            shipment.exceptionMessage as string,
            { type: 'shipment', id },
          );
        return getShipment(runtime, id);
      }),

    cancel: (id: string, options?: MutationOptions): Promise<ShipmentDetail> =>
      runtime.command('POST /shipments/:id/cancel', options, { id }, (tx) => {
        const shipment = load(runtime, 'shipments', id, 'Shipment');
        runtime.require('shipments.create', { warehouseId: shipment.warehouseId });
        if (shipment.shippedAt || shipment.status === 'cancelled')
          throw transition('Shipment', shipment.status, 'be cancelled');
        open(tx, 'shipments', id, 'Shipment', options);
        shipment.status = 'cancelled';
        finalize(tx, 'shipments', shipment, 'shipment.cancelled', 'shipment', ['status']);
        return getShipment(runtime, id);
      }),
  };

  // ---------------------------------------------------------------------------
  // Returns (section 64)

  const returns = {
    create: (
      input: {
        orderId: string;
        lines: { orderLineId: string; quantity: string; reason: ReturnLine['reason'] }[];
        receivingWarehouseId?: string;
        notes?: string;
      },
      options?: MutationOptions,
    ): Promise<ReturnDetail> =>
      runtime.command('POST /returns', options, input, (tx) => {
        const order = load(runtime, 'salesOrders', input.orderId, 'Order');
        runtime.require('returns.create', { customerId: order.customerId, ownerId: order.ownerId });
        const validator = new Validator();
        if (!input.lines || input.lines.length === 0)
          validator.errors.push({
            field: 'lines',
            code: 'REQUIRED',
            message: 'At least one return line is required',
          });
        validator.throwIfAny();
        const id = runtime.store.nextId('return');
        const record: Return = {
          id,
          organizationId: order.organizationId,
          returnNumber: runtime.store.nextBusinessNumber('return'),
          orderId: order.id,
          customerId: order.customerId,
          status: 'requested',
          requestedAt: tx.occurredAt,
          receivingWarehouseId: input.receivingWarehouseId ?? order.defaultWarehouseId,
          metadata: metadata(tx, id),
          ...(trimmed(input.notes) ? { notes: trimmed(input.notes) as string } : {}),
        };
        tx.create('returns', record);
        for (const lineInput of input.lines) {
          const orderLine = load(runtime, 'salesOrderLines', lineInput.orderLineId, 'Order line');
          if (orderLine.orderId !== order.id)
            throw domainError(
              'VALIDATION_FAILED',
              `Line ${lineInput.orderLineId} does not belong to ${order.orderNumber}`,
            );
          let accepted = 0;
          for (const existing of runtime.indexes.returnsByOrder.get(order.id)) {
            for (const existingLine of runtime.indexes.returnLinesByReturn.get(existing.id))
              if (existingLine.orderLineId === orderLine.id)
                accepted += quantityToMilli(existingLine.acceptedQuantity);
          }
          const returnable = quantityToMilli(orderLine.fulfilledQuantity) - accepted;
          if (
            quantityToMilli(lineInput.quantity) <= 0 ||
            quantityToMilli(lineInput.quantity) > returnable
          )
            throw domainError(
              'VALIDATION_FAILED',
              `${orderLine.skuCode}: at most ${milliToQuantity(returnable)} unit(s) can be returned`,
            );
          const line: ReturnLine = {
            id: runtime.store.nextId('returnLine'),
            organizationId: order.organizationId,
            returnId: id,
            orderLineId: orderLine.id,
            skuId: orderLine.skuId,
            requestedQuantity: lineInput.quantity,
            receivedQuantity: '0',
            acceptedQuantity: '0',
            rejectedQuantity: '0',
            reason: lineInput.reason,
            unitCreditAmount: orderLine.unitPrice,
          };
          tx.create('returnLines', line);
        }
        tx.audit('return.created', 'return', id, { nextVersion: 1 });
        tx.activityEvent({
          type: 'return.requested',
          subjectType: 'return',
          subjectId: id,
          subjectLabel: record.returnNumber,
          customerId: order.customerId,
          orderId: order.id,
          summary: `Return ${record.returnNumber} requested against ${order.orderNumber}`,
        });
        return getReturn(runtime, id);
      }),

    authorize: (id: string, options?: MutationOptions): Promise<ReturnDetail> =>
      runtime.command('POST /returns/:id/authorize', options, { id }, (tx) => {
        runtime.require('returns.authorize');
        const record = open(tx, 'returns', id, 'Return', options);
        if (record.status !== 'requested')
          throw transition('Return', record.status, 'be authorized');
        record.status = 'authorized';
        record.authorizedAt = tx.occurredAt;
        finalize(tx, 'returns', record, 'return.authorized', 'return', ['status']);
        return getReturn(runtime, id);
      }),

    receive: (
      id: string,
      input: { received: Record<string, string> },
      options?: MutationOptions,
    ): Promise<ReturnDetail> =>
      runtime.command('POST /returns/:id/receive', options, { id, input }, (tx) => {
        const record = load(runtime, 'returns', id, 'Return');
        runtime.require('returns.receive', { warehouseId: record.receivingWarehouseId });
        if (record.status !== 'authorized' && record.status !== 'in_transit')
          throw transition('Return', record.status, 'be received');
        open(tx, 'returns', id, 'Return', options);
        for (const line of runtime.indexes.returnLinesByReturn.get(id)) {
          const received = input.received[line.id] ?? line.requestedQuantity;
          if (quantityToMilli(received) > quantityToMilli(line.requestedQuantity))
            throw domainError(
              'VALIDATION_FAILED',
              'Received quantity cannot exceed the requested quantity',
            );
          tx.touch('returnLines', line).receivedQuantity = received;
          tx.dirty('returnLines', line);
        }
        record.status = 'received';
        record.receivedAt = tx.occurredAt;
        finalize(tx, 'returns', record, 'return.received', 'return', ['status']);
        return getReturn(runtime, id);
      }),

    /** Section 64.4 — disposition drives inventory effects. */
    inspect: (
      id: string,
      input: {
        lines: Record<
          string,
          { accepted: string; disposition: NonNullable<ReturnLine['disposition']> }
        >;
      },
      options?: MutationOptions,
    ): Promise<ReturnDetail> =>
      runtime.command('POST /returns/:id/inspect', options, { id, input }, (tx) => {
        const record = load(runtime, 'returns', id, 'Return');
        runtime.require('returns.inspect', { warehouseId: record.receivingWarehouseId });
        if (record.status !== 'received') throw transition('Return', record.status, 'be inspected');
        open(tx, 'returns', id, 'Return', options);
        for (const line of runtime.indexes.returnLinesByReturn.get(id)) {
          const decision = input.lines[line.id];
          if (!decision)
            throw domainError('VALIDATION_FAILED', `Inspection result missing for line ${line.id}`);
          const acceptedMilli = quantityToMilli(decision.accepted);
          const receivedMilli = quantityToMilli(line.receivedQuantity);
          if (acceptedMilli < 0 || acceptedMilli > receivedMilli)
            throw domainError(
              'VALIDATION_FAILED',
              'Accepted quantity must be between 0 and the received quantity',
            );
          tx.touch('returnLines', line);
          line.acceptedQuantity = decision.accepted;
          line.rejectedQuantity = milliToQuantity(receivedMilli - acceptedMilli);
          if (decision.disposition) line.disposition = decision.disposition;
          tx.dirty('returnLines', line);
          const orderLine = runtime.store.dataset.salesOrderLines.get(line.orderLineId);
          if (orderLine && acceptedMilli > 0) {
            tx.touch('salesOrderLines', orderLine).returnedQuantity = milliToQuantity(
              quantityToMilli(orderLine.returnedQuantity) + acceptedMilli,
            );
            tx.dirty('salesOrderLines', orderLine);
          }
          if (acceptedMilli > 0 && decision.disposition !== 'scrap') {
            const quarantine =
              decision.disposition === 'quarantine' ||
              decision.disposition === 'return_to_supplier';
            tx.create('stockMovements', {
              id: runtime.store.nextId('stockMovement'),
              organizationId: record.organizationId,
              type: 'customer_return',
              skuId: line.skuId,
              warehouseId: record.receivingWarehouseId,
              onHandDelta: milliToQuantity(acceptedMilli),
              damagedDelta: '0',
              quarantineDelta: quarantine ? milliToQuantity(acceptedMilli) : '0',
              sourceEntityType: 'return',
              sourceEntityId: id,
              occurredAt: tx.occurredAt,
              actorId: tx.actor.id,
              ...(decision.disposition ? { reason: `Disposition: ${decision.disposition}` } : {}),
            });
          }
        }
        record.status = 'inspected';
        record.inspectedAt = tx.occurredAt;
        finalize(tx, 'returns', record, 'return.inspected', 'return', ['status']);
        const order = runtime.store.dataset.salesOrders.get(record.orderId);
        if (order) {
          tx.touch('salesOrders', order);
          runtime.projections.recalculateOrder(order);
          tx.dirty('salesOrders', order);
        }
        return getReturn(runtime, id);
      }),

    /** Section 64.4 — completion issues the credit memo and applies it when the invoice is unpaid. */
    complete: (id: string, options?: MutationOptions): Promise<ReturnDetail> =>
      runtime.command('POST /returns/:id/complete', options, { id }, (tx) => {
        runtime.require('returns.inspect');
        const record = open(tx, 'returns', id, 'Return', options);
        if (record.status !== 'inspected')
          throw transition('Return', record.status, 'be completed');
        const lines = runtime.indexes.returnLinesByReturn.get(id);
        let credit = 0;
        let tax = 0;
        for (const line of lines) {
          const accepted = quantityToMilli(line.acceptedQuantity);
          if (accepted <= 0 || !line.unitCreditAmount) continue;
          const orderLine = runtime.store.dataset.salesOrderLines.get(line.orderLineId);
          const net = Math.round((line.unitCreditAmount.minor * accepted) / 1000);
          credit += net;
          tax += Math.round((net * (orderLine?.taxRateBps ?? 0)) / 10_000);
        }
        if (credit > 0) {
          const memoId = runtime.store.nextId('creditMemo');
          const invoice = runtime.indexes.invoicesByOrder
            .get(record.orderId)
            .find((candidate) => candidate.lifecycle === 'open' && candidate.outstanding.minor > 0);
          const total = credit + tax;
          const applied = invoice ? Math.min(invoice.outstanding.minor, total) : 0;
          const currency = load(runtime, 'salesOrders', record.orderId, 'Order').currency;
          const cash = (minor: number) => money(minor, currency);
          const memo: CreditMemo = {
            id: memoId,
            organizationId: record.organizationId,
            creditMemoNumber: runtime.store.nextBusinessNumber('creditMemo'),
            customerId: record.customerId,
            sourceReturnId: id,
            reason: 'return',
            issueDate: runtime.store.today,
            currency,
            lifecycle: applied >= total ? 'fully_applied' : 'open',
            subtotal: cash(credit),
            taxTotal: cash(tax),
            total: cash(total),
            appliedAmount: cash(applied),
            unappliedAmount: cash(total - applied),
            metadata: metadata(tx, memoId),
            ...(invoice ? { sourceInvoiceId: invoice.id } : {}),
          };
          tx.create('creditMemos', memo);
          tx.create('creditMemoLines', {
            id: runtime.store.nextId('creditMemoLine'),
            organizationId: record.organizationId,
            creditMemoId: memoId,
            description: `Return credit for ${record.returnNumber}`,
            amount: cash(credit),
            taxAmount: cash(tax),
          });
          if (invoice && applied > 0) {
            tx.create('creditMemoApplications', {
              id: runtime.store.nextId('creditMemoApplication'),
              organizationId: record.organizationId,
              creditMemoId: memoId,
              invoiceId: invoice.id,
              amount: cash(applied),
              status: 'active',
              createdAt: tx.occurredAt,
            });
            tx.touch('invoices', invoice);
            runtime.projections.recalculateInvoice(invoice);
            finalize(tx, 'invoices', invoice, 'invoice.credit_applied', 'invoice', [
              'paidAmount',
              'outstanding',
            ]);
          }
          record.creditMemoId = memoId;
          tx.audit('credit_memo.created', 'credit_memo', memoId, { nextVersion: 1 });
          tx.activityEvent({
            type: 'credit_memo.issued',
            subjectType: 'credit_memo',
            subjectId: memoId,
            subjectLabel: memo.creditMemoNumber,
            customerId: record.customerId,
            orderId: record.orderId,
            summary: `Credit memo ${memo.creditMemoNumber} issued for ${dollars(total, currency)} (${record.returnNumber})`,
          });
        }
        record.status = 'completed';
        record.completedAt = tx.occurredAt;
        finalize(tx, 'returns', record, 'return.completed', 'return', ['status', 'creditMemoId']);
        const order = runtime.store.dataset.salesOrders.get(record.orderId);
        if (order) {
          tx.touch('salesOrders', order);
          runtime.projections.recalculateOrder(order);
          sales.closeIfEligible(tx, order);
          tx.dirty('salesOrders', order);
        }
        return getReturn(runtime, id);
      }),

    reject: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<ReturnDetail> =>
      runtime.command('POST /returns/:id/reject', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        runtime.require('returns.authorize');
        const record = open(tx, 'returns', id, 'Return', options);
        if (
          record.status === 'completed' ||
          record.status === 'rejected' ||
          record.status === 'cancelled'
        )
          throw transition('Return', record.status, 'be rejected');
        record.status = 'rejected';
        record.notes = `${record.notes ? `${record.notes}\n` : ''}Rejected: ${input.reason.trim()}`;
        finalize(tx, 'returns', record, 'return.rejected', 'return', ['status']);
        return getReturn(runtime, id);
      }),
  };

  return { shipments, returns };
}

export type FulfillmentCommands = ReturnType<typeof createFulfillmentCommands>;
export type { SalesOrder, Transaction };
