import {
  FX_RATES_TO_USD,
  ORGANIZATION_ID,
  addDays,
  addMs,
  businessDateOf,
  compareDates,
  diffDays,
  formatBusinessNumber,
  formatId,
  money,
  roundHalfUp,
  type BankTransaction,
  type CreditMemo,
  type Customer,
  type Invoice,
  type Payment,
  type Refund,
} from '../../domain';
import type { SeedContext } from './context';
import { instantOn, metadataAt, nextBusinessDayOnOrAfter } from './orders';
import type { TenantSeedResult } from './tenant';

export interface FinanceSeedResult {
  bankTransactionCount: number;
}

function bankDescription(
  random: ReturnType<SeedContext['random']>,
  customer: Customer,
  payment: Payment,
): string {
  const name = customer.legalName.toUpperCase().replace(/[.,]/g, '').slice(0, 22);
  switch (payment.method) {
    case 'ach':
      return `ACH CREDIT ${name} ${random.chance(0.7) ? `REF ${payment.reference ?? ''}` : `ID ${random.digits(9)}`}`.trim();
    case 'wire':
      return `FED WIRE IN ${name} OBI ${random.chance(0.6) ? (payment.reference ?? '') : `INV PAYMENT ${random.digits(6)}`}`.trim();
    case 'credit_card':
      return `MERCHANT DEPOSIT BATCH ${random.digits(6)}`;
    case 'check':
      return `LOCKBOX DEPOSIT CHK ${random.digits(5)} ${name}`;
    case 'pix':
      // language: pt-BR
      return `PIX RECEBIDO ${name} E2E${random.digits(12)}`;
    // language: en-US
    case 'boleto':
      return `LIQ BOLETO ${name} NN ${random.digits(11)}`;
    default:
      return `DEPOSIT ${name}`;
  }
}

export function seedFinance(context: SeedContext, tenant: TenantSeedResult): FinanceSeedResult {
  const { dataset, today, operationalStart, now } = context;
  const random = context.random('finance');
  const financeActors = [...dataset.roleAssignments.values()]
    .filter(
      (assignment) =>
        (assignment.roleId === tenant.roleIdsByKey.get('accountant') ||
          assignment.roleId === tenant.roleIdsByKey.get('finance_manager')) &&
        dataset.users.get(assignment.userId)?.status === 'active',
    )
    .map((assignment) => assignment.userId);
  if (financeActors.length === 0)
    financeActors.push(tenant.personaUserIds.get('priya-shah') as string);

  // Bank transactions mirror posted payments; the newest few days stay unmatched.
  let bankCounter = 0;
  const addBank = (
    transaction: Omit<BankTransaction, 'id' | 'organizationId' | 'candidates' | 'metadata'> & {
      createdAt: string;
    },
  ): BankTransaction => {
    bankCounter += 1;
    const { createdAt, ...rest } = transaction;
    const record: BankTransaction = {
      id: formatId('bankTransaction', bankCounter),
      organizationId: ORGANIZATION_ID,
      candidates: [],
      metadata: metadataAt(createdAt, 'usr_system', createdAt, 'usr_system', 1),
      ...rest,
    };
    dataset.bankTransactions.set(record.id, record);
    return record;
  };

  const payments = [...dataset.payments.values()]
    .filter((payment) => payment.status === 'posted')
    .sort((a, b) => a.receivedDate.localeCompare(b.receivedDate));
  for (const payment of payments) {
    if (payment.method === 'credit_card' && random.chance(0.5)) continue; // Card deposits arrive batched.
    const customer = dataset.customers.get(payment.customerId) as Customer;
    const postedDate = nextBusinessDayOnOrAfter(addDays(payment.receivedDate, random.int(0, 2)));
    if (compareDates(postedDate, today) > 0) continue;
    const recent = diffDays(today, postedDate) <= 4;
    const matched = !recent || random.chance(0.35);
    const record = addBank({
      postedDate,
      description: bankDescription(random, customer, payment),
      amount: payment.amount,
      status: matched ? 'matched' : random.chance(0.75) ? 'suggested' : 'needs_review',
      createdAt: instantOn(postedDate, random, 6, 8),
      ...(random.chance(0.6) && payment.reference ? { reference: payment.reference } : {}),
      ...(matched ? { matchedPaymentId: payment.id } : {}),
    });
    if (matched) {
      record.metadata.version = 2;
      record.metadata.updatedAt = addMs(record.metadata.createdAt, random.int(1, 30) * 3_600_000);
      record.metadata.updatedBy = random.pick(financeActors);
      payment.sourceBankTransactionId = record.id;
    }
  }

  // Unmatched deposits without a recorded payment (customer paid, AR not posted yet) and noise.
  const openInvoices = [...dataset.invoices.values()].filter(
    (invoice) => invoice.lifecycle === 'open' && invoice.outstanding.minor > 0,
  );
  const unmatchedCount = Math.max(3, Math.round(payments.length * 0.03));
  for (let index = 0; index < unmatchedCount && openInvoices.length > 0; index += 1) {
    const invoice = random.pick(openInvoices);
    const customer = dataset.customers.get(invoice.customerId) as Customer;
    const postedDate = nextBusinessDayOnOrAfter(addDays(today, -random.int(0, 12)));
    const exact = random.chance(0.7);
    const prefixes =
      customer.regionCode === 'BR'
        ? // language: pt-BR
          ['PIX RECEBIDO', 'TED RECEBIDA', 'LIQ BOLETO']
        : // language: en-US
          ['ACH CREDIT', 'FED WIRE IN', 'LOCKBOX DEPOSIT'];
    addBank({
      postedDate,
      description: `${random.pick(prefixes)} ${customer.legalName.toUpperCase().replace(/[.,]/g, '').slice(0, 22)}${random.chance(0.5) ? ` ${invoice.invoiceNumber ?? ''}` : ''}`,
      amount: money(
        exact
          ? invoice.outstanding.minor
          : roundHalfUp(invoice.outstanding.minor * random.float(0.4, 1.1)),
        invoice.currency,
      ),
      status: exact ? 'suggested' : 'needs_review',
      createdAt: instantOn(postedDate, random, 6, 8),
      ...(random.chance(0.4) && invoice.invoiceNumber ? { reference: invoice.invoiceNumber } : {}),
    });
  }
  for (let index = 0; index < 8; index += 1) {
    const postedDate = nextBusinessDayOnOrAfter(addDays(today, -random.int(0, 40)));
    addBank({
      postedDate,
      description: random.pick([
        'MONTHLY SERVICE FEE',
        'WIRE FEE OUTGOING',
        'MERCHANT PROCESSING FEE',
        'ANALYSIS CHARGE',
      ]),
      amount: money(-roundHalfUp(random.float(15, 240) * 100), 'USD'),
      status: 'ignored',
      ignoreReason: 'Bank fee — not a customer receipt',
      createdAt: instantOn(postedDate, random, 6, 8),
    });
  }

  // Unapplied payments (prepayments / overpayments).
  const activeCustomers = [...dataset.customers.values()].filter(
    (customer) => customer.status === 'active',
  );
  let paymentCounter = dataset.payments.size + 10_000;
  const unappliedCount = Math.max(2, Math.round(payments.length * 0.012));
  let maxPaymentSequence = 0;
  for (const payment of dataset.payments.values())
    maxPaymentSequence = Math.max(maxPaymentSequence, Number(payment.paymentNumber.slice(4)) || 0);
  for (let index = 0; index < unappliedCount; index += 1) {
    const customer = random.pick(activeCustomers);
    const currency = customer.preferredCurrency;
    const receivedDate = nextBusinessDayOnOrAfter(addDays(today, -random.int(1, 60)));
    const amount =
      roundHalfUp(random.logNormal(2_400, 0.8) / Number(FX_RATES_TO_USD[currency])) * 100;
    const postedAt = instantOn(receivedDate, random, 8, 16);
    paymentCounter += 1;
    const recordedBy = random.pick(financeActors);
    const payment: Payment = {
      id: formatId('payment', paymentCounter),
      organizationId: ORGANIZATION_ID,
      paymentNumber: formatBusinessNumber('payment', maxPaymentSequence + index + 1),
      customerId: customer.id,
      amount: money(amount, currency),
      fxRateToUsd: FX_RATES_TO_USD[currency],
      method:
        customer.regionCode === 'BR'
          ? random.pick(['pix', 'boleto', 'wire'])
          : random.pick(['ach', 'wire', 'check']),
      receivedDate,
      reference: `${customer.regionCode === 'BR' ? random.pick(['PIX', 'BOL', 'TED']) : random.pick(['ACH', 'WIRE', 'CHK'])}-${random.digits(8)}`,
      status: 'posted',
      recordedBy,
      unappliedAmount: money(amount, currency),
      metadata: metadataAt(postedAt, recordedBy, postedAt, recordedBy, 2),
    };
    dataset.payments.set(payment.id, payment);
    if (index === 0) dataset.fixtures.set('edge.payment.unapplied', payment.id);
  }

  // Write-offs on old small balances (section 66.5, full remaining balance only).
  const writeOffCandidates = [...dataset.invoices.values()].filter(
    (invoice) =>
      invoice.lifecycle === 'open' &&
      invoice.outstanding.minor > 0 &&
      invoice.outstanding.minor < 50_000 &&
      diffDays(today, invoice.dueDate) > 75,
  );
  for (const invoice of random.sample(
    writeOffCandidates,
    Math.min(writeOffCandidates.length, 12),
  )) {
    const writtenOffAt = instantOn(
      nextBusinessDayOnOrAfter(addDays(today, -random.int(1, 30))),
      random,
    );
    invoice.writtenOffAmount = invoice.outstanding;
    invoice.outstanding = money(0, invoice.currency);
    invoice.lifecycle = 'written_off';
    invoice.collectionState = 'current';
    invoice.writtenOffAt = writtenOffAt;
    invoice.metadata.updatedAt = writtenOffAt;
    invoice.metadata.updatedBy = random.pick(financeActors);
    invoice.metadata.version += 1;
  }

  // Manual credit memos (pricing corrections and service recovery).
  const creditCandidates = [...dataset.invoices.values()].filter(
    (invoice) => invoice.lifecycle === 'open' && diffDays(today, invoice.issueDate) < 90,
  );
  let maxCreditSequence = 0;
  for (const memo of dataset.creditMemos.values())
    maxCreditSequence = Math.max(maxCreditSequence, Number(memo.creditMemoNumber.slice(3)) || 0);
  let creditCounter = dataset.creditMemos.size + 10_000;
  for (const [index, invoice] of random
    .sample(creditCandidates, Math.min(creditCandidates.length, 24))
    .entries()) {
    const issueDate = nextBusinessDayOnOrAfter(addDays(invoice.issueDate, random.int(2, 20)));
    if (compareDates(issueDate, today) > 0) continue;
    const issuedAt = instantOn(issueDate, random);
    const amount = Math.min(
      invoice.total.minor,
      roundHalfUp(invoice.subtotal.minor * random.float(0.03, 0.2)),
    );
    const tax = roundHalfUp(
      amount * (invoice.subtotal.minor > 0 ? invoice.taxTotal.minor / invoice.subtotal.minor : 0),
    );
    const total = amount + tax;
    const applied = invoice.outstanding.minor > 0 ? Math.min(total, invoice.outstanding.minor) : 0;
    creditCounter += 1;
    const actor = random.pick(financeActors);
    const memo: CreditMemo = {
      id: formatId('creditMemo', creditCounter),
      organizationId: ORGANIZATION_ID,
      creditMemoNumber: formatBusinessNumber('creditMemo', maxCreditSequence + index + 1),
      customerId: invoice.customerId,
      sourceInvoiceId: invoice.id,
      reason: random.pick(['pricing_correction', 'service_recovery', 'manual_adjustment']),
      issueDate,
      currency: invoice.currency,
      lifecycle: applied >= total ? 'fully_applied' : 'open',
      subtotal: money(amount, invoice.currency),
      taxTotal: money(tax, invoice.currency),
      total: money(total, invoice.currency),
      appliedAmount: money(applied, invoice.currency),
      unappliedAmount: money(total - applied, invoice.currency),
      metadata: metadataAt(issuedAt, actor, issuedAt, actor, 2),
    };
    dataset.creditMemos.set(memo.id, memo);
    dataset.creditMemoLines.set(`crl_${memo.id.slice(4)}`, {
      id: `crl_${memo.id.slice(4)}`,
      organizationId: ORGANIZATION_ID,
      creditMemoId: memo.id,
      description:
        memo.reason === 'pricing_correction'
          ? 'Pricing correction per contract'
          : memo.reason === 'service_recovery'
            ? 'Service recovery credit — delayed delivery'
            : 'Manual adjustment',
      amount: money(amount, invoice.currency),
      taxAmount: money(tax, invoice.currency),
    });
    if (applied > 0) {
      dataset.creditMemoApplications.set(`cma_${memo.id.slice(4)}`, {
        id: `cma_${memo.id.slice(4)}`,
        organizationId: ORGANIZATION_ID,
        creditMemoId: memo.id,
        invoiceId: invoice.id,
        amount: money(applied, invoice.currency),
        status: 'active',
        createdAt: issuedAt,
      });
      invoice.paidAmount = money(invoice.paidAmount.minor + applied, invoice.currency);
      invoice.outstanding = money(invoice.outstanding.minor - applied, invoice.currency);
      invoice.settlement = invoice.outstanding.minor === 0 ? 'paid' : 'partially_paid';
      if (invoice.outstanding.minor === 0) invoice.collectionState = 'current';
    }
  }
  // Section 82's paid-with-credit-memo invoice: the first, by id, that a credit application
  // settles in full. Read after every memo is written, returns' included, and drawing nothing.
  const creditSettled = [...dataset.creditMemoApplications.values()]
    .filter((application) => application.status === 'active')
    .map((application) => dataset.invoices.get(application.invoiceId))
    .filter(
      (invoice): invoice is Invoice =>
        invoice?.lifecycle === 'open' && invoice.settlement === 'paid',
    )
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (creditSettled) dataset.fixtures.set('edge.invoice.paid_with_credit_memo', creditSettled.id);

  // Refunds for customers holding unapplied credit.
  const refundable = [...dataset.creditMemos.values()].filter(
    (memo) => memo.lifecycle === 'open' && memo.unappliedAmount.minor > 0,
  );
  for (const [index, memo] of random
    .sample(refundable, Math.min(refundable.length, 10))
    .entries()) {
    const postedDate = nextBusinessDayOnOrAfter(addDays(memo.issueDate, random.int(3, 15)));
    if (compareDates(postedDate, today) > 0) continue;
    const postedAt = instantOn(postedDate, random);
    const actor = random.pick(financeActors);
    const refund: Refund = {
      id: formatId('refund', index + 1),
      organizationId: ORGANIZATION_ID,
      refundNumber: formatBusinessNumber('refund', 1_400 + index + 1),
      customerId: memo.customerId,
      creditMemoId: memo.id,
      amount: memo.unappliedAmount,
      method:
        memo.currency === 'BRL'
          ? random.pick(['pix', 'wire'])
          : random.pick(['ach', 'check', 'wire']),
      status: random.chance(0.85) ? 'posted' : 'pending',
      reason: 'Refund of unapplied return credit',
      metadata: metadataAt(postedAt, actor, postedAt, actor, 1),
    };
    if (refund.status === 'posted') {
      refund.postedAt = postedAt;
      memo.appliedAmount = memo.total;
      memo.unappliedAmount = money(0, memo.currency);
      memo.lifecycle = 'fully_applied';
    }
    dataset.refunds.set(refund.id, refund);
  }

  // Invoice edge fixtures (section 82): due today, zero-value, unusually large.
  const dueToday = [...dataset.invoices.values()].find(
    (invoice) =>
      invoice.lifecycle === 'open' && invoice.outstanding.minor > 0 && invoice.dueDate === today,
  );
  if (dueToday) dataset.fixtures.set('edge.invoice.due_today', dueToday.id);
  else {
    const candidate = [...dataset.invoices.values()].find(
      (invoice) =>
        invoice.lifecycle === 'open' &&
        invoice.outstanding.minor > 0 &&
        diffDays(today, invoice.dueDate) >= -3 &&
        diffDays(today, invoice.dueDate) <= 3,
    );
    if (candidate) {
      candidate.dueDate = today;
      candidate.collectionState = 'current';
      dataset.fixtures.set('edge.invoice.due_today', candidate.id);
    }
  }
  const partiallyPaid = [...dataset.invoices.values()].find(
    (invoice) => invoice.lifecycle === 'open' && invoice.settlement === 'partially_paid',
  );
  if (partiallyPaid) dataset.fixtures.set('edge.invoice.partially_paid', partiallyPaid.id);
  const largest = [...dataset.invoices.values()].sort((a, b) => b.total.minor - a.total.minor)[0];
  if (largest) dataset.fixtures.set('edge.invoice.large', largest.id);
  const zeroCustomer = random.pick(
    activeCustomers.filter((customer) => customer.regionCode === 'US'),
  );
  const zeroDate = addDays(today, -6);
  const usd = (minor: number) => money(minor, 'USD');
  const zeroAt = instantOn(zeroDate, random);
  const zeroInvoice: Invoice = {
    id: formatId('invoice', 99_000_001),
    organizationId: ORGANIZATION_ID,
    invoiceNumber: undefined as unknown as string,
    customerId: zeroCustomer.id,
    issueDate: zeroDate,
    dueDate: addDays(zeroDate, 30),
    currency: 'USD',
    lifecycle: 'open',
    collectionState: 'current',
    settlement: 'paid',
    paidAmount: usd(0),
    outstanding: usd(0),
    billingAddress: {
      name: zeroCustomer.legalName,
      line1: 'Address on file',
      city: 'Chicago',
      region: 'IL',
      postalCode: '60609',
      countryCode: 'US',
    },
    paymentTermsCode: zeroCustomer.paymentTermsCode,
    subtotal: usd(0),
    taxTotal: usd(0),
    freight: usd(0),
    total: usd(0),
    costTotal: usd(0),
    writtenOffAmount: usd(0),
    openedAt: zeroAt,
    metadata: metadataAt(zeroAt, financeActors[0] as string, zeroAt, financeActors[0] as string, 2),
  };
  delete (zeroInvoice as { invoiceNumber?: string }).invoiceNumber;
  // A fold, not a spread: an enterprise tenant's invoices are more arguments than a call takes.
  let lastInvoiceNumber = 0;
  for (const invoice of dataset.invoices.values())
    if (invoice.invoiceNumber?.startsWith(`INV-${today.slice(0, 4)}`))
      lastInvoiceNumber = Math.max(lastInvoiceNumber, Number(invoice.invoiceNumber.slice(9)) || 0);
  zeroInvoice.invoiceNumber = formatBusinessNumber(
    'invoice',
    lastInvoiceNumber + 1,
    Number(today.slice(0, 4)),
  );
  dataset.invoices.set(zeroInvoice.id, zeroInvoice);
  dataset.invoiceLines.set('inl_99000001', {
    id: 'inl_99000001',
    organizationId: ORGANIZATION_ID,
    invoiceId: zeroInvoice.id,
    lineNumber: 1,
    description: 'Warranty replacement — no charge',
    quantity: '1',
    unitPrice: usd(0),
    discountBps: 0,
    taxRateBps: 0,
    netAmount: usd(0),
    taxAmount: usd(0),
    totalAmount: usd(0),
  });
  dataset.fixtures.set('edge.invoice.zero_value', zeroInvoice.id);

  void businessDateOf;
  void now;
  void operationalStart;
  return { bankTransactionCount: bankCounter };
}
