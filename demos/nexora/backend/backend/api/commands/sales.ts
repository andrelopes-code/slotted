import {
  NexoraApiError,
  addBusinessDays,
  addDays,
  compareDates,
  evaluateOrderApproval,
  evaluateQuoteApproval,
  milliToQuantity,
  quantityToMilli,
  FX_RATES_TO_USD,
  addMoney,
  money,
  usdMinor,
  type ApprovalRequest,
  type Customer,
  type InventoryReservation,
  type Money,
  type OrderRiskFlag,
  type Quote,
  type QuoteLine,
  type SalesOrder,
  type SalesOrderLine,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import type { SalesReadModels } from '../resources/sales';
import { getOrder, getQuote, type OrderDetail, type QuoteDetail } from '../resources/sales';
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
import { priceLines, type LineInput, type PricedLineInput } from './pricing';

export interface QuoteInput {
  customerId: string;
  contactId?: string;
  lines: LineInput[];
  freightMinor?: number;
  expirationDate?: string;
  notes?: string;
  terms?: string;
}

export interface OrderInput {
  customerId: string;
  contactId?: string;
  lines: LineInput[];
  freightMinor?: number;
  customerPoNumber?: string;
  requestedDeliveryDate?: string;
  defaultWarehouseId?: string;
  shippingAddressId?: string;
  notes?: string;
}

function shippingRegion(
  runtime: ApiRuntime,
  customer: Customer,
  addressId?: string,
): {
  region: string;
  snapshot: SalesOrder['shippingAddress'];
  billing: SalesOrder['billingAddress'];
} {
  const { dataset } = runtime.store;
  const shipping =
    (addressId ? dataset.addresses.get(addressId) : undefined) ??
    (customer.defaultShippingAddressId
      ? dataset.addresses.get(customer.defaultShippingAddressId)
      : undefined);
  const billing = customer.billingAddressId
    ? dataset.addresses.get(customer.billingAddressId)
    : shipping;
  const snap = (address: typeof shipping, name: string) =>
    address
      ? {
          name,
          line1: address.line1,
          city: address.city,
          region: address.region,
          postalCode: address.postalCode,
          countryCode: address.countryCode,
          ...(address.line2 ? { line2: address.line2 } : {}),
        }
      : {
          name,
          line1: 'Address on file',
          city: 'Chicago',
          region: 'IL',
          postalCode: '60609',
          countryCode: 'US',
        };
  return {
    region: shipping?.region ?? billing?.region ?? 'IL',
    snapshot: snap(shipping, customer.displayName),
    billing: snap(billing, customer.legalName),
  };
}

export function createSalesCommands(runtime: ApiRuntime, models: SalesReadModels) {
  const quoteLinesFrom = (
    tx: Transaction,
    quoteId: string,
    lines: PricedLineInput[],
  ): QuoteLine[] =>
    lines.map((line, index) => ({
      id: runtime.store.nextId('quoteLine'),
      organizationId: runtime.store.dataset.organization.id,
      quoteId,
      lineNumber: index + 1,
      skuId: line.sku.id,
      skuCode: line.sku.sku,
      description: line.sku.name,
      unitOfMeasure: line.sku.unitOfMeasure,
      quantity: line.priced.quantity,
      listUnitPrice: line.priced.listUnitPrice,
      unitPrice: line.priced.unitPrice,
      discountBps: line.priced.discountBps,
      taxRateBps: line.priced.taxRateBps,
      unitCost: line.priced.unitCost,
      netAmount: line.priced.netAmount,
      taxAmount: line.priced.taxAmount,
      totalAmount: line.priced.totalAmount,
    }));

  const orderLinesFrom = (
    orderId: string,
    lines: PricedLineInput[],
    warehouseId: string,
    orderDate: string,
  ): SalesOrderLine[] =>
    lines.map((line, index) => ({
      id: runtime.store.nextId('salesOrderLine'),
      organizationId: runtime.store.dataset.organization.id,
      orderId,
      lineNumber: index + 1,
      skuId: line.sku.id,
      skuCode: line.sku.sku,
      description: line.sku.name,
      unitOfMeasure: line.sku.unitOfMeasure,
      orderedQuantity: line.priced.quantity,
      cancelledQuantity: '0',
      reservedQuantity: '0',
      fulfilledQuantity: '0',
      returnedQuantity: '0',
      invoicedQuantity: '0',
      listUnitPrice: line.priced.listUnitPrice,
      unitPrice: line.priced.unitPrice,
      discountBps: line.priced.discountBps,
      taxRateBps: line.priced.taxRateBps,
      unitCost: line.priced.unitCost,
      netAmount: line.priced.netAmount,
      taxAmount: line.priced.taxAmount,
      totalAmount: line.priced.totalAmount,
      preferredWarehouseId: line.preferredWarehouseId ?? warehouseId,
      promisedDate:
        line.promisedDate ??
        addBusinessDays(orderDate, Math.max(2, Math.min(15, line.sku.leadTimeDays))),
    }));

  const applyTotals = (
    target: SalesOrder | Quote,
    totals: ReturnType<ReturnType<typeof priceLines>['totals']>,
  ): void => {
    target.subtotal = totals.subtotal;
    target.discountTotal = totals.discountTotal;
    target.taxTotal = totals.taxTotal;
    target.freight = totals.freight;
    target.total = totals.total;
    target.costTotal = totals.costTotal;
    target.grossMargin = totals.grossMargin;
    target.grossMarginBps = totals.grossMarginBps;
  };

  const maxDiscount = (lines: { discountBps: number }[]): number =>
    lines.reduce((max, line) => Math.max(max, line.discountBps), 0);

  // ---------------------------------------------------------------------------
  // Reservations (section 60.4–60.6)

  const reserveLine = (
    tx: Transaction,
    order: SalesOrder,
    line: SalesOrderLine,
    requestedMilli: number,
    expectedAvailable?: string,
  ): InventoryReservation | undefined => {
    const position = runtime.projections.inventoryAt(line.skuId, line.preferredWarehouseId);
    const availableMilli = quantityToMilli(position.available);
    if (expectedAvailable !== undefined && quantityToMilli(expectedAvailable) !== availableMilli) {
      throw new NexoraApiError(
        'INVENTORY_CHANGED',
        `Availability for ${line.skuCode} changed to ${position.available} since it was read`,
        {
          details: {
            skuId: line.skuId,
            warehouseId: line.preferredWarehouseId,
            available: position.available,
          },
        },
      );
    }
    const quantity = Math.min(requestedMilli, availableMilli);
    if (quantity <= 0) return undefined;
    const reservation: InventoryReservation = {
      id: runtime.store.nextId('inventoryReservation'),
      organizationId: order.organizationId,
      orderId: order.id,
      orderLineId: line.id,
      skuId: line.skuId,
      warehouseId: line.preferredWarehouseId,
      quantity: milliToQuantity(quantity),
      consumedQuantity: '0',
      status: 'active',
      createdAt: tx.occurredAt,
    };
    tx.create('reservations', reservation);
    return reservation;
  };

  const openMilli = (line: SalesOrderLine): number =>
    quantityToMilli(line.orderedQuantity) -
    quantityToMilli(line.cancelledQuantity) -
    quantityToMilli(line.fulfilledQuantity);

  const allocateOrder = (
    tx: Transaction,
    order: SalesOrder,
    lineIds?: string[],
    expectedAvailable?: Record<string, string>,
  ): { reserved: number; shortages: string[] } => {
    let reserved = 0;
    const shortages: string[] = [];
    for (const line of runtime.indexes.linesByOrder.get(order.id)) {
      if (lineIds && !lineIds.includes(line.id)) continue;
      runtime.projections.recalculateOrder(order);
      const needed = openMilli(line) - quantityToMilli(line.reservedQuantity);
      if (needed <= 0) continue;
      const sku = runtime.store.dataset.skus.get(line.skuId);
      if (sku?.status !== 'active') continue;
      const warehouse = runtime.store.dataset.warehouses.get(line.preferredWarehouseId);
      if (warehouse?.status === 'closed') continue;
      const reservation = reserveLine(tx, order, line, needed, expectedAvailable?.[line.id]);
      if (reservation) reserved += quantityToMilli(reservation.quantity);
      if (!reservation || quantityToMilli(reservation.quantity) < needed) shortages.push(line.id);
    }
    runtime.projections.recalculateOrder(order);
    return { reserved, shortages };
  };

  const releaseReservations = (tx: Transaction, order: SalesOrder, onlyUnconsumed = true): void => {
    for (const reservation of runtime.indexes.reservationsByOrder.get(order.id)) {
      if (reservation.status !== 'active') continue;
      tx.touch('reservations', reservation);
      const consumed = quantityToMilli(reservation.consumedQuantity);
      if (consumed > 0 && onlyUnconsumed) {
        reservation.quantity = reservation.consumedQuantity;
        reservation.status = 'consumed';
      } else reservation.status = 'released';
      tx.dirty('reservations', reservation);
    }
  };

  // ---------------------------------------------------------------------------
  // Order evaluation (sections 59.4 and 59.5)

  const evaluateOrder = (order: SalesOrder, lines: SalesOrderLine[], customer: Customer) => {
    const summary = runtime.projections.customerSummary(customer.id);
    const exposureAfter = summary.creditExposure.minor + order.total.minor;
    const creditLimitExceeded =
      customer.creditLimit.minor > 0 && exposureAfter > customer.creditLimit.minor;
    const evaluation = evaluateOrderApproval({
      approvalValueUsdMinor: usdMinor(addMoney(order.subtotal, order.freight), order.fxRateToUsd),
      grossMarginBps: order.grossMarginBps,
      maxLineDiscountBps: maxDiscount(lines),
      creditLimitExceeded,
      customerOnHold: customer.status === 'on_hold',
    });
    const flags = new Set<OrderRiskFlag>();
    if (creditLimitExceeded) flags.add('credit_limit_exceeded');
    if (order.grossMarginBps < 2_200) flags.add('low_margin');
    if (maxDiscount(lines) >= 1_200) flags.add('high_discount');
    if (customer.status === 'on_hold') flags.add('customer_on_hold');
    if (summary.overdueReceivables.minor > 0) flags.add('overdue_receivables');
    return { evaluation, flags: [...flags] };
  };

  const confirmOrder = (tx: Transaction, order: SalesOrder, customer: Customer): void => {
    order.status = 'confirmed';
    order.confirmedAt = tx.occurredAt;
    if (customer.status === 'prospect') {
      tx.emit('customer.status_changed', { customerId: customer.id, previousStatus: 'prospect' });
      tx.touch('customers', customer).status = 'active';
      tx.dirty('customers');
    }
    tx.emit('order.confirmed', { orderId: order.id, customerId: order.customerId });
    const result = allocateOrder(tx, order);
    tx.activityEvent({
      type: 'order.confirmed',
      subjectType: 'sales_order',
      subjectId: order.id,
      subjectLabel: order.orderNumber,
      customerId: order.customerId,
      orderId: order.id,
      summary: `Order ${order.orderNumber} confirmed (${dollars(order.total)})${result.shortages.length > 0 ? ` — ${result.shortages.length} line(s) short` : ''}`,
    });
    if (result.shortages.length > 0)
      tx.notify(
        order.ownerId,
        'warning',
        `${order.orderNumber} has an inventory shortage`,
        `${result.shortages.length} line(s) could not be fully allocated.`,
        { type: 'sales_order', id: order.id },
      );
  };

  const submitOrder = (tx: Transaction, order: SalesOrder): void => {
    const customer = load(runtime, 'customers', order.customerId, 'Customer');
    const lines = runtime.indexes.linesByOrder.get(order.id);
    if (lines.length === 0)
      throw domainError('VALIDATION_FAILED', 'An order needs at least one line before submission');
    if (customer.status === 'inactive' || customer.status === 'closed')
      throw domainError(
        'CUSTOMER_INACTIVE',
        `${customer.displayName} is ${customer.status} and cannot receive orders`,
        409,
      );
    const { evaluation, flags } = evaluateOrder(order, lines, customer);
    order.riskFlags = flags;
    if (evaluation.required) {
      const request = createApprovalRequest(tx, {
        targetType: 'sales_order',
        targetId: order.id,
        targetNumber: order.orderNumber,
        evaluation,
        requestedBy: tx.actor.id,
        amount: addMoney(order.subtotal, order.freight),
      });
      order.status = 'pending_approval';
      order.approvalStatus = 'pending';
      order.approvalRequestId = request.id;
      tx.activityEvent({
        type: 'order.submitted',
        subjectType: 'sales_order',
        subjectId: order.id,
        subjectLabel: order.orderNumber,
        customerId: order.customerId,
        orderId: order.id,
        summary: `Order ${order.orderNumber} submitted for approval — ${evaluation.reasons.join('; ')}`,
      });
    } else {
      order.approvalStatus = 'not_required';
      confirmOrder(tx, order, customer);
    }
  };

  const orderHooks: ApprovalDecisionHooks = {
    onApproved: (tx, request) => {
      const order = load(runtime, 'salesOrders', request.targetId, 'Order');
      tx.touch('salesOrders', order);
      if (order.status !== 'pending_approval') return;
      order.approvalStatus = 'approved';
      const customer = load(runtime, 'customers', order.customerId, 'Customer');
      confirmOrder(tx, order, customer);
      finalize(tx, 'salesOrders', order, 'order.confirmed', 'sales_order', [
        'status',
        'approvalStatus',
      ]);
    },
    onRejected: (tx, request, reason) => {
      const order = load(runtime, 'salesOrders', request.targetId, 'Order');
      tx.touch('salesOrders', order);
      order.status = 'draft';
      order.approvalStatus = 'rejected';
      order.notes = `${order.notes ? `${order.notes}\n` : ''}Approval rejected: ${reason}`;
      finalize(tx, 'salesOrders', order, 'order.approval_rejected', 'sales_order', [
        'status',
        'approvalStatus',
      ]);
      tx.activityEvent({
        type: 'order.rejected',
        subjectType: 'sales_order',
        subjectId: order.id,
        subjectLabel: order.orderNumber,
        customerId: order.customerId,
        orderId: order.id,
        summary: `Order ${order.orderNumber} approval rejected — ${reason}`,
      });
    },
    onChangesRequested: (tx, request, reason) => {
      const order = load(runtime, 'salesOrders', request.targetId, 'Order');
      tx.touch('salesOrders', order);
      order.status = 'draft';
      order.approvalStatus = 'not_required';
      delete order.approvalRequestId;
      order.notes = `${order.notes ? `${order.notes}\n` : ''}Changes requested: ${reason}`;
      finalize(tx, 'salesOrders', order, 'order.changes_requested', 'sales_order', [
        'status',
        'approvalStatus',
      ]);
    },
  };

  const quoteHooks: ApprovalDecisionHooks = {
    onApproved: (tx, request) => {
      const quote = load(runtime, 'quotes', request.targetId, 'Quote');
      tx.touch('quotes', quote);
      if (quote.status === 'pending_approval') quote.status = 'approved';
      finalize(tx, 'quotes', quote, 'quote.approved', 'quote', ['status']);
    },
    onRejected: (tx, request, reason) => {
      const quote = load(runtime, 'quotes', request.targetId, 'Quote');
      tx.touch('quotes', quote);
      quote.status = 'rejected';
      quote.rejectionReason = reason;
      finalize(tx, 'quotes', quote, 'quote.rejected', 'quote', ['status']);
    },
    onChangesRequested: (tx, request, reason) => {
      const quote = load(runtime, 'quotes', request.targetId, 'Quote');
      tx.touch('quotes', quote);
      quote.status = 'draft';
      delete quote.approvalRequestId;
      quote.notes = `${quote.notes ? `${quote.notes}\n` : ''}Changes requested: ${reason}`;
      finalize(tx, 'quotes', quote, 'quote.changes_requested', 'quote', ['status']);
    },
  };

  const quotes = {
    create: (input: QuoteInput, options?: MutationOptions): Promise<QuoteDetail> =>
      runtime.command('POST /quotes', options, input, (tx) => {
        const customer = load(runtime, 'customers', input.customerId, 'Customer');
        const actor = runtime.require('quotes.create', {
          ownerId: customer.accountOwnerId,
          teamId: customer.salesTeamId,
          customerId: customer.id,
        });
        if (customer.status === 'inactive' || customer.status === 'closed')
          throw domainError(
            'CUSTOMER_INACTIVE',
            `${customer.displayName} cannot receive quotes while ${customer.status}`,
            409,
          );
        const contact = input.contactId
          ? load(runtime, 'contacts', input.contactId, 'Contact')
          : runtime.indexes.contactsByCustomer
              .get(customer.id)
              .find((entry) => entry.isPrimary && entry.status === 'active');
        if (!contact)
          throw domainError(
            'PRIMARY_CONTACT_REQUIRED',
            `${customer.displayName} has no active contact for the quote`,
          );
        const today = runtime.store.today;
        const expiration = input.expirationDate ?? addDays(today, 30);
        if (compareDates(expiration, today) < 0)
          throw domainError('VALIDATION_FAILED', 'expirationDate must be on or after today');
        const region = shippingRegion(runtime, customer).region;
        const priced = priceLines(runtime, customer, input.lines, region, today, {
          allowOverride: runtime.can('orders.override_price'),
        });
        const totals = priced.totals(money(input.freightMinor ?? 0, customer.preferredCurrency));
        const id = runtime.store.nextId('quote');
        const quote: Quote = {
          id,
          organizationId: customer.organizationId,
          quoteNumber: runtime.store.nextBusinessNumber('quote'),
          customerId: customer.id,
          contactId: contact.id,
          ownerId: actor.id,
          createdBusinessDate: today,
          expirationDate: expiration,
          currency: customer.preferredCurrency,
          fxRateToUsd: FX_RATES_TO_USD[customer.preferredCurrency],
          priceListId: customer.priceListId,
          status: 'draft',
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          freight: totals.freight,
          total: totals.total,
          costTotal: totals.costTotal,
          grossMargin: totals.grossMargin,
          grossMarginBps: totals.grossMarginBps,
          metadata: metadata(tx, id),
          ...(trimmed(input.notes) ? { notes: trimmed(input.notes) as string } : {}),
          ...(trimmed(input.terms) ? { terms: trimmed(input.terms) as string } : {}),
        };
        tx.create('quotes', quote);
        for (const line of quoteLinesFrom(tx, id, priced.lines)) tx.create('quoteLines', line);
        tx.audit('quote.created', 'quote', id, { nextVersion: 1 });
        tx.activityEvent({
          type: 'quote.created',
          subjectType: 'quote',
          subjectId: id,
          subjectLabel: quote.quoteNumber,
          customerId: customer.id,
          summary: `Quote ${quote.quoteNumber} drafted for ${customer.displayName} (${dollars(quote.total)})`,
        });
        return getQuote(runtime, id);
      }),

    update: (
      id: string,
      input: Partial<QuoteInput>,
      options?: MutationOptions,
    ): Promise<QuoteDetail> =>
      runtime.command('PATCH /quotes/:id', options, { id, input }, (tx) => {
        const quote = load(runtime, 'quotes', id, 'Quote');
        const customer = load(runtime, 'customers', quote.customerId, 'Customer');
        runtime.require('quotes.edit', {
          ownerId: quote.ownerId,
          teamId: customer.salesTeamId,
          customerId: customer.id,
        });
        if (quote.status !== 'draft' && quote.status !== 'approved')
          throw transition('Quote', quote.status, 'be edited');
        open(tx, 'quotes', id, 'Quote', options);
        const changed: string[] = [];
        if (input.expirationDate) {
          if (compareDates(input.expirationDate, quote.createdBusinessDate) < 0)
            throw domainError(
              'VALIDATION_FAILED',
              'expirationDate must be on or after the quote date',
            );
          quote.expirationDate = input.expirationDate;
          changed.push('expirationDate');
        }
        if (input.contactId) {
          quote.contactId = load(runtime, 'contacts', input.contactId, 'Contact').id;
          changed.push('contactId');
        }
        if (input.notes !== undefined) {
          quote.notes = trimmed(input.notes) ?? '';
          changed.push('notes');
        }
        if (input.terms !== undefined) {
          quote.terms = trimmed(input.terms) ?? '';
          changed.push('terms');
        }
        const priceSensitive = input.lines !== undefined || input.freightMinor !== undefined;
        if (priceSensitive) {
          const region = shippingRegion(runtime, customer).region;
          const lineInputs =
            input.lines ??
            runtime.indexes.quoteLinesByQuote.get(id).map((line) => ({
              skuId: line.skuId,
              quantity: line.quantity,
              discountBps: line.discountBps,
            }));
          const priced = priceLines(runtime, customer, lineInputs, region, runtime.store.today, {
            allowOverride: runtime.can('orders.override_price'),
          });
          if (input.lines) {
            for (const line of runtime.indexes.quoteLinesByQuote.get(id))
              tx.remove('quoteLines', line.id);
            for (const line of quoteLinesFrom(tx, id, priced.lines)) tx.create('quoteLines', line);
            changed.push('lines');
          }
          applyTotals(
            quote,
            priced.totals(money(input.freightMinor ?? quote.freight.minor, quote.currency)),
          );
          changed.push('totals');
          if (quote.status === 'approved') {
            cancelApproval(tx, quote.approvalRequestId, 'Quote edited after approval');
            const evaluation = evaluateQuoteApproval({
              approvalValueUsdMinor: usdMinor(
                addMoney(quote.subtotal, quote.freight),
                quote.fxRateToUsd,
              ),
              grossMarginBps: quote.grossMarginBps,
              maxLineDiscountBps: maxDiscount(priced.lines.map((line) => line.priced)),
            });
            quote.status = evaluation.required ? 'draft' : 'approved';
            delete quote.approvalRequestId;
            changed.push('status');
          }
        }
        finalize(tx, 'quotes', quote, 'quote.updated', 'quote', changed);
        return getQuote(runtime, id);
      }),

    submit: (id: string, options?: MutationOptions): Promise<QuoteDetail> =>
      runtime.command('POST /quotes/:id/submit', options, { id }, (tx) => {
        const quote = load(runtime, 'quotes', id, 'Quote');
        const customer = load(runtime, 'customers', quote.customerId, 'Customer');
        runtime.require('quotes.edit', {
          ownerId: quote.ownerId,
          teamId: customer.salesTeamId,
          customerId: customer.id,
        });
        if (quote.status !== 'draft') throw transition('Quote', quote.status, 'be submitted');
        const lines = runtime.indexes.quoteLinesByQuote.get(id);
        if (lines.length === 0)
          throw domainError('QUOTE_EMPTY', 'A quote needs at least one line before submission');
        open(tx, 'quotes', id, 'Quote', options);
        const evaluation = evaluateQuoteApproval({
          approvalValueUsdMinor: usdMinor(
            addMoney(quote.subtotal, quote.freight),
            quote.fxRateToUsd,
          ),
          grossMarginBps: quote.grossMarginBps,
          maxLineDiscountBps: maxDiscount(lines),
        });
        if (evaluation.required) {
          const request = createApprovalRequest(tx, {
            targetType: 'quote',
            targetId: id,
            targetNumber: quote.quoteNumber,
            evaluation,
            requestedBy: tx.actor.id,
            amount: addMoney(quote.subtotal, quote.freight),
          });
          quote.status = 'pending_approval';
          quote.approvalRequestId = request.id;
        } else quote.status = 'approved';
        finalize(tx, 'quotes', quote, 'quote.submitted', 'quote', ['status']);
        return getQuote(runtime, id);
      }),

    send: (id: string, options?: MutationOptions): Promise<QuoteDetail> =>
      runtime.command('POST /quotes/:id/send', options, { id }, (tx) => {
        const quote = load(runtime, 'quotes', id, 'Quote');
        const customer = load(runtime, 'customers', quote.customerId, 'Customer');
        runtime.require('quotes.send', {
          ownerId: quote.ownerId,
          teamId: customer.salesTeamId,
          customerId: customer.id,
        });
        if (quote.status === 'draft') {
          const lines = runtime.indexes.quoteLinesByQuote.get(id);
          if (lines.length === 0)
            throw domainError('QUOTE_EMPTY', 'A quote needs at least one line before sending');
          const evaluation = evaluateQuoteApproval({
            approvalValueUsdMinor: usdMinor(
              addMoney(quote.subtotal, quote.freight),
              quote.fxRateToUsd,
            ),
            grossMarginBps: quote.grossMarginBps,
            maxLineDiscountBps: maxDiscount(lines),
          });
          if (evaluation.required)
            throw domainError(
              'APPROVAL_REQUIRED',
              `Quote ${quote.quoteNumber} requires approval before it can be sent: ${evaluation.reasons.join('; ')}`,
              409,
            );
        } else if (quote.status !== 'approved') throw transition('Quote', quote.status, 'be sent');
        open(tx, 'quotes', id, 'Quote', options);
        quote.status = 'sent';
        quote.sentAt = tx.occurredAt;
        finalize(tx, 'quotes', quote, 'quote.sent', 'quote', ['status', 'sentAt']);
        tx.activityEvent({
          type: 'quote.sent',
          subjectType: 'quote',
          subjectId: id,
          subjectLabel: quote.quoteNumber,
          customerId: customer.id,
          summary: `Quote ${quote.quoteNumber} sent to ${customer.displayName}`,
        });
        return getQuote(runtime, id);
      }),

    markViewed: (id: string, options?: MutationOptions): Promise<QuoteDetail> =>
      runtime.command('POST /quotes/:id/viewed', options, { id }, (tx) => {
        const quote = open(tx, 'quotes', id, 'Quote', options);
        if (quote.status !== 'sent') throw transition('Quote', quote.status, 'be marked viewed');
        quote.status = 'viewed';
        quote.viewedAt = tx.occurredAt;
        finalize(tx, 'quotes', quote, 'quote.viewed', 'quote', ['status', 'viewedAt']);
        return getQuote(runtime, id);
      }),

    accept: (id: string, options?: MutationOptions): Promise<QuoteDetail> =>
      runtime.command('POST /quotes/:id/accept', options, { id }, (tx) => {
        const quote = load(runtime, 'quotes', id, 'Quote');
        runtime.require('quotes.convert', { ownerId: quote.ownerId, customerId: quote.customerId });
        if (quote.status !== 'sent' && quote.status !== 'viewed')
          throw transition('Quote', quote.status, 'be accepted');
        if (compareDates(runtime.store.today, quote.expirationDate) > 0)
          throw domainError(
            'QUOTE_EXPIRED',
            `Quote ${quote.quoteNumber} expired on ${quote.expirationDate}`,
            409,
          );
        open(tx, 'quotes', id, 'Quote', options);
        quote.status = 'accepted';
        quote.acceptedAt = tx.occurredAt;
        finalize(tx, 'quotes', quote, 'quote.accepted', 'quote', ['status', 'acceptedAt']);
        tx.activityEvent({
          type: 'quote.accepted',
          subjectType: 'quote',
          subjectId: id,
          subjectLabel: quote.quoteNumber,
          customerId: quote.customerId,
          summary: `Quote ${quote.quoteNumber} accepted by the customer`,
        });
        return getQuote(runtime, id);
      }),

    reject: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<QuoteDetail> =>
      runtime.command('POST /quotes/:id/reject', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        const quote = load(runtime, 'quotes', id, 'Quote');
        runtime.require('quotes.edit', { ownerId: quote.ownerId, customerId: quote.customerId });
        if (quote.status !== 'sent' && quote.status !== 'viewed')
          throw transition('Quote', quote.status, 'be rejected by the customer');
        open(tx, 'quotes', id, 'Quote', options);
        quote.status = 'rejected';
        quote.rejectionReason = input.reason.trim();
        finalize(tx, 'quotes', quote, 'quote.customer_rejected', 'quote', ['status']);
        return getQuote(runtime, id);
      }),

    cancel: (id: string, options?: MutationOptions): Promise<QuoteDetail> =>
      runtime.command('POST /quotes/:id/cancel', options, { id }, (tx) => {
        const quote = load(runtime, 'quotes', id, 'Quote');
        runtime.require('quotes.edit', { ownerId: quote.ownerId, customerId: quote.customerId });
        if (quote.status === 'converted' || quote.status === 'cancelled')
          throw transition('Quote', quote.status, 'be cancelled');
        open(tx, 'quotes', id, 'Quote', options);
        cancelApproval(tx, quote.approvalRequestId, 'Quote cancelled');
        quote.status = 'cancelled';
        finalize(tx, 'quotes', quote, 'quote.cancelled', 'quote', ['status']);
        return getQuote(runtime, id);
      }),

    /** Section 58.4 — converts an accepted quote into a draft order with snapshotted values, then submits it. */
    convert: (
      id: string,
      input: {
        defaultWarehouseId?: string;
        requestedDeliveryDate?: string;
        customerPoNumber?: string;
      } = {},
      options?: MutationOptions,
    ): Promise<OrderDetail> =>
      runtime.command('POST /quotes/:id/convert', options, { id, input }, (tx) => {
        const quote = load(runtime, 'quotes', id, 'Quote');
        const customer = load(runtime, 'customers', quote.customerId, 'Customer');
        const actor = runtime.require('quotes.convert', {
          ownerId: quote.ownerId,
          teamId: customer.salesTeamId,
          customerId: customer.id,
        });
        if (quote.status !== 'accepted') throw transition('Quote', quote.status, 'be converted');
        if (quote.convertedOrderId)
          throw domainError(
            'QUOTE_ALREADY_CONVERTED',
            `Quote ${quote.quoteNumber} was already converted`,
            409,
          );
        open(tx, 'quotes', id, 'Quote', options);
        const today = runtime.store.today;
        const addresses = shippingRegion(runtime, customer);
        const warehouseId =
          input.defaultWarehouseId ?? [...runtime.store.dataset.warehouses.values()][0]?.id ?? '';
        const orderId = runtime.store.nextId('salesOrder');
        const order: SalesOrder = {
          id: orderId,
          organizationId: customer.organizationId,
          orderNumber: runtime.store.nextBusinessNumber('salesOrder'),
          customerId: customer.id,
          sourceQuoteId: id,
          contactId: quote.contactId,
          ownerId: actor.id,
          salesTeamId: customer.salesTeamId,
          orderDate: today,
          defaultWarehouseId: warehouseId,
          billingAddress: addresses.billing,
          shippingAddress: addresses.snapshot,
          currency: customer.preferredCurrency,
          fxRateToUsd: FX_RATES_TO_USD[customer.preferredCurrency],
          paymentTermsCode: customer.paymentTermsCode,
          status: 'draft',
          approvalStatus: 'not_required',
          riskFlags: [],
          allocationStatus: 'unallocated',
          fulfillmentStatus: 'unfulfilled',
          invoiceStatus: 'not_invoiced',
          paymentStatus: 'not_invoiced',
          subtotal: quote.subtotal,
          discountTotal: quote.discountTotal,
          taxTotal: quote.taxTotal,
          freight: quote.freight,
          total: quote.total,
          costTotal: quote.costTotal,
          grossMargin: quote.grossMargin,
          grossMarginBps: quote.grossMarginBps,
          metadata: metadata(tx, orderId),
          ...(input.requestedDeliveryDate
            ? { requestedDeliveryDate: input.requestedDeliveryDate }
            : {}),
          ...(trimmed(input.customerPoNumber)
            ? { customerPoNumber: trimmed(input.customerPoNumber) as string }
            : {}),
        };
        tx.create('salesOrders', order);
        tx.emit('order.created', { orderId, customerId: customer.id });
        for (const quoteLine of runtime.indexes.quoteLinesByQuote
          .get(id)
          .slice()
          .sort((a, b) => a.lineNumber - b.lineNumber)) {
          const sku = runtime.store.dataset.skus.get(quoteLine.skuId);
          tx.create('salesOrderLines', {
            id: runtime.store.nextId('salesOrderLine'),
            organizationId: order.organizationId,
            orderId,
            lineNumber: quoteLine.lineNumber,
            skuId: quoteLine.skuId,
            skuCode: quoteLine.skuCode,
            description: quoteLine.description,
            unitOfMeasure: quoteLine.unitOfMeasure,
            orderedQuantity: quoteLine.quantity,
            cancelledQuantity: '0',
            reservedQuantity: '0',
            fulfilledQuantity: '0',
            returnedQuantity: '0',
            invoicedQuantity: '0',
            listUnitPrice: quoteLine.listUnitPrice,
            unitPrice: quoteLine.unitPrice,
            discountBps: quoteLine.discountBps,
            taxRateBps: quoteLine.taxRateBps,
            unitCost: quoteLine.unitCost,
            netAmount: quoteLine.netAmount,
            taxAmount: quoteLine.taxAmount,
            totalAmount: quoteLine.totalAmount,
            preferredWarehouseId: warehouseId,
            promisedDate: addBusinessDays(today, Math.max(2, Math.min(15, sku?.leadTimeDays ?? 5))),
          });
        }
        quote.status = 'converted';
        quote.convertedOrderId = orderId;
        finalize(tx, 'quotes', quote, 'quote.converted', 'quote', ['status', 'convertedOrderId']);
        tx.audit('order.created', 'sales_order', orderId, { nextVersion: 1 });
        submitOrder(tx, order);
        tx.dirty('salesOrders');
        tx.activityEvent({
          type: 'order.created',
          subjectType: 'sales_order',
          subjectId: orderId,
          subjectLabel: order.orderNumber,
          customerId: customer.id,
          orderId,
          summary: `Order ${order.orderNumber} created from quote ${quote.quoteNumber}`,
        });
        return getOrder(runtime, models, orderId);
      }),

    /** Section 58.4 — scheduled expiry; invoked when the demo clock advances. */
    expire: (tx: Transaction): number => {
      let count = 0;
      const today = runtime.store.today;
      for (const quote of runtime.store.dataset.quotes.values()) {
        if (
          (quote.status === 'sent' || quote.status === 'viewed') &&
          compareDates(today, quote.expirationDate) > 0
        ) {
          tx.touch('quotes', quote);
          quote.status = 'expired';
          finalize(tx, 'quotes', quote, 'quote.expired', 'quote', ['status']);
          count += 1;
        }
      }
      return count;
    },
  };

  /** Section 59.6 "Place on hold" — the interactive command and a workflow's action. */
  const holdOrder = (
    tx: Transaction,
    id: string,
    reason: string,
    options?: MutationOptions,
  ): SalesOrder => {
    new Validator().required('reason', reason).throwIfAny();
    tx.require('orders.hold');
    const order = open(tx, 'salesOrders', id, 'Order', options);
    if (order.status !== 'confirmed' && order.status !== 'pending_approval')
      throw transition('Order', order.status, 'be placed on hold');
    order.status = 'on_hold';
    order.holdReason = reason.trim();
    finalize(tx, 'salesOrders', order, 'order.held', 'sales_order', ['status', 'holdReason']);
    tx.activityEvent({
      type: 'order.held',
      subjectType: 'sales_order',
      subjectId: id,
      subjectLabel: order.orderNumber,
      customerId: order.customerId,
      orderId: id,
      summary: `Order ${order.orderNumber} placed on hold — ${reason.trim()}`,
    });
    tx.notify(order.ownerId, 'warning', `${order.orderNumber} placed on hold`, reason.trim(), {
      type: 'sales_order',
      id,
    });
    return order;
  };

  /**
   * A confirmed order sent back to wait on an approval by one role: what an
   * edit of a confirmed order does when the policy asks for one (section 59.6
   * "Edit confirmed"), with the role a workflow names (section 69.3
   * `request_approval`). Its reservations are released until the approval.
   */
  const requestOrderApproval = (
    tx: Transaction,
    id: string,
    role: string,
    reason: string,
    options?: MutationOptions,
  ): SalesOrder => {
    tx.require('orders.edit_confirmed');
    const order = open(tx, 'salesOrders', id, 'Order', options);
    if (order.status !== 'confirmed')
      throw transition('Order', order.status, 'be sent for approval');
    releaseReservations(tx, order);
    const request = createApprovalRequest(tx, {
      targetType: 'sales_order',
      targetId: id,
      targetNumber: order.orderNumber,
      evaluation: {
        required: true,
        policyCode: 'WORKFLOW_REVIEW',
        reasons: [reason],
        steps: [{ sequence: 1, requiredRole: role, reason }],
      },
      requestedBy: tx.actor.id,
      amount: addMoney(order.subtotal, order.freight),
    });
    order.status = 'pending_approval';
    order.approvalStatus = 'pending';
    order.approvalRequestId = request.id;
    runtime.projections.recalculateOrder(order);
    finalize(tx, 'salesOrders', order, 'order.approval_requested', 'sales_order', [
      'status',
      'approvalStatus',
    ]);
    tx.activityEvent({
      type: 'order.submitted',
      subjectType: 'sales_order',
      subjectId: id,
      subjectLabel: order.orderNumber,
      customerId: order.customerId,
      orderId: id,
      summary: `Order ${order.orderNumber} sent for approval — ${reason}`,
    });
    return order;
  };

  const orders = {
    create: (input: OrderInput, options?: MutationOptions): Promise<OrderDetail> =>
      runtime.command('POST /orders', options, input, (tx) => {
        const customer = load(runtime, 'customers', input.customerId, 'Customer');
        const actor = runtime.require('orders.create', {
          ownerId: customer.accountOwnerId,
          teamId: customer.salesTeamId,
          customerId: customer.id,
        });
        if (customer.status !== 'active' && customer.status !== 'on_hold')
          throw domainError(
            customer.status === 'prospect' ? 'CUSTOMER_INACTIVE' : 'CUSTOMER_INACTIVE',
            `${customer.displayName} is ${customer.status}; orders require an active customer (prospects convert through an accepted quote)`,
            409,
          );
        const contact = input.contactId
          ? load(runtime, 'contacts', input.contactId, 'Contact')
          : runtime.indexes.contactsByCustomer
              .get(customer.id)
              .find((entry) => entry.isPrimary && entry.status === 'active');
        const today = runtime.store.today;
        const addresses = shippingRegion(runtime, customer, input.shippingAddressId);
        const warehouseId =
          input.defaultWarehouseId ?? [...runtime.store.dataset.warehouses.values()][0]?.id ?? '';
        if (!runtime.store.dataset.warehouses.has(warehouseId))
          throw domainError('VALIDATION_FAILED', `Warehouse ${warehouseId} does not exist`);
        const priced = priceLines(runtime, customer, input.lines, addresses.region, today, {
          allowOverride: runtime.can('orders.override_price'),
        });
        const totals = priced.totals(money(input.freightMinor ?? 0, customer.preferredCurrency));
        const id = runtime.store.nextId('salesOrder');
        const order: SalesOrder = {
          id,
          organizationId: customer.organizationId,
          orderNumber: runtime.store.nextBusinessNumber('salesOrder'),
          customerId: customer.id,
          contactId: contact?.id ?? '',
          ownerId: actor.id,
          salesTeamId: customer.salesTeamId,
          orderDate: today,
          defaultWarehouseId: warehouseId,
          billingAddress: addresses.billing,
          shippingAddress: addresses.snapshot,
          currency: customer.preferredCurrency,
          fxRateToUsd: FX_RATES_TO_USD[customer.preferredCurrency],
          paymentTermsCode: customer.paymentTermsCode,
          status: 'draft',
          approvalStatus: 'not_required',
          riskFlags: [],
          allocationStatus: 'unallocated',
          fulfillmentStatus: 'unfulfilled',
          invoiceStatus: 'not_invoiced',
          paymentStatus: 'not_invoiced',
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          freight: totals.freight,
          total: totals.total,
          costTotal: totals.costTotal,
          grossMargin: totals.grossMargin,
          grossMarginBps: totals.grossMarginBps,
          metadata: metadata(tx, id),
          ...(input.requestedDeliveryDate
            ? { requestedDeliveryDate: input.requestedDeliveryDate }
            : {}),
          ...(trimmed(input.customerPoNumber)
            ? { customerPoNumber: trimmed(input.customerPoNumber) as string }
            : {}),
          ...(trimmed(input.notes) ? { notes: trimmed(input.notes) as string } : {}),
        };
        tx.create('salesOrders', order);
        for (const line of orderLinesFrom(id, priced.lines, warehouseId, today))
          tx.create('salesOrderLines', line);
        tx.emit('order.created', { orderId: id, customerId: customer.id });
        tx.audit('order.created', 'sales_order', id, { nextVersion: 1 });
        tx.activityEvent({
          type: 'order.created',
          subjectType: 'sales_order',
          subjectId: id,
          subjectLabel: order.orderNumber,
          customerId: customer.id,
          orderId: id,
          summary: `Order ${order.orderNumber} drafted for ${customer.displayName} (${dollars(order.total)})`,
        });
        return getOrder(runtime, models, id);
      }),

    update: (
      id: string,
      input: Partial<OrderInput> & { lineQuantities?: Record<string, string> },
      options?: MutationOptions,
    ): Promise<OrderDetail> =>
      runtime.command('PATCH /orders/:id', options, { id, input }, (tx) => {
        const order = load(runtime, 'salesOrders', id, 'Order');
        const customer = load(runtime, 'customers', order.customerId, 'Customer');
        const draft = order.status === 'draft';
        if (draft)
          runtime.require('orders.edit_draft', {
            ownerId: order.ownerId,
            teamId: order.salesTeamId,
            customerId: customer.id,
          });
        else if (
          order.status === 'confirmed' ||
          order.status === 'pending_approval' ||
          order.status === 'on_hold'
        )
          runtime.require('orders.edit_confirmed');
        else throw transition('Order', order.status, 'be edited');
        const lines = runtime.indexes.linesByOrder.get(id);
        if (
          !draft &&
          lines.some((line) => quantityToMilli(line.fulfilledQuantity) > 0) &&
          (input.lines || input.lineQuantities)
        )
          throw domainError(
            'ORDER_HAS_FULFILLED_QUANTITY',
            'Lines with shipped quantity cannot be changed',
            409,
          );
        open(tx, 'salesOrders', id, 'Order', options);
        const totalBefore = usdMinor(order.total, order.fxRateToUsd);
        const changed: string[] = [];
        if (input.requestedDeliveryDate !== undefined) {
          order.requestedDeliveryDate = input.requestedDeliveryDate;
          changed.push('requestedDeliveryDate');
        }
        if (input.customerPoNumber !== undefined) {
          order.customerPoNumber = trimmed(input.customerPoNumber) ?? '';
          changed.push('customerPoNumber');
        }
        if (input.notes !== undefined) {
          order.notes = trimmed(input.notes) ?? '';
          changed.push('notes');
        }
        if (input.defaultWarehouseId && input.defaultWarehouseId !== order.defaultWarehouseId) {
          if (!runtime.store.dataset.warehouses.has(input.defaultWarehouseId))
            throw domainError(
              'VALIDATION_FAILED',
              `Warehouse ${input.defaultWarehouseId} does not exist`,
            );
          order.defaultWarehouseId = input.defaultWarehouseId;
          for (const line of lines)
            tx.touch('salesOrderLines', line).preferredWarehouseId = input.defaultWarehouseId;
          changed.push('defaultWarehouseId');
        }
        const region = shippingRegion(runtime, customer, input.shippingAddressId).region;
        let priceSensitive = false;
        if (input.lines) {
          const priced = priceLines(runtime, customer, input.lines, region, order.orderDate, {
            allowOverride: runtime.can('orders.override_price'),
          });
          for (const line of lines) tx.remove('salesOrderLines', line.id);
          for (const line of orderLinesFrom(
            id,
            priced.lines,
            order.defaultWarehouseId,
            order.orderDate,
          ))
            tx.create('salesOrderLines', line);
          applyTotals(
            order,
            priced.totals(money(input.freightMinor ?? order.freight.minor, order.currency)),
          );
          priceSensitive = true;
          changed.push('lines');
        } else if (input.lineQuantities || input.freightMinor !== undefined) {
          const lineInputs = lines.map((line) => ({
            skuId: line.skuId,
            quantity: input.lineQuantities?.[line.id] ?? line.orderedQuantity,
            discountBps: line.discountBps,
            unitPriceMinor: line.listUnitPrice.minor,
            preferredWarehouseId: line.preferredWarehouseId,
          }));
          const priced = priceLines(runtime, customer, lineInputs, region, order.orderDate, {
            allowOverride: true,
            historicalDiscontinuedOk: true,
          });
          for (const [index, line] of lines.entries()) {
            const next = priced.lines[index];
            if (!next) continue;
            tx.touch('salesOrderLines', line);
            line.orderedQuantity = next.priced.quantity;
            line.netAmount = next.priced.netAmount;
            line.taxAmount = next.priced.taxAmount;
            line.totalAmount = next.priced.totalAmount;
          }
          applyTotals(
            order,
            priced.totals(money(input.freightMinor ?? order.freight.minor, order.currency)),
          );
          priceSensitive = true;
          changed.push(input.lineQuantities ? 'lineQuantities' : 'freight');
        }
        tx.dirty('salesOrderLines');
        if (priceSensitive && !draft) {
          // Section 59.6 "Edit confirmed": release reservations no longer required and re-evaluate approval.
          releaseReservations(tx, order);
          cancelApproval(tx, order.approvalRequestId, 'Order edited after submission');
          delete order.approvalRequestId;
          const { evaluation, flags } = evaluateOrder(
            order,
            runtime.indexes.linesByOrder.get(id),
            customer,
          );
          order.riskFlags = flags;
          if (evaluation.required) {
            const request = createApprovalRequest(tx, {
              targetType: 'sales_order',
              targetId: id,
              targetNumber: order.orderNumber,
              evaluation,
              requestedBy: tx.actor.id,
              amount: addMoney(order.subtotal, order.freight),
            });
            order.status = 'pending_approval';
            order.approvalStatus = 'pending';
            order.approvalRequestId = request.id;
          } else if (order.status !== 'on_hold') {
            order.status = 'confirmed';
            order.approvalStatus = 'not_required';
            allocateOrder(tx, order);
          }
          changed.push('status');
        }
        runtime.projections.recalculateOrder(order);
        finalize(tx, 'salesOrders', order, 'order.updated', 'sales_order', changed);
        if (usdMinor(order.total, order.fxRateToUsd) !== totalBefore)
          tx.emit('order.value_changed', {
            orderId: id,
            customerId: order.customerId,
            previousTotalUsd: totalBefore,
          });
        return getOrder(runtime, models, id);
      }),

    submit: (id: string, options?: MutationOptions): Promise<OrderDetail> =>
      runtime.command('POST /orders/:id/submit', options, { id }, (tx) => {
        const order = load(runtime, 'salesOrders', id, 'Order');
        runtime.require('orders.submit', {
          ownerId: order.ownerId,
          teamId: order.salesTeamId,
          customerId: order.customerId,
        });
        if (order.status !== 'draft') throw transition('Order', order.status, 'be submitted');
        open(tx, 'salesOrders', id, 'Order', options);
        submitOrder(tx, order);
        const confirmed = (order.status as SalesOrder['status']) === 'confirmed';
        finalize(
          tx,
          'salesOrders',
          order,
          confirmed ? 'order.confirmed' : 'order.submitted',
          'sales_order',
          ['status', 'approvalStatus'],
        );
        return getOrder(runtime, models, id);
      }),

    hold: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<OrderDetail> =>
      runtime.command('POST /orders/:id/hold', options, { id, input }, (tx) => {
        holdOrder(tx, id, input.reason, options);
        return getOrder(runtime, models, id);
      }),

    releaseHold: (id: string, options?: MutationOptions): Promise<OrderDetail> =>
      runtime.command('POST /orders/:id/release-hold', options, { id }, (tx) => {
        runtime.require('orders.release_hold');
        const order = open(tx, 'salesOrders', id, 'Order', options);
        if (order.status !== 'on_hold') throw transition('Order', order.status, 'be released');
        delete order.holdReason;
        if (order.approvalStatus === 'pending') order.status = 'pending_approval';
        else {
          order.status = 'confirmed';
          allocateOrder(tx, order);
        }
        finalize(tx, 'salesOrders', order, 'order.hold_released', 'sales_order', [
          'status',
          'holdReason',
        ]);
        tx.activityEvent({
          type: 'order.hold_released',
          subjectType: 'sales_order',
          subjectId: id,
          subjectLabel: order.orderNumber,
          customerId: order.customerId,
          orderId: id,
          summary: `Order ${order.orderNumber} released from hold`,
        });
        return getOrder(runtime, models, id);
      }),

    cancel: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<OrderDetail> =>
      runtime.command('POST /orders/:id/cancel', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        const order = load(runtime, 'salesOrders', id, 'Order');
        runtime.require('orders.cancel', {
          ownerId: order.ownerId,
          teamId: order.salesTeamId,
          customerId: order.customerId,
        });
        if (order.status === 'cancelled')
          throw new NexoraApiError(
            'ORDER_ALREADY_CANCELLED',
            `Order ${order.orderNumber} is already cancelled`,
          );
        if (order.status === 'closed') throw transition('Order', order.status, 'be cancelled');
        const lines = runtime.indexes.linesByOrder.get(id);
        if (lines.some((line) => quantityToMilli(line.fulfilledQuantity) > 0))
          throw domainError(
            'ORDER_HAS_FULFILLED_QUANTITY',
            `Order ${order.orderNumber} has shipped quantity; cancel the remaining quantities instead`,
            409,
          );
        open(tx, 'salesOrders', id, 'Order', options);
        releaseReservations(tx, order, false);
        for (const shipment of runtime.indexes.shipmentsByOrder.get(id)) {
          if (
            shipment.status === 'pending' ||
            shipment.status === 'picking' ||
            shipment.status === 'packed' ||
            shipment.status === 'ready_to_ship'
          ) {
            tx.touch('shipments', shipment).status = 'cancelled';
            shipment.metadata.updatedAt = tx.occurredAt;
          }
        }
        tx.dirty('shipments');
        for (const line of lines) {
          tx.touch('salesOrderLines', line);
          line.cancelledQuantity = milliToQuantity(
            quantityToMilli(line.orderedQuantity) - quantityToMilli(line.fulfilledQuantity),
          );
          line.reservedQuantity = '0';
          tx.dirty('salesOrderLines', line);
        }
        cancelApproval(tx, order.approvalRequestId, 'Order cancelled');
        order.status = 'cancelled';
        order.cancelledAt = tx.occurredAt;
        order.cancellationReason = input.reason.trim();
        if (order.approvalStatus === 'pending') order.approvalStatus = 'cancelled';
        runtime.projections.recalculateOrder(order);
        finalize(tx, 'salesOrders', order, 'order.cancelled', 'sales_order', [
          'status',
          'cancelledAt',
          'cancellationReason',
        ]);
        tx.activityEvent({
          type: 'order.cancelled',
          subjectType: 'sales_order',
          subjectId: id,
          subjectLabel: order.orderNumber,
          customerId: order.customerId,
          orderId: id,
          summary: `Order ${order.orderNumber} cancelled — ${input.reason.trim()}`,
        });
        return getOrder(runtime, models, id);
      }),

    cancelRemaining: (
      id: string,
      input: { reason: string; lineIds?: string[] },
      options?: MutationOptions,
    ): Promise<OrderDetail> =>
      runtime.command('POST /orders/:id/cancel-remaining', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        const order = load(runtime, 'salesOrders', id, 'Order');
        runtime.require('orders.cancel', {
          ownerId: order.ownerId,
          teamId: order.salesTeamId,
          customerId: order.customerId,
        });
        if (order.status !== 'confirmed' && order.status !== 'on_hold')
          throw transition('Order', order.status, 'cancel remaining quantities');
        open(tx, 'salesOrders', id, 'Order', options);
        let cancelled = 0;
        for (const line of runtime.indexes.linesByOrder.get(id)) {
          if (input.lineIds && !input.lineIds.includes(line.id)) continue;
          const remaining = openMilli(line);
          if (remaining <= 0) continue;
          tx.touch('salesOrderLines', line);
          line.cancelledQuantity = milliToQuantity(
            quantityToMilli(line.cancelledQuantity) + remaining,
          );
          cancelled += remaining;
          for (const reservation of runtime.indexes.reservationsByLine.get(line.id)) {
            if (reservation.status !== 'active') continue;
            tx.touch('reservations', reservation);
            const consumed = quantityToMilli(reservation.consumedQuantity);
            if (consumed > 0) {
              reservation.quantity = reservation.consumedQuantity;
              reservation.status = 'consumed';
            } else reservation.status = 'released';
            tx.dirty('reservations', reservation);
          }
          tx.dirty('salesOrderLines', line);
        }
        if (cancelled === 0)
          throw domainError('VALIDATION_FAILED', 'No open quantity remains to cancel');
        runtime.projections.recalculateOrder(order);
        order.notes = `${order.notes ? `${order.notes}\n` : ''}Remaining quantities cancelled: ${input.reason.trim()}`;
        closeIfEligible(tx, order);
        finalize(tx, 'salesOrders', order, 'order.remaining_cancelled', 'sales_order', ['lines']);
        tx.activityEvent({
          type: 'order.remaining_cancelled',
          subjectType: 'sales_order',
          subjectId: id,
          subjectLabel: order.orderNumber,
          customerId: order.customerId,
          orderId: id,
          summary: `Remaining quantities on ${order.orderNumber} cancelled — ${input.reason.trim()}`,
        });
        return getOrder(runtime, models, id);
      }),

    allocate: (
      id: string,
      input: { lineIds?: string[]; expectedAvailable?: Record<string, string> } = {},
      options?: MutationOptions,
    ): Promise<OrderDetail> =>
      runtime.command('POST /orders/:id/allocate', options, { id, input }, (tx) => {
        const order = load(runtime, 'salesOrders', id, 'Order');
        runtime.require('inventory.allocate', { warehouseId: order.defaultWarehouseId });
        if (order.status !== 'confirmed') throw transition('Order', order.status, 'be allocated');
        open(tx, 'salesOrders', id, 'Order', options);
        if (
          runtime.store.dataset.fixtures.get('edge.conflict.inventory_changed') === id &&
          runtime.fireConflictOnce(`allocate:${id}`)
        ) {
          throw new NexoraApiError(
            'INVENTORY_CHANGED',
            'Availability changed while the allocation was being prepared. Refresh the order and retry.',
          );
        }
        const result = allocateOrder(tx, order, input.lineIds, input.expectedAvailable);
        if (result.reserved === 0 && result.shortages.length > 0)
          throw domainError(
            'INSUFFICIENT_AVAILABILITY',
            'No available stock could be reserved for the requested lines',
            409,
            { shortages: result.shortages },
          );
        finalize(tx, 'salesOrders', order, 'order.allocated', 'sales_order', ['allocationStatus']);
        tx.activityEvent({
          type: 'order.allocated',
          subjectType: 'sales_order',
          subjectId: id,
          subjectLabel: order.orderNumber,
          customerId: order.customerId,
          orderId: id,
          summary: `${milliToQuantity(result.reserved)} unit(s) reserved for ${order.orderNumber}${result.shortages.length > 0 ? `; ${result.shortages.length} line(s) still short` : ''}`,
        });
        return getOrder(runtime, models, id);
      }),

    deallocate: (
      id: string,
      input: { lineIds?: string[] } = {},
      options?: MutationOptions,
    ): Promise<OrderDetail> =>
      runtime.command('POST /orders/:id/deallocate', options, { id, input }, (tx) => {
        const order = load(runtime, 'salesOrders', id, 'Order');
        runtime.require('inventory.deallocate', { warehouseId: order.defaultWarehouseId });
        open(tx, 'salesOrders', id, 'Order', options);
        let released = 0;
        for (const reservation of runtime.indexes.reservationsByOrder.get(id)) {
          if (reservation.status !== 'active') continue;
          if (input.lineIds && !input.lineIds.includes(reservation.orderLineId)) continue;
          const consumed = quantityToMilli(reservation.consumedQuantity);
          const remaining = quantityToMilli(reservation.quantity) - consumed;
          if (remaining <= 0) continue;
          tx.touch('reservations', reservation);
          if (consumed > 0) {
            reservation.quantity = reservation.consumedQuantity;
            reservation.status = 'consumed';
          } else reservation.status = 'released';
          tx.dirty('reservations', reservation);
          released += remaining;
        }
        if (released === 0)
          throw domainError(
            'RESERVATION_CONSUMED',
            'No unconsumed reservation quantity to release',
            409,
          );
        runtime.projections.recalculateOrder(order);
        finalize(tx, 'salesOrders', order, 'order.deallocated', 'sales_order', [
          'allocationStatus',
        ]);
        return getOrder(runtime, models, id);
      }),
  };

  /** Section 59.6 "Close": all quantities fulfilled or cancelled, invoiced and paid. */
  function closeIfEligible(tx: Transaction, order: SalesOrder): boolean {
    runtime.projections.recalculateOrder(order);
    const lines = runtime.indexes.linesByOrder.get(order.id);
    const allDone = lines.every((line) => openMilli(line) <= 0);
    const invoiced =
      order.invoiceStatus === 'invoiced' ||
      lines.every((line) => quantityToMilli(line.fulfilledQuantity) === 0);
    const paid =
      order.paymentStatus === 'paid' ||
      order.paymentStatus === 'refunded' ||
      (order.paymentStatus === 'not_invoiced' &&
        lines.every((line) => quantityToMilli(line.fulfilledQuantity) === 0));
    if (order.status === 'confirmed' && allDone && invoiced && paid) {
      tx.touch('salesOrders', order);
      order.status = 'closed';
      order.closedAt = tx.occurredAt;
      return true;
    }
    return false;
  }

  return {
    quotes,
    orders,
    services: { holdOrder, requestOrderApproval },
    hooks: { sales_order: orderHooks, quote: quoteHooks },
    closeIfEligible,
    allocateOrder,
    openMilli,
    shippingRegion: (customer: Customer) => shippingRegion(runtime, customer),
  };
}

export type SalesCommands = ReturnType<typeof createSalesCommands>;
export type { ApprovalRequest, Money };
