import {
  diffDays,
  money,
  notFound,
  usdMinor,
  type ApprovalRequest,
  type BankMatchCandidate,
  type BankTransaction,
  type CreditMemo,
  type CreditMemoApplication,
  type CreditMemoLine,
  type Customer,
  type FinanceOverview,
  type Invoice,
  type InvoiceLine,
  type Payment,
  type PaymentAllocation,
  type Refund,
} from '../../domain';
import {
  fields,
  runListQuery,
  type ListQuery,
  type ListResponse,
  type ResourceDefinition,
} from '../query';
import type { ApiRuntime } from '../runtime';

// ---------------------------------------------------------------------------
// Invoices

/**
 * A money field as the list compares it: in US dollars at the document's own
 * rate, or the seed table's where the document has none (section 53.7).
 */
function inUsd(value: import('../../domain').Money, fxRateToUsd?: string) {
  return money(usdMinor(value, fxRateToUsd), 'USD');
}

export interface InvoiceListItem extends Invoice {
  customerName: string;
  customerSegment: Customer['segment'];
  regionCode: Customer['regionCode'];
  orderNumber?: string;
  daysOverdue: number;
  lineCount: number;
  /** Composite label (section 66.2). */
  displayStatus:
    | 'Draft'
    | 'Open'
    | 'Partially Paid'
    | 'Paid'
    | 'Overdue'
    | 'Disputed'
    | 'Voided'
    | 'Written Off';
}

export function invoiceDisplayStatus(invoice: Invoice): InvoiceListItem['displayStatus'] {
  if (invoice.lifecycle === 'draft') return 'Draft';
  if (invoice.lifecycle === 'voided') return 'Voided';
  if (invoice.lifecycle === 'written_off') return 'Written Off';
  if (invoice.collectionState === 'disputed') return 'Disputed';
  if (invoice.settlement === 'paid') return 'Paid';
  if (invoice.collectionState === 'overdue') return 'Overdue';
  if (invoice.settlement === 'partially_paid') return 'Partially Paid';
  return 'Open';
}

export function invoiceListItem(runtime: ApiRuntime, invoice: Invoice): InvoiceListItem {
  const { dataset } = runtime.store;
  const order = invoice.sourceOrderId ? dataset.salesOrders.get(invoice.sourceOrderId) : undefined;
  const customer = dataset.customers.get(invoice.customerId);
  return {
    ...invoice,
    customerName: customer?.displayName ?? invoice.customerId,
    customerSegment: customer?.segment ?? 'smb',
    regionCode: customer?.regionCode ?? 'US',
    daysOverdue:
      invoice.lifecycle === 'open' && invoice.outstanding.minor > 0
        ? Math.max(0, diffDays(runtime.store.today, invoice.dueDate))
        : 0,
    lineCount: runtime.indexes.invoiceLinesByInvoice.get(invoice.id).length,
    displayStatus: invoiceDisplayStatus(invoice),
    ...(order ? { orderNumber: order.orderNumber } : {}),
  };
}

export const invoiceResource: ResourceDefinition<InvoiceListItem> = {
  fields: fields<InvoiceListItem>({
    id: ['string', (item) => item.id],
    invoiceNumber: ['string', (item) => item.invoiceNumber],
    customerId: ['string', (item) => item.customerId],
    customerName: ['string', (item) => item.customerName],
    customerSegment: ['enum', (item) => item.customerSegment],
    regionCode: ['enum', (item) => item.regionCode],
    sourceOrderId: ['string', (item) => item.sourceOrderId],
    orderNumber: ['string', (item) => item.orderNumber],
    currency: ['enum', (item) => item.currency],
    issueDate: ['date', (item) => item.issueDate],
    dueDate: ['date', (item) => item.dueDate],
    lifecycle: ['enum', (item) => item.lifecycle],
    settlement: ['enum', (item) => item.settlement],
    collectionState: ['enum', (item) => item.collectionState],
    displayStatus: ['enum', (item) => item.displayStatus],
    // Compared in US dollars, so an invoice in reais and one in dollars sort by what they are worth.
    total: ['money', (item) => inUsd(item.total, item.fxRateToUsd)],
    outstanding: ['money', (item) => inUsd(item.outstanding, item.fxRateToUsd)],
    paidAmount: ['money', (item) => inUsd(item.paidAmount, item.fxRateToUsd)],
    daysOverdue: ['number', (item) => item.daysOverdue],
    paymentTermsCode: ['enum', (item) => item.paymentTermsCode],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [
    item.invoiceNumber,
    item.customerName,
    item.orderNumber,
    item.customerPoNumber,
  ],
  defaultSort: '-issueDate,-invoiceNumber',
};

export function listInvoices(runtime: ApiRuntime, query: ListQuery): ListResponse<InvoiceListItem> {
  runtime.require('invoices.view');
  const items: InvoiceListItem[] = [];
  for (const invoice of runtime.store.dataset.invoices.values())
    items.push(invoiceListItem(runtime, invoice));
  return runListQuery(items, invoiceResource, query);
}

export interface InvoiceDetail {
  invoice: InvoiceListItem;
  lines: (InvoiceLine & { skuCode?: string })[];
  allocations: (PaymentAllocation & {
    paymentNumber: string;
    method: string;
    receivedDate: string;
  })[];
  creditApplications: (CreditMemoApplication & { creditMemoNumber: string })[];
  customer: { id: string; displayName: string; paymentTermsCode: string; health: string };
  /**
   * The latest write-off approval asked for on this invoice (sections 66.5 and 67): the one
   * still pending, or the last decided, so the record says what its write-off waits on.
   */
  approval?: ApprovalRequest;
}

export function getInvoice(runtime: ApiRuntime, id: string): InvoiceDetail {
  runtime.require('invoices.view');
  const { dataset } = runtime.store;
  const invoice = dataset.invoices.get(id);
  if (!invoice) throw notFound('Invoice', id);
  const customer = dataset.customers.get(invoice.customerId);
  if (!customer) throw notFound('Customer', invoice.customerId);
  const approval = runtime.indexes.approvalsByTarget
    .get(id)
    .filter((request) => request.targetType === 'invoice_write_off')
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
  return {
    ...(approval ? { approval } : {}),
    invoice: invoiceListItem(runtime, invoice),
    lines: runtime.indexes.invoiceLinesByInvoice
      .get(id)
      .slice()
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .map((line) => {
        const skuCode = line.skuId ? dataset.skus.get(line.skuId)?.sku : undefined;
        return { ...line, ...(skuCode ? { skuCode } : {}) };
      }),
    allocations: runtime.indexes.allocationsByInvoice.get(id).map((allocation) => {
      const payment = dataset.payments.get(allocation.paymentId);
      return {
        ...allocation,
        paymentNumber: payment?.paymentNumber ?? allocation.paymentId,
        method: payment?.method ?? 'other',
        receivedDate: payment?.receivedDate ?? allocation.createdAt.slice(0, 10),
      };
    }),
    creditApplications: runtime.indexes.applicationsByInvoice.get(id).map((application) => ({
      ...application,
      creditMemoNumber:
        dataset.creditMemos.get(application.creditMemoId)?.creditMemoNumber ??
        application.creditMemoId,
    })),
    customer: {
      id: customer.id,
      displayName: customer.displayName,
      paymentTermsCode: customer.paymentTermsCode,
      health: customer.health,
    },
  };
}

// ---------------------------------------------------------------------------
// Payments

export interface PaymentListItem extends Payment {
  customerName: string;
  customerSegment: Customer['segment'];
  regionCode: Customer['regionCode'];
  allocatedAmount: Payment['amount'];
  invoiceNumbers: string[];
}

export function paymentListItem(runtime: ApiRuntime, payment: Payment): PaymentListItem {
  const { dataset } = runtime.store;
  const allocations = runtime.indexes.allocationsByPayment
    .get(payment.id)
    .filter((allocation) => allocation.status === 'active');
  const customer = dataset.customers.get(payment.customerId);
  return {
    ...payment,
    customerName: customer?.displayName ?? payment.customerId,
    customerSegment: customer?.segment ?? 'smb',
    regionCode: customer?.regionCode ?? 'US',
    allocatedAmount: {
      currency: payment.amount.currency,
      minor: allocations.reduce((sum, allocation) => sum + allocation.amount.minor, 0),
    },
    invoiceNumbers: allocations.map(
      (allocation) =>
        dataset.invoices.get(allocation.invoiceId)?.invoiceNumber ?? allocation.invoiceId,
    ),
  };
}

export const paymentResource: ResourceDefinition<PaymentListItem> = {
  fields: fields<PaymentListItem>({
    id: ['string', (item) => item.id],
    paymentNumber: ['string', (item) => item.paymentNumber],
    customerId: ['string', (item) => item.customerId],
    customerName: ['string', (item) => item.customerName],
    customerSegment: ['enum', (item) => item.customerSegment],
    regionCode: ['enum', (item) => item.regionCode],
    method: ['enum', (item) => item.method],
    currency: ['enum', (item) => item.amount.currency],
    status: ['enum', (item) => item.status],
    receivedDate: ['date', (item) => item.receivedDate],
    amount: ['money', (item) => inUsd(item.amount, item.fxRateToUsd)],
    unappliedAmount: ['money', (item) => inUsd(item.unappliedAmount, item.fxRateToUsd)],
    reference: ['string', (item) => item.reference],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.paymentNumber, item.customerName, item.reference, ...item.invoiceNumbers],
  defaultSort: '-receivedDate',
};

export function listPayments(runtime: ApiRuntime, query: ListQuery): ListResponse<PaymentListItem> {
  runtime.require('payments.view');
  const items: PaymentListItem[] = [];
  for (const payment of runtime.store.dataset.payments.values())
    items.push(paymentListItem(runtime, payment));
  return runListQuery(items, paymentResource, query);
}

export function getPayment(
  runtime: ApiRuntime,
  id: string,
): {
  payment: PaymentListItem;
  allocations: (PaymentAllocation & { invoiceNumber?: string; invoiceTotal?: Payment['amount'] })[];
  bankTransaction?: BankTransaction;
} {
  runtime.require('payments.view');
  const { dataset } = runtime.store;
  const payment = dataset.payments.get(id);
  if (!payment) throw notFound('Payment', id);
  const bank = payment.sourceBankTransactionId
    ? dataset.bankTransactions.get(payment.sourceBankTransactionId)
    : undefined;
  return {
    payment: paymentListItem(runtime, payment),
    allocations: runtime.indexes.allocationsByPayment.get(id).map((allocation) => {
      const invoice = dataset.invoices.get(allocation.invoiceId);
      return {
        ...allocation,
        ...(invoice?.invoiceNumber ? { invoiceNumber: invoice.invoiceNumber } : {}),
        ...(invoice ? { invoiceTotal: invoice.total } : {}),
      };
    }),
    ...(bank ? { bankTransaction: bank } : {}),
  };
}

// ---------------------------------------------------------------------------
// Credit memos and refunds

export interface CreditMemoListItem extends CreditMemo {
  customerName: string;
  customerSegment: Customer['segment'];
  regionCode: Customer['regionCode'];
  sourceInvoiceNumber?: string;
  sourceReturnNumber?: string;
}

export function creditMemoListItem(runtime: ApiRuntime, memo: CreditMemo): CreditMemoListItem {
  const { dataset } = runtime.store;
  const invoice = memo.sourceInvoiceId ? dataset.invoices.get(memo.sourceInvoiceId) : undefined;
  const ret = memo.sourceReturnId ? dataset.returns.get(memo.sourceReturnId) : undefined;
  const customer = dataset.customers.get(memo.customerId);
  return {
    ...memo,
    customerName: customer?.displayName ?? memo.customerId,
    customerSegment: customer?.segment ?? 'smb',
    regionCode: customer?.regionCode ?? 'US',
    ...(invoice?.invoiceNumber ? { sourceInvoiceNumber: invoice.invoiceNumber } : {}),
    ...(ret ? { sourceReturnNumber: ret.returnNumber } : {}),
  };
}

export const creditMemoResource: ResourceDefinition<CreditMemoListItem> = {
  fields: fields<CreditMemoListItem>({
    id: ['string', (item) => item.id],
    creditMemoNumber: ['string', (item) => item.creditMemoNumber],
    customerId: ['string', (item) => item.customerId],
    customerName: ['string', (item) => item.customerName],
    customerSegment: ['enum', (item) => item.customerSegment],
    regionCode: ['enum', (item) => item.regionCode],
    reason: ['enum', (item) => item.reason],
    lifecycle: ['enum', (item) => item.lifecycle],
    issueDate: ['date', (item) => item.issueDate],
    total: ['money', (item) => inUsd(item.total)],
    unappliedAmount: ['money', (item) => inUsd(item.unappliedAmount)],
  }),
  search: (item) => [
    item.creditMemoNumber,
    item.customerName,
    item.sourceInvoiceNumber,
    item.sourceReturnNumber,
  ],
  defaultSort: '-issueDate',
};

export function listCreditMemos(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<CreditMemoListItem> {
  runtime.require('credit_memos.view');
  const items: CreditMemoListItem[] = [];
  for (const memo of runtime.store.dataset.creditMemos.values())
    items.push(creditMemoListItem(runtime, memo));
  return runListQuery(items, creditMemoResource, query);
}

export function getCreditMemo(
  runtime: ApiRuntime,
  id: string,
): {
  creditMemo: CreditMemoListItem;
  lines: CreditMemoLine[];
  applications: (CreditMemoApplication & { invoiceNumber?: string })[];
  refunds: Refund[];
} {
  runtime.require('credit_memos.view');
  const { dataset } = runtime.store;
  const memo = dataset.creditMemos.get(id);
  if (!memo) throw notFound('Credit memo', id);
  return {
    creditMemo: creditMemoListItem(runtime, memo),
    lines: runtime.indexes.creditMemoLinesByMemo.get(id),
    applications: runtime.indexes.applicationsByMemo.get(id).map((application) => {
      const invoiceNumber = dataset.invoices.get(application.invoiceId)?.invoiceNumber;
      return { ...application, ...(invoiceNumber ? { invoiceNumber } : {}) };
    }),
    refunds: [...dataset.refunds.values()].filter((refund) => refund.creditMemoId === id),
  };
}

// ---------------------------------------------------------------------------
// Bank reconciliation (section 66.13)

export interface BankTransactionListItem extends BankTransaction {
  matchedPaymentNumber?: string;
  bestCandidate?: BankMatchCandidate;
}

function normalizeReference(value: string | undefined): string {
  return (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Deterministic match scoring from section 66.13. */
export interface CandidatePools {
  payments: import('../../domain').Payment[];
  invoices: Invoice[];
}

/** Candidate pools shared across a page of transactions. */
export function candidatePools(runtime: ApiRuntime): CandidatePools {
  const { dataset } = runtime.store;
  const payments: import('../../domain').Payment[] = [];
  for (const payment of dataset.payments.values())
    if (payment.status === 'posted' && !payment.sourceBankTransactionId) payments.push(payment);
  const invoices: Invoice[] = [];
  for (const invoice of dataset.invoices.values())
    if (invoice.lifecycle === 'open' && invoice.outstanding.minor > 0) invoices.push(invoice);
  return { payments, invoices };
}

export function scoreCandidates(
  runtime: ApiRuntime,
  transaction: BankTransaction,
  pools: CandidatePools = candidatePools(runtime),
): BankMatchCandidate[] {
  const { dataset } = runtime.store;
  if (transaction.amount.minor <= 0) return [];
  const candidates: BankMatchCandidate[] = [];
  const description = transaction.description.toUpperCase();
  const reference = normalizeReference(transaction.reference);
  const consider = (
    customerId: string,
    amountMinor: number,
    refs: string[],
    numbers: string[],
    date: string,
    paymentId?: string,
    invoiceId?: string,
  ): void => {
    let score = 0;
    const reasons: string[] = [];
    if (amountMinor === transaction.amount.minor) {
      score += 60;
      reasons.push('Exact amount match');
    }
    if (reference && refs.some((ref) => normalizeReference(ref) === reference)) {
      score += 25;
      reasons.push('Bank reference matches');
    }
    const customer = dataset.customers.get(customerId);
    const tokens = (customer?.displayName ?? '')
      .toUpperCase()
      .split(/\s+/)
      .filter((token) => token.length >= 4);
    if (tokens.some((token) => description.includes(token))) {
      score += 10;
      reasons.push('Description contains customer name');
    }
    if (numbers.some((number) => number && description.includes(number.toUpperCase()))) {
      score += 15;
      reasons.push('Description contains document number');
    }
    const days = Math.abs(diffDays(transaction.postedDate, date));
    if (days <= 2) {
      score += 10;
      reasons.push('Posted within 2 days');
    } else if (days <= 7) {
      score += 5;
      reasons.push('Posted within 7 days');
    }
    score = Math.min(100, score);
    if (score < 40) return;
    candidates.push({
      customerId,
      score,
      confidence: score >= 85 ? 'high' : score >= 60 ? 'medium' : 'low',
      reasons,
      ...(paymentId ? { paymentId } : {}),
      ...(invoiceId ? { invoiceId } : {}),
    });
  };
  for (const payment of pools.payments) {
    if (payment.amount.currency !== transaction.amount.currency) continue;
    if (Math.abs(diffDays(transaction.postedDate, payment.receivedDate)) > 14) continue;
    consider(
      payment.customerId,
      payment.amount.minor,
      [payment.reference ?? ''],
      [payment.paymentNumber],
      payment.receivedDate,
      payment.id,
    );
  }
  for (const invoice of pools.invoices) {
    if (invoice.currency !== transaction.amount.currency) continue;
    if (Math.abs(diffDays(transaction.postedDate, invoice.dueDate)) > 60) continue;
    if (
      invoice.outstanding.minor !== transaction.amount.minor &&
      !description.includes((invoice.invoiceNumber ?? '').toUpperCase()) &&
      !(reference && normalizeReference(invoice.invoiceNumber) === reference)
    ) {
      // Cheap pre-filter: only amount, number or reference matches can reach the 40-point floor.
      const customer = dataset.customers.get(invoice.customerId);
      const tokens = (customer?.displayName ?? '')
        .toUpperCase()
        .split(/\s+/)
        .filter((token) => token.length >= 4);
      if (!tokens.some((token) => description.includes(token))) continue;
    }
    consider(
      invoice.customerId,
      invoice.outstanding.minor,
      [invoice.invoiceNumber ?? '', invoice.customerPoNumber ?? ''],
      [invoice.invoiceNumber ?? ''],
      invoice.dueDate,
      undefined,
      invoice.id,
    );
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function bankTransactionListItem(
  runtime: ApiRuntime,
  transaction: BankTransaction,
  withCandidates = false,
  pools?: CandidatePools,
): BankTransactionListItem {
  const { dataset } = runtime.store;
  const payment = transaction.matchedPaymentId
    ? dataset.payments.get(transaction.matchedPaymentId)
    : undefined;
  const candidates =
    withCandidates && transaction.status !== 'matched' && transaction.status !== 'ignored'
      ? scoreCandidates(runtime, transaction, pools)
      : transaction.candidates;
  return {
    ...transaction,
    candidates,
    ...(payment ? { matchedPaymentNumber: payment.paymentNumber } : {}),
    ...(candidates[0] ? { bestCandidate: candidates[0] } : {}),
  };
}

export const bankTransactionResource: ResourceDefinition<BankTransactionListItem> = {
  fields: fields<BankTransactionListItem>({
    id: ['string', (item) => item.id],
    postedDate: ['date', (item) => item.postedDate],
    description: ['string', (item) => item.description],
    reference: ['string', (item) => item.reference],
    amount: ['money', (item) => inUsd(item.amount)],
    status: ['enum', (item) => item.status],
    matchedPaymentId: ['string', (item) => item.matchedPaymentId],
    confidence: ['enum', (item) => item.bestCandidate?.confidence],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
  }),
  search: (item) => [item.description, item.reference, item.matchedPaymentNumber],
  defaultSort: '-postedDate',
};

export function listBankTransactions(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<BankTransactionListItem> {
  runtime.require('reconciliation.view');
  const pools = candidatePools(runtime);
  // The confidence is the best candidate's, which is scored on read (section 66.13) and never
  // stored: a query that filters or sorts by it scores every transaction still to reconcile
  // first, and any other query scores the page it returns.
  const byConfidence =
    query.filter?.['confidence'] !== undefined || (query.sort ?? '').includes('confidence');
  const items: BankTransactionListItem[] = [];
  for (const transaction of runtime.store.dataset.bankTransactions.values())
    items.push(bankTransactionListItem(runtime, transaction, byConfidence, pools));
  const response = runListQuery(items, bankTransactionResource, query);
  if (!byConfidence)
    response.data = response.data.map((item) =>
      bankTransactionListItem(runtime, item, true, pools),
    );
  return response;
}

export function getBankTransaction(runtime: ApiRuntime, id: string): BankTransactionListItem {
  runtime.require('reconciliation.view');
  const transaction = runtime.store.dataset.bankTransactions.get(id);
  if (!transaction) throw notFound('Bank transaction', id);
  return bankTransactionListItem(runtime, transaction, true);
}

export function financeOverview(runtime: ApiRuntime): FinanceOverview {
  runtime.require('finance.dashboard');
  return runtime.projections.financeOverview();
}

export function listRefunds(runtime: ApiRuntime): (Refund & { customerName: string })[] {
  runtime.require('credit_memos.view');
  return [...runtime.store.dataset.refunds.values()].map((refund) => ({
    ...refund,
    customerName:
      runtime.store.dataset.customers.get(refund.customerId)?.displayName ?? refund.customerId,
  }));
}
