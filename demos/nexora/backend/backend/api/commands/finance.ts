import {
  NexoraApiError,
  compareDates,
  dueDateFor,
  milliToQuantity,
  priceLine,
  quantityToMilli,
  FX_RATES_TO_USD,
  money,
  usdMinor,
  writeOffAuthority,
  type CreditMemo,
  type Invoice,
  type InvoiceLine,
  type Payment,
  type PaymentAllocation,
  type PaymentMethod,
  type Refund,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import {
  bankTransactionListItem,
  getCreditMemo,
  getInvoice,
  getPayment,
  scoreCandidates,
  type BankTransactionListItem,
  type InvoiceDetail,
} from '../resources/finance';
import { createApprovalRequest, type ApprovalDecisionHooks } from './approvals';
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

const PAYMENT_METHODS: PaymentMethod[] = [
  'ach',
  'wire',
  'credit_card',
  'check',
  'pix',
  'boleto',
  'other',
];

export function createFinanceCommands(runtime: ApiRuntime, sales: SalesCommands) {
  const recalc = (tx: Transaction, invoice: Invoice): void => {
    runtime.projections.recalculateInvoice(invoice);
    tx.dirty('invoices', invoice);
  };

  const refreshOrder = (tx: Transaction, orderId: string | undefined): void => {
    if (!orderId) return;
    const order = runtime.store.dataset.salesOrders.get(orderId);
    if (!order) return;
    tx.touch('salesOrders', order);
    runtime.projections.recalculateOrder(order);
    sales.closeIfEligible(tx, order);
    tx.dirty('salesOrders', order);
  };

  // ---------------------------------------------------------------------------
  // Invoices (section 66)

  const invoices = {
    /** Section 66.4 — shipment-based invoicing of uninvoiced fulfilled quantities. */
    createFromOrder: (
      input: {
        orderId: string;
        lineIds?: string[];
        freightMinor?: number;
        billingContactId?: string;
        customerPoNumber?: string;
      },
      options?: MutationOptions,
    ): Promise<InvoiceDetail> =>
      runtime.command('POST /invoices', options, input, (tx) => {
        runtime.require('invoices.create');
        const order = load(runtime, 'salesOrders', input.orderId, 'Order');
        const customer = load(runtime, 'customers', order.customerId, 'Customer');
        const eligible = runtime.indexes.linesByOrder
          .get(order.id)
          .map((line) => ({
            line,
            milli: quantityToMilli(line.fulfilledQuantity) - quantityToMilli(line.invoicedQuantity),
          }))
          .filter(
            (entry) => entry.milli > 0 && (!input.lineIds || input.lineIds.includes(entry.line.id)),
          );
        if (eligible.length === 0)
          throw domainError(
            'OVER_INVOICING',
            `Order ${order.orderNumber} has no uninvoiced fulfilled quantity`,
            409,
          );
        const invoicedBefore = runtime.indexes.invoicesByOrder
          .get(order.id)
          .some((invoice) => invoice.lifecycle !== 'voided');
        const freight = input.freightMinor ?? (invoicedBefore ? 0 : order.freight.minor);
        const id = runtime.store.nextId('invoice');
        const today = runtime.store.today;
        const lines: InvoiceLine[] = eligible.map((entry, index) => {
          const quantity = milliToQuantity(entry.milli);
          const priced = priceLine({
            quantity,
            listUnitPrice: entry.line.listUnitPrice,
            discountBps: entry.line.discountBps,
            taxRateBps: entry.line.taxRateBps,
            unitCost: entry.line.unitCost,
          });
          return {
            id: runtime.store.nextId('invoiceLine'),
            organizationId: order.organizationId,
            invoiceId: id,
            lineNumber: index + 1,
            orderLineId: entry.line.id,
            skuId: entry.line.skuId,
            description: entry.line.description,
            quantity,
            unitPrice: entry.line.listUnitPrice,
            discountBps: entry.line.discountBps,
            taxRateBps: entry.line.taxRateBps,
            netAmount: priced.netAmount,
            taxAmount: priced.taxAmount,
            totalAmount: priced.totalAmount,
            unitCostSnapshot: entry.line.unitCost,
          };
        });
        const subtotal = lines.reduce((sum, line) => sum + line.netAmount.minor, 0);
        const tax = lines.reduce((sum, line) => sum + line.taxAmount.minor, 0);
        const cost = lines.reduce(
          (sum, line) =>
            sum +
            Math.round(
              ((line.unitCostSnapshot?.minor ?? 0) * quantityToMilli(line.quantity)) / 1000,
            ),
          0,
        );
        const cash = (minor: number) => money(minor, order.currency);
        const invoice: Invoice = {
          id,
          organizationId: order.organizationId,
          customerId: customer.id,
          sourceOrderId: order.id,
          issueDate: today,
          dueDate: dueDateFor(today, order.paymentTermsCode),
          currency: order.currency,
          fxRateToUsd: order.fxRateToUsd,
          lifecycle: 'draft',
          collectionState: 'current',
          settlement: 'unpaid',
          paidAmount: cash(0),
          outstanding: cash(subtotal + tax + freight),
          billingAddress: order.billingAddress,
          paymentTermsCode: order.paymentTermsCode,
          subtotal: cash(subtotal),
          taxTotal: cash(tax),
          freight: cash(freight),
          total: cash(subtotal + tax + freight),
          costTotal: cash(cost),
          writtenOffAmount: cash(0),
          metadata: metadata(tx, id),
          ...(input.billingContactId
            ? { billingContactId: input.billingContactId }
            : order.contactId
              ? { billingContactId: order.contactId }
              : {}),
          ...(trimmed(input.customerPoNumber)
            ? { customerPoNumber: trimmed(input.customerPoNumber) as string }
            : order.customerPoNumber
              ? { customerPoNumber: order.customerPoNumber }
              : {}),
        };
        tx.create('invoices', invoice);
        for (const line of lines) tx.create('invoiceLines', line);
        for (const entry of eligible) {
          tx.touch('salesOrderLines', entry.line).invoicedQuantity = milliToQuantity(
            quantityToMilli(entry.line.invoicedQuantity) + entry.milli,
          );
          tx.dirty('salesOrderLines', entry.line);
        }
        tx.audit('invoice.created', 'invoice', id, { nextVersion: 1 });
        refreshOrder(tx, order.id);
        return getInvoice(runtime, id);
      }),

    updateDraft: (
      id: string,
      input: {
        billingContactId?: string;
        customerPoNumber?: string;
        freightMinor?: number;
        dueDate?: string;
      },
      options?: MutationOptions,
    ): Promise<InvoiceDetail> =>
      runtime.command('PATCH /invoices/:id', options, { id, input }, (tx) => {
        runtime.require('invoices.edit_draft');
        const invoice = open(tx, 'invoices', id, 'Invoice', options);
        if (invoice.lifecycle !== 'draft')
          throw transition('Invoice', invoice.lifecycle, 'be edited');
        const changed: string[] = [];
        if (input.billingContactId) {
          invoice.billingContactId = input.billingContactId;
          changed.push('billingContactId');
        }
        if (input.customerPoNumber !== undefined) {
          invoice.customerPoNumber = trimmed(input.customerPoNumber) ?? '';
          changed.push('customerPoNumber');
        }
        if (input.dueDate) {
          if (compareDates(input.dueDate, invoice.issueDate) < 0)
            throw domainError('VALIDATION_FAILED', 'dueDate cannot precede the issue date');
          invoice.dueDate = input.dueDate;
          changed.push('dueDate');
        }
        if (input.freightMinor !== undefined) {
          invoice.freight = money(input.freightMinor, invoice.currency);
          invoice.total = money(
            invoice.subtotal.minor + invoice.taxTotal.minor + input.freightMinor,
            invoice.currency,
          );
          changed.push('freight');
        }
        recalc(tx, invoice);
        finalize(tx, 'invoices', invoice, 'invoice.updated', 'invoice', changed);
        return getInvoice(runtime, id);
      }),

    open: (id: string, options?: MutationOptions): Promise<InvoiceDetail> =>
      runtime.command('POST /invoices/:id/open', options, { id }, (tx) => {
        runtime.require('invoices.open');
        const invoice = open(tx, 'invoices', id, 'Invoice', options);
        if (invoice.lifecycle !== 'draft')
          throw transition('Invoice', invoice.lifecycle, 'be opened');
        if (runtime.indexes.invoiceLinesByInvoice.get(id).length === 0)
          throw domainError('VALIDATION_FAILED', 'An invoice needs at least one line');
        if (invoice.total.minor < 0)
          throw domainError('VALIDATION_FAILED', 'Invoice total cannot be negative');
        invoice.lifecycle = 'open';
        invoice.invoiceNumber = runtime.store.nextBusinessNumber('invoice');
        invoice.openedAt = tx.occurredAt;
        invoice.fxRateToUsd = FX_RATES_TO_USD[invoice.currency];
        recalc(tx, invoice);
        finalize(tx, 'invoices', invoice, 'invoice.opened', 'invoice', [
          'lifecycle',
          'invoiceNumber',
        ]);
        tx.activityEvent({
          type: 'invoice.opened',
          subjectType: 'invoice',
          subjectId: id,
          subjectLabel: invoice.invoiceNumber,
          customerId: invoice.customerId,
          orderId: invoice.sourceOrderId,
          summary: `Invoice ${invoice.invoiceNumber} opened for ${dollars(invoice.total)}`,
        });
        refreshOrder(tx, invoice.sourceOrderId);
        return getInvoice(runtime, id);
      }),

    send: (id: string, options?: MutationOptions): Promise<InvoiceDetail> =>
      runtime.command('POST /invoices/:id/send', options, { id }, (tx) => {
        runtime.require('invoices.send');
        const invoice = open(tx, 'invoices', id, 'Invoice', options);
        if (invoice.lifecycle !== 'open') throw transition('Invoice', invoice.lifecycle, 'be sent');
        invoice.sentAt = tx.occurredAt;
        finalize(tx, 'invoices', invoice, 'invoice.sent', 'invoice', ['sentAt']);
        return getInvoice(runtime, id);
      }),

    dispute: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<InvoiceDetail> =>
      runtime.command('POST /invoices/:id/dispute', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        runtime.require('invoices.edit_draft');
        const invoice = open(tx, 'invoices', id, 'Invoice', options);
        if (invoice.lifecycle !== 'open')
          throw transition('Invoice', invoice.lifecycle, 'be disputed');
        invoice.collectionState = 'disputed';
        invoice.disputeReason = input.reason.trim();
        finalize(tx, 'invoices', invoice, 'invoice.disputed', 'invoice', [
          'collectionState',
          'disputeReason',
        ]);
        tx.activityEvent({
          type: 'invoice.disputed',
          subjectType: 'invoice',
          subjectId: id,
          subjectLabel: invoice.invoiceNumber ?? id,
          customerId: invoice.customerId,
          orderId: invoice.sourceOrderId,
          summary: `Invoice ${invoice.invoiceNumber ?? ''} disputed — ${input.reason.trim()}`,
        });
        return getInvoice(runtime, id);
      }),

    resolveDispute: (id: string, options?: MutationOptions): Promise<InvoiceDetail> =>
      runtime.command('POST /invoices/:id/resolve-dispute', options, { id }, (tx) => {
        runtime.require('invoices.edit_draft');
        const invoice = open(tx, 'invoices', id, 'Invoice', options);
        if (invoice.collectionState !== 'disputed')
          throw transition('Invoice', invoice.collectionState, 'resolve a dispute');
        invoice.collectionState = 'current';
        delete invoice.disputeReason;
        recalc(tx, invoice);
        finalize(tx, 'invoices', invoice, 'invoice.dispute_resolved', 'invoice', [
          'collectionState',
        ]);
        return getInvoice(runtime, id);
      }),

    void: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<InvoiceDetail> =>
      runtime.command('POST /invoices/:id/void', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        runtime.require('invoices.void');
        const invoice = open(tx, 'invoices', id, 'Invoice', options);
        if (invoice.lifecycle !== 'open')
          throw transition('Invoice', invoice.lifecycle, 'be voided');
        const hasAllocations =
          runtime.indexes.allocationsByInvoice
            .get(id)
            .some((allocation) => allocation.status === 'active') ||
          runtime.indexes.applicationsByInvoice
            .get(id)
            .some((application) => application.status === 'active');
        if (hasAllocations)
          throw domainError(
            'INVOICE_HAS_ALLOCATIONS',
            'An invoice with posted payments or credit applications cannot be voided',
            409,
          );
        invoice.lifecycle = 'voided';
        invoice.voidedAt = tx.occurredAt;
        invoice.outstanding = money(0, invoice.currency);
        invoice.collectionState = 'current';
        for (const line of runtime.indexes.invoiceLinesByInvoice.get(id)) {
          const orderLine = line.orderLineId
            ? runtime.store.dataset.salesOrderLines.get(line.orderLineId)
            : undefined;
          if (orderLine) {
            tx.touch('salesOrderLines', orderLine).invoicedQuantity = milliToQuantity(
              Math.max(
                0,
                quantityToMilli(orderLine.invoicedQuantity) - quantityToMilli(line.quantity),
              ),
            );
            tx.dirty('salesOrderLines', orderLine);
          }
        }
        finalize(tx, 'invoices', invoice, 'invoice.voided', 'invoice', ['lifecycle'], {
          reason: input.reason.trim(),
        });
        refreshOrder(tx, invoice.sourceOrderId);
        return getInvoice(runtime, id);
      }),

    /** Section 66.5 — full remaining-balance write-off with authority thresholds. */
    writeOff: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<InvoiceDetail> =>
      runtime.command('POST /invoices/:id/write-off', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        runtime.require('invoices.write_off');
        const invoice = open(tx, 'invoices', id, 'Invoice', options);
        if (invoice.lifecycle !== 'open')
          throw transition('Invoice', invoice.lifecycle, 'be written off');
        if (invoice.outstanding.minor <= 0)
          throw new NexoraApiError(
            'INVOICE_ALREADY_PAID',
            `Invoice ${invoice.invoiceNumber ?? id} has no outstanding balance`,
          );
        // Section 66.5 states the thresholds as a USD equivalent: a balance in reais is measured in dollars.
        const outstandingUsd = usdMinor(invoice.outstanding, invoice.fxRateToUsd);
        const authority = writeOffAuthority(outstandingUsd);
        const actor = tx.actor;
        const isFinanceManager =
          runtime.authorization.hasRole(actor.id, 'finance_manager') ||
          runtime.authorization.hasRole(actor.id, 'administrator');
        if (authority === 'finance_manager' && !isFinanceManager)
          throw domainError(
            'WRITE_OFF_LIMIT_EXCEEDED',
            `Write-offs above US$500 require a Finance Manager`,
            403,
          );
        if (authority === 'approval_request') {
          if (!isFinanceManager)
            throw domainError(
              'WRITE_OFF_LIMIT_EXCEEDED',
              'Write-offs above US$5,000 are requested by a Finance Manager',
              403,
            );
          const existing = runtime.indexes.approvalsByTarget
            .get(id)
            .find(
              (request) =>
                request.targetType === 'invoice_write_off' && request.status === 'approved',
            );
          if (!existing) {
            const pending = runtime.indexes.approvalsByTarget
              .get(id)
              .find(
                (request) =>
                  request.targetType === 'invoice_write_off' && request.status === 'pending',
              );
            if (pending)
              throw domainError(
                'APPROVAL_REQUIRED',
                `Write-off approval ${pending.id} is still pending`,
                409,
              );
            createApprovalRequest(tx, {
              targetType: 'invoice_write_off',
              targetId: id,
              targetNumber: invoice.invoiceNumber ?? id,
              evaluation: {
                required: true,
                policyCode: 'invoice_write_off.v1',
                reasons: [
                  `write-off of ${dollars(invoice.outstanding)}${invoice.currency === 'USD' ? '' : ` (${dollars(outstandingUsd, 'USD')})`}: ${input.reason.trim()}`,
                ],
                steps: [
                  {
                    sequence: 1,
                    requiredRole: 'finance_manager',
                    reason: 'write-off above $5,000',
                  },
                ],
              },
              requestedBy: actor.id,
              amount: invoice.outstanding,
            });
            finalize(tx, 'invoices', invoice, 'invoice.write_off_requested', 'invoice', []);
            return getInvoice(runtime, id);
          }
        }
        invoice.writtenOffAmount = invoice.outstanding;
        invoice.lifecycle = 'written_off';
        invoice.writtenOffAt = tx.occurredAt;
        recalc(tx, invoice);
        invoice.collectionState = 'current';
        finalize(
          tx,
          'invoices',
          invoice,
          'invoice.written_off',
          'invoice',
          ['lifecycle', 'writtenOffAmount'],
          { reason: input.reason.trim() },
        );
        tx.activityEvent({
          type: 'invoice.written_off',
          subjectType: 'invoice',
          subjectId: id,
          subjectLabel: invoice.invoiceNumber ?? id,
          customerId: invoice.customerId,
          orderId: invoice.sourceOrderId,
          summary: `Invoice ${invoice.invoiceNumber ?? ''} written off (${dollars(invoice.writtenOffAmount)}) — ${input.reason.trim()}`,
        });
        refreshOrder(tx, invoice.sourceOrderId);
        return getInvoice(runtime, id);
      }),
  };

  const writeOffHooks: ApprovalDecisionHooks = {
    onApproved: (tx, request) => {
      const invoice = load(runtime, 'invoices', request.targetId, 'Invoice');
      if (invoice.lifecycle !== 'open' || invoice.outstanding.minor <= 0) return;
      tx.touch('invoices', invoice);
      invoice.writtenOffAmount = invoice.outstanding;
      invoice.lifecycle = 'written_off';
      invoice.writtenOffAt = tx.occurredAt;
      runtime.projections.recalculateInvoice(invoice);
      invoice.collectionState = 'current';
      finalize(tx, 'invoices', invoice, 'invoice.written_off', 'invoice', [
        'lifecycle',
        'writtenOffAmount',
      ]);
      refreshOrder(tx, invoice.sourceOrderId);
    },
    onRejected: () => undefined,
    onChangesRequested: () => undefined,
  };

  // ---------------------------------------------------------------------------
  // Payments (sections 66.7–66.10)

  const allocate = (
    tx: Transaction,
    payment: Payment,
    allocations: { invoiceId: string; amountMinor: number }[],
  ): void => {
    let allocated = runtime.indexes.allocationsByPayment
      .get(payment.id)
      .filter((allocation) => allocation.status === 'active')
      .reduce((sum, allocation) => sum + allocation.amount.minor, 0);
    for (const entry of allocations) {
      const invoice = load(runtime, 'invoices', entry.invoiceId, 'Invoice');
      if (invoice.customerId !== payment.customerId)
        throw domainError(
          'VALIDATION_FAILED',
          `Invoice ${invoice.invoiceNumber ?? invoice.id} belongs to a different customer`,
        );
      if (invoice.currency !== payment.amount.currency)
        throw domainError('CURRENCY_MISMATCH', 'Payment and invoice currencies differ');
      if (invoice.lifecycle !== 'open')
        throw transition('Invoice', invoice.lifecycle, 'receive an allocation');
      if (entry.amountMinor <= 0)
        throw domainError('VALIDATION_FAILED', 'Allocation amount must be positive');
      if (invoice.outstanding.minor <= 0)
        throw new NexoraApiError(
          'INVOICE_ALREADY_PAID',
          `Invoice ${invoice.invoiceNumber ?? invoice.id} is already paid`,
        );
      if (entry.amountMinor > invoice.outstanding.minor)
        throw domainError(
          'ALLOCATION_EXCEEDS_OUTSTANDING',
          `Allocation exceeds the ${dollars(invoice.outstanding)} outstanding on ${invoice.invoiceNumber ?? invoice.id}`,
          409,
        );
      if (allocated + entry.amountMinor > payment.amount.minor)
        throw domainError(
          'ALLOCATION_EXCEEDS_PAYMENT',
          'Allocations exceed the payment amount',
          409,
        );
      const allocation: PaymentAllocation = {
        id: runtime.store.nextId('paymentAllocation'),
        organizationId: payment.organizationId,
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount: money(entry.amountMinor, payment.amount.currency),
        status: 'active',
        createdAt: tx.occurredAt,
      };
      tx.create('paymentAllocations', allocation);
      allocated += entry.amountMinor;
      tx.touch('invoices', invoice);
      recalc(tx, invoice);
      finalize(tx, 'invoices', invoice, 'invoice.payment_applied', 'invoice', [
        'paidAmount',
        'outstanding',
        'settlement',
      ]);
      refreshOrder(tx, invoice.sourceOrderId);
    }
    payment.unappliedAmount = money(payment.amount.minor - allocated, payment.amount.currency);
  };

  const payments = {
    /** Section 66.9 — record and post a payment with optional allocations. */
    record: (
      input: {
        customerId: string;
        amountMinor: number;
        method: PaymentMethod;
        receivedDate?: string;
        reference?: string;
        allocations?: { invoiceId: string; amountMinor: number }[];
        sourceBankTransactionId?: string;
      },
      options?: MutationOptions,
    ) =>
      runtime.command('POST /payments', options, input, (tx) => {
        runtime.require('payments.record');
        const customer = load(runtime, 'customers', input.customerId, 'Customer');
        const validator = new Validator().oneOf('method', input.method, PAYMENT_METHODS);
        validator.check(
          Number.isInteger(input.amountMinor) && input.amountMinor > 0,
          'amountMinor',
          'INVALID_VALUE',
          'amountMinor must be a positive integer',
        );
        validator.throwIfAny();
        const id = runtime.store.nextId('payment');
        const payment: Payment = {
          id,
          organizationId: customer.organizationId,
          paymentNumber: runtime.store.nextBusinessNumber('payment'),
          customerId: customer.id,
          amount: money(input.amountMinor, customer.preferredCurrency),
          fxRateToUsd: FX_RATES_TO_USD[customer.preferredCurrency],
          method: input.method,
          receivedDate: input.receivedDate ?? runtime.store.today,
          status: 'posted',
          recordedBy: tx.actor.id,
          unappliedAmount: money(input.amountMinor, customer.preferredCurrency),
          metadata: metadata(tx, id),
          ...(trimmed(input.reference) ? { reference: trimmed(input.reference) as string } : {}),
          ...(input.sourceBankTransactionId
            ? { sourceBankTransactionId: input.sourceBankTransactionId }
            : {}),
        };
        tx.create('payments', payment);
        if (input.allocations && input.allocations.length > 0)
          allocate(tx, payment, input.allocations);
        tx.dirty('payments', payment);
        tx.audit('payment.recorded', 'payment', id, { nextVersion: 1 });
        tx.activityEvent({
          type: 'payment.recorded',
          subjectType: 'payment',
          subjectId: id,
          subjectLabel: payment.paymentNumber,
          customerId: customer.id,
          summary: `Payment ${payment.paymentNumber} of ${dollars(payment.amount)} recorded for ${customer.displayName}`,
        });
        return getPayment(runtime, id);
      }),

    allocate: (
      id: string,
      input: { allocations: { invoiceId: string; amountMinor: number }[] },
      options?: MutationOptions,
    ) =>
      runtime.command('POST /payments/:id/allocate', options, { id, input }, (tx) => {
        runtime.require('payments.record');
        const payment = open(tx, 'payments', id, 'Payment', options);
        if (payment.status !== 'posted')
          throw domainError(
            'PAYMENT_NOT_POSTED',
            `Payment ${payment.paymentNumber} is ${payment.status}`,
            409,
          );
        allocate(tx, payment, input.allocations);
        finalize(tx, 'payments', payment, 'payment.allocated', 'payment', ['unappliedAmount']);
        return getPayment(runtime, id);
      }),

    /** Section 66.10 — reversal reopens affected invoices. */
    reverse: (id: string, input: { reason: string }, options?: MutationOptions) =>
      runtime.command('POST /payments/:id/reverse', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        runtime.require('payments.reverse');
        const payment = open(tx, 'payments', id, 'Payment', options);
        if (payment.status !== 'posted') throw transition('Payment', payment.status, 'be reversed');
        for (const allocation of runtime.indexes.allocationsByPayment.get(id)) {
          if (allocation.status !== 'active') continue;
          tx.touch('paymentAllocations', allocation);
          allocation.status = 'reversed';
          allocation.reversedAt = tx.occurredAt;
          tx.dirty('paymentAllocations', allocation);
          const invoice = runtime.store.dataset.invoices.get(allocation.invoiceId);
          if (invoice) {
            tx.touch('invoices', invoice);
            recalc(tx, invoice);
            finalize(tx, 'invoices', invoice, 'invoice.payment_reversed', 'invoice', [
              'paidAmount',
              'outstanding',
              'settlement',
            ]);
            refreshOrder(tx, invoice.sourceOrderId);
          }
        }
        payment.status = 'reversed';
        payment.reversedAt = tx.occurredAt;
        payment.reversalReason = input.reason.trim();
        payment.unappliedAmount = money(0, payment.amount.currency);
        if (payment.sourceBankTransactionId) {
          const transaction = runtime.store.dataset.bankTransactions.get(
            payment.sourceBankTransactionId,
          );
          if (transaction) {
            tx.touch('bankTransactions', transaction);
            transaction.status = 'unmatched';
            delete transaction.matchedPaymentId;
            tx.dirty('bankTransactions', transaction);
          }
        }
        finalize(tx, 'payments', payment, 'payment.reversed', 'payment', ['status', 'reversedAt']);
        tx.activityEvent({
          type: 'payment.reversed',
          subjectType: 'payment',
          subjectId: id,
          subjectLabel: payment.paymentNumber,
          customerId: payment.customerId,
          summary: `Payment ${payment.paymentNumber} reversed — ${input.reason.trim()}`,
        });
        return getPayment(runtime, id);
      }),
  };

  // ---------------------------------------------------------------------------
  // Credit memos and refunds (sections 66.11–66.12)

  const creditMemos = {
    create: (
      input: {
        customerId: string;
        reason: CreditMemo['reason'];
        amountMinor: number;
        taxMinor?: number;
        description: string;
        sourceInvoiceId?: string;
      },
      options?: MutationOptions,
    ) =>
      runtime.command('POST /credit-memos', options, input, (tx) => {
        runtime.require('credit_memos.create');
        const customer = load(runtime, 'customers', input.customerId, 'Customer');
        new Validator()
          .required('description', input.description)
          .oneOf('reason', input.reason, [
            'return',
            'pricing_correction',
            'service_recovery',
            'manual_adjustment',
          ] as const)
          .check(
            Number.isInteger(input.amountMinor) && input.amountMinor > 0,
            'amountMinor',
            'INVALID_VALUE',
            'amountMinor must be positive',
          )
          .throwIfAny();
        const id = runtime.store.nextId('creditMemo');
        const tax = input.taxMinor ?? 0;
        const memo: CreditMemo = {
          id,
          organizationId: customer.organizationId,
          creditMemoNumber: runtime.store.nextBusinessNumber('creditMemo'),
          customerId: customer.id,
          reason: input.reason,
          issueDate: runtime.store.today,
          currency: customer.preferredCurrency,
          lifecycle: 'draft',
          subtotal: money(input.amountMinor, customer.preferredCurrency),
          taxTotal: money(tax, customer.preferredCurrency),
          total: money(input.amountMinor + tax, customer.preferredCurrency),
          appliedAmount: money(0, customer.preferredCurrency),
          unappliedAmount: money(input.amountMinor + tax, customer.preferredCurrency),
          metadata: metadata(tx, id),
          ...(input.sourceInvoiceId
            ? { sourceInvoiceId: load(runtime, 'invoices', input.sourceInvoiceId, 'Invoice').id }
            : {}),
        };
        tx.create('creditMemos', memo);
        tx.create('creditMemoLines', {
          id: runtime.store.nextId('creditMemoLine'),
          organizationId: customer.organizationId,
          creditMemoId: id,
          description: input.description.trim(),
          amount: money(input.amountMinor, customer.preferredCurrency),
          taxAmount: money(tax, customer.preferredCurrency),
        });
        tx.audit('credit_memo.created', 'credit_memo', id, { nextVersion: 1 });
        return getCreditMemo(runtime, id);
      }),

    open: (id: string, options?: MutationOptions) =>
      runtime.command('POST /credit-memos/:id/open', options, { id }, (tx) => {
        runtime.require('credit_memos.open');
        const memo = open(tx, 'creditMemos', id, 'Credit memo', options);
        if (memo.lifecycle !== 'draft')
          throw transition('Credit memo', memo.lifecycle, 'be opened');
        memo.lifecycle = 'open';
        finalize(tx, 'creditMemos', memo, 'credit_memo.opened', 'credit_memo', ['lifecycle']);
        tx.activityEvent({
          type: 'credit_memo.issued',
          subjectType: 'credit_memo',
          subjectId: id,
          subjectLabel: memo.creditMemoNumber,
          customerId: memo.customerId,
          summary: `Credit memo ${memo.creditMemoNumber} opened for ${dollars(memo.total)}`,
        });
        return getCreditMemo(runtime, id);
      }),

    apply: (
      id: string,
      input: { invoiceId: string; amountMinor?: number },
      options?: MutationOptions,
    ) =>
      runtime.command('POST /credit-memos/:id/apply', options, { id, input }, (tx) => {
        runtime.require('credit_memos.open');
        const memo = open(tx, 'creditMemos', id, 'Credit memo', options);
        if (memo.lifecycle !== 'open')
          throw transition('Credit memo', memo.lifecycle, 'be applied');
        const invoice = load(runtime, 'invoices', input.invoiceId, 'Invoice');
        if (invoice.customerId !== memo.customerId)
          throw domainError(
            'VALIDATION_FAILED',
            'Credit memos apply only to invoices of the same customer',
          );
        if (invoice.currency !== memo.currency)
          throw domainError('CURRENCY_MISMATCH', 'Credit memo and invoice currencies differ');
        if (invoice.lifecycle !== 'open' || invoice.outstanding.minor <= 0)
          throw new NexoraApiError(
            'INVOICE_ALREADY_PAID',
            `Invoice ${invoice.invoiceNumber ?? invoice.id} has no outstanding balance`,
          );
        const amount =
          input.amountMinor ?? Math.min(memo.unappliedAmount.minor, invoice.outstanding.minor);
        if (
          amount <= 0 ||
          amount > memo.unappliedAmount.minor ||
          amount > invoice.outstanding.minor
        )
          throw domainError(
            'CREDIT_EXCEEDED',
            'Application exceeds the unapplied credit or the invoice outstanding amount',
            409,
          );
        tx.create('creditMemoApplications', {
          id: runtime.store.nextId('creditMemoApplication'),
          organizationId: memo.organizationId,
          creditMemoId: id,
          invoiceId: invoice.id,
          amount: money(amount, memo.currency),
          status: 'active',
          createdAt: tx.occurredAt,
        });
        memo.appliedAmount = money(memo.appliedAmount.minor + amount, memo.currency);
        memo.unappliedAmount = money(memo.total.minor - memo.appliedAmount.minor, memo.currency);
        if (memo.unappliedAmount.minor === 0) memo.lifecycle = 'fully_applied';
        tx.touch('invoices', invoice);
        recalc(tx, invoice);
        finalize(tx, 'invoices', invoice, 'invoice.credit_applied', 'invoice', [
          'paidAmount',
          'outstanding',
        ]);
        refreshOrder(tx, invoice.sourceOrderId);
        finalize(tx, 'creditMemos', memo, 'credit_memo.applied', 'credit_memo', [
          'appliedAmount',
          'lifecycle',
        ]);
        return getCreditMemo(runtime, id);
      }),

    void: (id: string, options?: MutationOptions) =>
      runtime.command('POST /credit-memos/:id/void', options, { id }, (tx) => {
        runtime.require('credit_memos.open');
        const memo = open(tx, 'creditMemos', id, 'Credit memo', options);
        if (
          memo.lifecycle !== 'draft' &&
          !(memo.lifecycle === 'open' && memo.appliedAmount.minor === 0)
        )
          throw transition('Credit memo', memo.lifecycle, 'be voided');
        memo.lifecycle = 'voided';
        memo.unappliedAmount = money(0, memo.currency);
        finalize(tx, 'creditMemos', memo, 'credit_memo.voided', 'credit_memo', ['lifecycle']);
        return getCreditMemo(runtime, id);
      }),
  };

  const refunds = {
    create: (
      input: {
        customerId: string;
        creditMemoId?: string;
        paymentId?: string;
        amountMinor: number;
        method: PaymentMethod;
        reason: string;
      },
      options?: MutationOptions,
    ) =>
      runtime.command('POST /refunds', options, input, (tx) => {
        runtime.require('refunds.create');
        const customer = load(runtime, 'customers', input.customerId, 'Customer');
        new Validator()
          .required('reason', input.reason)
          .oneOf('method', input.method, PAYMENT_METHODS)
          .check(
            Number.isInteger(input.amountMinor) && input.amountMinor > 0,
            'amountMinor',
            'INVALID_VALUE',
            'amountMinor must be positive',
          )
          .throwIfAny();
        let available = 0;
        const memo = input.creditMemoId
          ? load(runtime, 'creditMemos', input.creditMemoId, 'Credit memo')
          : undefined;
        const payment = input.paymentId
          ? load(runtime, 'payments', input.paymentId, 'Payment')
          : undefined;
        if (memo) {
          if (memo.customerId !== customer.id || memo.lifecycle !== 'open')
            throw domainError('CREDIT_EXCEEDED', 'Credit memo is not open for this customer', 409);
          available += memo.unappliedAmount.minor;
        }
        if (payment) {
          if (payment.customerId !== customer.id || payment.status !== 'posted')
            throw domainError('PAYMENT_NOT_POSTED', 'Payment is not posted for this customer', 409);
          available += payment.unappliedAmount.minor;
        }
        if (!memo && !payment)
          throw domainError(
            'VALIDATION_FAILED',
            'A refund needs a credit memo or an unapplied payment as its source',
          );
        if (input.amountMinor > available)
          throw domainError(
            'CREDIT_EXCEEDED',
            `Refund exceeds the ${dollars(available, customer.preferredCurrency)} of available customer credit`,
            409,
          );
        const id = runtime.store.nextId('refund');
        const refund: Refund = {
          id,
          organizationId: customer.organizationId,
          refundNumber: runtime.store.nextBusinessNumber('refund'),
          customerId: customer.id,
          amount: money(input.amountMinor, customer.preferredCurrency),
          method: input.method,
          status: 'posted',
          reason: input.reason.trim(),
          postedAt: tx.occurredAt,
          metadata: metadata(tx, id),
          ...(memo ? { creditMemoId: memo.id } : {}),
          ...(payment ? { paymentId: payment.id } : {}),
        };
        tx.create('refunds', refund);
        let remaining = input.amountMinor;
        if (memo) {
          const fromMemo = Math.min(remaining, memo.unappliedAmount.minor);
          tx.touch('creditMemos', memo);
          memo.appliedAmount = money(memo.appliedAmount.minor + fromMemo, memo.currency);
          memo.unappliedAmount = money(memo.total.minor - memo.appliedAmount.minor, memo.currency);
          if (memo.unappliedAmount.minor === 0) memo.lifecycle = 'fully_applied';
          finalize(tx, 'creditMemos', memo, 'credit_memo.refunded', 'credit_memo', [
            'appliedAmount',
            'lifecycle',
          ]);
          remaining -= fromMemo;
        }
        if (payment && remaining > 0) {
          tx.touch('payments', payment);
          payment.unappliedAmount = money(
            payment.unappliedAmount.minor - remaining,
            payment.amount.currency,
          );
          finalize(tx, 'payments', payment, 'payment.refunded', 'payment', ['unappliedAmount']);
        }
        tx.audit('refund.created', 'refund', id, { nextVersion: 1 });
        tx.activityEvent({
          type: 'refund.posted',
          subjectType: 'refund',
          subjectId: id,
          subjectLabel: refund.refundNumber,
          customerId: customer.id,
          summary: `Refund ${refund.refundNumber} of ${dollars(refund.amount)} posted — ${refund.reason}`,
        });
        return refund;
      }),
  };

  // ---------------------------------------------------------------------------
  // Bank reconciliation (section 66.13)

  const bankTransactions = {
    match: (
      id: string,
      input: { paymentId?: string; invoiceId?: string; customerId?: string; allocate?: boolean },
      options?: MutationOptions,
    ): Promise<BankTransactionListItem> =>
      runtime.command('POST /bank-transactions/:id/match', options, { id, input }, (tx) => {
        runtime.require('reconciliation.manage');
        const transaction = open(tx, 'bankTransactions', id, 'Bank transaction', options);
        if (transaction.status === 'matched')
          throw transition('Bank transaction', transaction.status, 'be matched again');
        if (transaction.amount.minor <= 0)
          throw domainError('VALIDATION_FAILED', 'Only incoming cash can be matched to a payment');
        if (input.paymentId) {
          const payment = load(runtime, 'payments', input.paymentId, 'Payment');
          if (payment.status !== 'posted')
            throw domainError(
              'PAYMENT_NOT_POSTED',
              `Payment ${payment.paymentNumber} is ${payment.status}`,
              409,
            );
          if (payment.sourceBankTransactionId)
            throw domainError(
              'VALIDATION_FAILED',
              `Payment ${payment.paymentNumber} is already matched`,
            );
          if (
            payment.amount.minor !== transaction.amount.minor ||
            payment.amount.currency !== transaction.amount.currency
          )
            throw domainError('VALIDATION_FAILED', 'Payment amount differs from the bank amount');
          tx.touch('payments', payment).sourceBankTransactionId = id;
          finalize(tx, 'payments', payment, 'payment.matched', 'payment', [
            'sourceBankTransactionId',
          ]);
          transaction.matchedPaymentId = payment.id;
        } else {
          const invoice = input.invoiceId
            ? load(runtime, 'invoices', input.invoiceId, 'Invoice')
            : undefined;
          const customerId = input.customerId ?? invoice?.customerId;
          if (!customerId)
            throw domainError(
              'VALIDATION_FAILED',
              'A customer or invoice is required to create a payment from the bank transaction',
            );
          const customer = load(runtime, 'customers', customerId, 'Customer');
          const paymentId = runtime.store.nextId('payment');
          const payment: Payment = {
            id: paymentId,
            organizationId: customer.organizationId,
            paymentNumber: runtime.store.nextBusinessNumber('payment'),
            customerId: customer.id,
            amount: transaction.amount,
            fxRateToUsd: FX_RATES_TO_USD[transaction.amount.currency],
            method: transaction.description.includes('PIX')
              ? 'pix'
              : transaction.description.includes('BOLETO')
                ? 'boleto'
                : transaction.description.includes('WIRE') ||
                    transaction.description.includes('TED')
                  ? 'wire'
                  : transaction.description.includes('CHK') ||
                      transaction.description.includes('LOCKBOX')
                    ? 'check'
                    : 'ach',
            receivedDate: transaction.postedDate,
            status: 'posted',
            recordedBy: tx.actor.id,
            unappliedAmount: transaction.amount,
            sourceBankTransactionId: id,
            metadata: metadata(tx, paymentId),
            ...(transaction.reference ? { reference: transaction.reference } : {}),
          };
          tx.create('payments', payment);
          if (
            invoice &&
            input.allocate !== false &&
            invoice.lifecycle === 'open' &&
            invoice.outstanding.minor > 0
          ) {
            allocate(tx, payment, [
              {
                invoiceId: invoice.id,
                amountMinor: Math.min(invoice.outstanding.minor, payment.amount.minor),
              },
            ]);
            tx.dirty('payments', payment);
          }
          tx.audit('payment.recorded', 'payment', paymentId, { nextVersion: 1 });
          transaction.matchedPaymentId = paymentId;
        }
        transaction.status = 'matched';
        transaction.candidates = [];
        finalize(
          tx,
          'bankTransactions',
          transaction,
          'bank_transaction.matched',
          'bank_transaction',
          ['status', 'matchedPaymentId'],
        );
        return bankTransactionListItem(runtime, transaction, false);
      }),

    ignore: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<BankTransactionListItem> =>
      runtime.command('POST /bank-transactions/:id/ignore', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        runtime.require('reconciliation.manage');
        const transaction = open(tx, 'bankTransactions', id, 'Bank transaction', options);
        if (transaction.status === 'matched')
          throw transition('Bank transaction', transaction.status, 'be ignored');
        transaction.status = 'ignored';
        transaction.ignoreReason = input.reason.trim();
        transaction.candidates = [];
        finalize(
          tx,
          'bankTransactions',
          transaction,
          'bank_transaction.ignored',
          'bank_transaction',
          ['status', 'ignoreReason'],
        );
        return bankTransactionListItem(runtime, transaction, false);
      }),

    suggestions: (id: string) => {
      runtime.require('reconciliation.view');
      const transaction = load(runtime, 'bankTransactions', id, 'Bank transaction');
      return scoreCandidates(runtime, transaction);
    },
  };

  return {
    invoices,
    payments,
    creditMemos,
    refunds,
    bankTransactions,
    hooks: { invoice_write_off: writeOffHooks },
  };
}

export type FinanceCommands = ReturnType<typeof createFinanceCommands>;
